const FALLBACK_MOCKAPI_BASE_URL = 'https://6ade969f4e88f1bba4a53489.mockapi.io';

const configuredBaseUrl = process.env.EXPO_PUBLIC_MOCKAPI_BASE_URL;

export const MOCKAPI_BASE_URL = (configuredBaseUrl || FALLBACK_MOCKAPI_BASE_URL).replace(/\/+$/, '');

export const MOCKAPI_POKEMON_ENDPOINT = `${MOCKAPI_BASE_URL}/pokemon`;

export const USING_MOCKAPI_FALLBACK = !configuredBaseUrl;
