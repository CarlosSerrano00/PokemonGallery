const PREFIX = '[OfflineSync]';

function describeDetails(details: unknown): unknown {
  if (details instanceof Error) {
    return { name: details.name, message: details.message };
  }

  if (details && typeof details === 'object') {
    try {
      return JSON.parse(JSON.stringify(details));
    } catch {
      return String(details);
    }
  }

  return details;
}

/**
 * Verifiable, timestamped logs for the academic walkthrough. Only operational
 * metadata is logged: never tokens, secrets or full user records.
 */
export function logEvent(event: string, details?: unknown): void {
  const line = `${PREFIX} ${new Date().toISOString()} ${event}`;
  if (details === undefined) {
    console.log(line);
    return;
  }
  console.log(line, describeDetails(details));
}

export function logWarning(event: string, details?: unknown): void {
  const line = `${PREFIX} ${new Date().toISOString()} ${event}`;
  if (details === undefined) {
    console.warn(line);
    return;
  }
  console.warn(line, describeDetails(details));
}
