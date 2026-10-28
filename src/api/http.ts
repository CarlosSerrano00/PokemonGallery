import { ApiError } from '@/utils/errors';
import { logEvent, logWarning } from '@/utils/logger';

type JsonRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT';
  body?: unknown;
  label: string;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

export async function requestJson<T>(url: string, options: JsonRequestOptions): Promise<T> {
  const { method = 'GET', body, label, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  logEvent('http:request:start', { label, method, url });

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const text = await response.text();
    const elapsedMs = Date.now() - startedAt;

    if (!response.ok) {
      const detail = text.slice(0, 180).replace(/\s+/g, ' ').trim();
      logWarning('http:request:error', {
        label,
        method,
        status: response.status,
        elapsedMs,
      });
      throw new ApiError(`La API respondió con estado ${response.status}.`, {
        status: response.status,
        url,
        detail,
      });
    }

    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch (error) {
      logWarning('http:response:invalid-json', { label, method, elapsedMs });
      throw new ApiError('La API devolvió una respuesta que no es JSON válido.', {
        url,
        cause: error,
      });
    }

    logEvent('http:request:success', {
      label,
      method,
      status: response.status,
      elapsedMs,
    });

    return parsed as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    const aborted = error instanceof Error && error.name === 'AbortError';
    logWarning('http:request:failed', {
      label,
      method,
      elapsedMs: Date.now() - startedAt,
      reason: aborted ? 'timeout' : 'network',
    });

    throw new ApiError(
      aborted
        ? 'La solicitud tardó demasiado. Revisa tu conexión e inténtalo de nuevo.'
        : 'No se pudo conectar con la API. Revisa tu conexión.',
      { url, cause: error },
    );
  } finally {
    clearTimeout(timer);
  }
}
