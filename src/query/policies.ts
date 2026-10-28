const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** PokéAPI data changes rarely, so it stays fresh for one hour. */
export const POKEAPI_STALE_TIME = 60 * MINUTE;
/** Kept in memory for 48 hours while the app is running. */
export const POKEAPI_GC_TIME = 48 * HOUR;

/** The personal collection can change from another session, so refresh often. */
export const MOCKAPI_STALE_TIME = 2 * MINUTE;
/** Collection cache stays in memory for 72 hours. */
export const MOCKAPI_GC_TIME = 72 * HOUR;

/** Persisted AsyncStorage cache is discarded after 24 hours. */
export const PERSIST_MAX_AGE = 24 * HOUR;

export const PERSIST_BUSTER = 'pokedex-offline-v1';
export const PERSIST_STORAGE_KEY = 'pokedex-offline:query-cache:v1';
