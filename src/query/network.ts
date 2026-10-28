import { onlineManager } from '@tanstack/react-query';
import type { EventSubscription } from 'expo-modules-core';
import * as Network from 'expo-network';
import { AppState } from 'react-native';
import { useSyncExternalStore } from 'react';

import { logEvent, logWarning } from '@/utils/logger';

export type ConnectivitySnapshot = {
  isOnline: boolean;
  isConnected: boolean | undefined;
  isInternetReachable: boolean | undefined;
  type: Network.NetworkStateType | undefined;
  checkedAt: number | null;
};

export type ConnectivityReason = 'initial-probe' | 'listener' | 'foreground' | 'manual';

const initialSnapshot: ConnectivitySnapshot = {
  // TanStack Query starts optimistic. The first real probe corrects this.
  isOnline: onlineManager.isOnline(),
  isConnected: undefined,
  isInternetReachable: undefined,
  type: undefined,
  checkedAt: null,
};

let snapshot: ConnectivitySnapshot = initialSnapshot;
let listeners = new Set<() => void>();
let subscription: EventSubscription | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let started = false;
let initialization: Promise<ConnectivitySnapshot> | null = null;
let lastLoggedOnline: boolean | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ConnectivitySnapshot {
  return snapshot;
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function resolveOnline(state: Network.NetworkState): boolean {
  const connected =
    state.isConnected ??
    (state.type !== Network.NetworkStateType.NONE && state.type !== Network.NetworkStateType.UNKNOWN);
  const reachable = state.isInternetReachable ?? true;
  return connected && reachable;
}

function applyNetworkState(state: Network.NetworkState, reason: ConnectivityReason): ConnectivitySnapshot {
  const isOnline = resolveOnline(state);
  const previous = snapshot;

  snapshot = {
    isOnline,
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
    checkedAt: Date.now(),
  };

  // `setOnline` drives query pausing/resuming inside TanStack Query.
  onlineManager.setOnline(isOnline);

  if (lastLoggedOnline === null || previous.isOnline !== isOnline) {
    logEvent('connectivity:change', {
      reason,
      isOnline,
      isConnected: state.isConnected ?? null,
      isInternetReachable: state.isInternetReachable ?? null,
      type: state.type ?? null,
    });
    lastLoggedOnline = isOnline;
  } else {
    logEvent('connectivity:probe', {
      reason,
      isOnline,
      isConnected: state.isConnected ?? null,
      isInternetReachable: state.isInternetReachable ?? null,
      type: state.type ?? null,
    });
  }

  emit();
  return snapshot;
}

async function probe(reason: ConnectivityReason): Promise<ConnectivitySnapshot> {
  try {
    const state = await Network.getNetworkStateAsync();
    return applyNetworkState(state, reason);
  } catch (error) {
    // A failed probe must not flip the app to offline on its own. The request
    // error itself remains the source of truth for any remote operation.
    logWarning('connectivity:probe:error', {
      reason,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return snapshot;
  }
}

function initialize(): Promise<ConnectivitySnapshot> {
  if (!initialization) {
    initialization = probe('initial-probe');
  }
  return initialization;
}

/**
 * Waits for the first connectivity sample, with a bounded timeout so cache
 * restoration is never blocked indefinitely by a platform probe.
 */
export async function waitForInitialConnectivity(timeoutMs = 3000): Promise<ConnectivitySnapshot> {
  const timeout = new Promise<ConnectivitySnapshot>((resolve) => {
    setTimeout(() => resolve(snapshot), timeoutMs);
  });
  return Promise.race([initialize(), timeout]);
}

export function startConnectivityMonitoring(): () => void {
  if (started) {
    return stopConnectivityMonitoring;
  }
  started = true;

  logEvent('connectivity:monitoring:start', {
    assumedOnline: onlineManager.isOnline(),
  });

  void initialize();

  try {
    subscription = Network.addNetworkStateListener((state) => {
      applyNetworkState(state, 'listener');
    });
  } catch (error) {
    logWarning('connectivity:listener:error', {
      message: error instanceof Error ? error.message : 'unknown',
    });
  }

  appStateSubscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      void probe('foreground');
    }
  });

  return stopConnectivityMonitoring;
}

export function stopConnectivityMonitoring(): void {
  subscription?.remove();
  subscription = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
  started = false;
  initialization = null;
  listeners = new Set<() => void>();
  logEvent('connectivity:monitoring:stop');
}

export function useNetworkStatus(): ConnectivitySnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Useful for imperative UI decisions outside React. */
export function getConnectivitySnapshot(): ConnectivitySnapshot {
  return snapshot;
}
