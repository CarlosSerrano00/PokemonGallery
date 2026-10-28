# Pokédex Offline

Aplicación móvil Expo/React Native que combina una Pokédex de consulta con una colección personal persistente. Los datos de especies se leen de **PokéAPI** (solo `GET`) y la colección se guarda en **MockAPI**. TanStack Query mantiene una caché persistida en AsyncStorage y reanuda las mutaciones pausadas cuando vuelve la conexión.

> Proyecto académico. La app distingue siempre entre datos confirmados por el servidor, datos en caché y operaciones pendientes de sincronizar.

---

## 1. Stack y versiones

| Paquete | Versión instalada |
| --- | --- |
| Expo SDK | `57.0.31` |
| React Native | `0.86.3` |
| React | `19.2.3` |
| TypeScript | `6.0.3` |
| Expo Router | `57.0.29` |
| TanStack Query | `5.104.5` |
| Persist Query Client | `5.104.5` |
| AsyncStorage Persister | `5.104.5` |
| AsyncStorage | `3.1.1` |
| expo-network | `57.0.3` |

La solución usa las dependencias requeridas por el ejercicio (TanStack Query, persistencia, AsyncStorage y expo-network), ya presentes en el entorno y declaradas en `package.json`. No se añadieron librerías de estado alternativas; ESLint se agregó como herramienta de desarrollo.

---

## 2. Rutas

La navegación usa **Expo Router** con un stack raíz y un grupo de pestañas:

| Ruta | Archivo | Función |
| --- | --- | --- |
| `/` | `src/app/(tabs)/index.tsx` | Pokédex nacional, búsqueda y paginación de 20 |
| `/collection` | `src/app/(tabs)/collection.tsx` | Colección personal, filtros, orden y sincronización |
| `/pokemon/[id]` | `src/app/pokemon/[id].tsx` | Ficha enciclopédica de una especie |
| `/collection/new` | `src/app/collection/new.tsx` | Alta de un registro personal |
| `/collection/[id]` | `src/app/collection/[id].tsx` | Edición de un registro confirmado |

`src/app/_layout.tsx` monta `AppQueryProvider`, el stack y el splash. Las pantallas de formulario se presentan como modal.

---

## 3. Fuentes de datos

### PokéAPI — solo lectura

Base: `https://pokeapi.co/api/v2`

| Operación | Endpoint |
| --- | --- |
| Listado | `GET /pokemon?limit=20&offset=0` |
| Detalle | `GET /pokemon/{id-o-nombre}` |
| Especie | `GET /pokemon-species/{id}` |

El cliente vive en `src/api/pokeapi.ts`. Solo expone funciones `GET`; no existe ninguna escritura contra PokéAPI.

### MockAPI — colección personal

Base configurada:

```env
EXPO_PUBLIC_MOCKAPI_BASE_URL=https://6ade969f4e88f1bba4a53489.mockapi.io
```

Todas las operaciones se hacen contra `${base}/pokemon`:

| Operación | Endpoint |
| --- | --- |
| Listar | `GET /pokemon` |
| Leer uno | `GET /pokemon/{id}` |
| Crear | `POST /pokemon` |
| Editar | `PUT /pokemon/{id}` |

El cliente está en `src/api/mockapi.ts`. No se usa `/coleccion` ni otro proyecto de MockAPI.

### Modelo remoto

```ts
{
  id: string;          // generado por MockAPI, nunca se envía al crear
  pokemonId: number;
  name: string;
  spriteUrl: string;
  region: string;
  captured: boolean;
  priority: number;    // 1..10
  personalType: 'favorito' | 'competitivo' | 'intercambio' | 'pendiente';
  createdAt: string;   // ISO 8601
}
```

Reglas implementadas:

- El payload de creación **no incluye `id`** (`toRemotePayload` en `src/api/mockapi.ts`).
- La edición conserva el `createdAt` original (`src/app/collection/[id].tsx`).
- `PUT` envía el recurso completo (sin `id`) para que MockAPI reemplace el registro de forma consistente.
- Los registros remotos se normalizan antes de entrar a la caché; si faltan campos, se usan valores seguros y se emite un warning. La app nunca borra ni reescribe datos remotos de forma automática.

---

## 4. Caché, persistencia y políticas

El `QueryClient` es único (`src/query/query-client.ts`) y registra políticas por familia de claves:

| Dato | `staleTime` | `gcTime` |
| --- | --- | --- |
| PokéAPI | 60 minutos | 48 horas |
| MockAPI | 2 minutos | 72 horas |
| Persistencia AsyncStorage | — | `maxAge` 24 horas |

`PersistQueryClientProvider` (`src/query/query-provider.tsx`) restaura la caché con:

- `createAsyncStoragePersister` + AsyncStorage.
- Clave `pokedex-offline:query-cache:v1`.
- `buster` `pokedex-offline-v1` para invalidar formatos antiguos.
- Persistencia de queries exitosas de `['pokemon', …]` y `['collection', …]`.
- Persistencia **solo de mutaciones pausadas**.
- `networkMode: 'online'` global y en las mutaciones de colección.
- Reintentos acotados y sin reintentar errores 4xx (`src/query/retry.ts`).

### Claves jerárquicas

Definidas en `src/query/query-keys.ts`:

```ts
pokemonKeys.all                 // ['pokemon']
pokemonKeys.lists()             // ['pokemon', 'list']
pokemonKeys.list({ limit, offset })
pokemonKeys.details()           // ['pokemon', 'detail']
pokemonKeys.detail(id)
pokemonKeys.species(id)

collectionKeys.all              // ['collection']
collectionKeys.lists()          // ['collection', 'list']
collectionKeys.list()
collectionKeys.details()        // ['collection', 'detail']
collectionKeys.detail(id)
```

### Invalidaciones

| Mutación | Invalidación |
| --- | --- |
| Crear | `collectionKeys.lists()` en `onSettled` |
| Editar | `collectionKeys.lists()` y `collectionKeys.detail(id)` en `onSettled` |
| Reconexión | TanStack Query refresca queries stale (`refetchOnReconnect: true`) |
| Pull-to-refresh | `refetch()` explícito de la lista o búsqueda |

La reconciliación optimista actualiza todas las listas cacheadas con `setQueriesData` y el detalle con `setQueryData`.

---

## 5. Flujo offline y reanudación

### Crear sin conexión

1. El formulario detecta `isOnline === false`.
2. Se crea un registro optimista con un `optimisticId` local y `__optimistic: true`.
3. Se registra la mutación con `networkMode: 'online'`; TanStack Query la deja **pausada**.
4. La UI navega a la colección, donde el registro aparece con la etiqueta **«Sin sincronizar»**.
5. Al recuperar la red, `onlineManager` reanuda la mutación.

### Editar sin conexión

1. Se aplica el cambio de forma optimista sobre la lista y el detalle.
2. La mutación `PUT` queda pausada.
3. El registro se muestra como pendiente hasta la confirmación remota.

### Reanudación tras cerrar la app

- Las mutaciones pausadas se hidratan desde AsyncStorage.
- `mutationFn`, `retry`, `onMutate`, `onSuccess`, `onError` y `onSettled` se registran con `setMutationDefaults`, no solo en los hooks. Así una mutación restaurada conserva todo lo necesario para ejecutarse.
- `PersistQueryClientProvider.onSuccess` dispara `resumePausedMutations`.
- La reanudación espera una muestra real de conectividad (máximo 3 s) y **no intenta ejecutar si la conectividad es desconocida o el dispositivo está offline**. Si se intentara a ciegas, un fallo de red podría revertir el registro optimista.
- TanStack Query también reanuda automáticamente al detectar reconexión.

### Reconciliación de creación

MockAPI no ofrece claves de idempotencia. Antes de crear, la app consulta la colección y busca un registro con el mismo `createdAt`, `pokemonId` y `name`. Si lo encuentra, lo reutiliza en lugar de duplicarlo.

Esto es una **reconciliación de mejor esfuerzo**, no una garantía *exactly-once*: si la lectura previa falla y el `POST` sí se completa, podría quedar un duplicado. La limitación está documentada en el código y en este README.

---

## 6. Conectividad

`src/query/network.ts` integra `expo-network` con `onlineManager`:

- Lee `getNetworkStateAsync()` al iniciar.
- Escucha cambios con `addNetworkStateListener`.
- Revisa de nuevo al volver la app a primer plano.
- Considera **conectado e internet alcanzable**; si `isInternetReachable` no está definido, no lo trata como offline.
- Propaga el estado a TanStack Query con `onlineManager.setOnline(...)`.
- Expone `useNetworkStatus()` y un banner de sincronización.

Estados visibles en la UI:

- En línea / sin conexión / comprobando.
- Datos actualizados, en caché o restaurados.
- Mutaciones en curso, pausadas, fallidas o confirmadas.
- «Sin sincronizar» para registros optimistas.

---

## 7. Registros (`[OfflineSync]`)

`src/utils/logger.ts` emite líneas con prefijo, timestamp ISO y metadatos operativos. Nunca registra tokens, secretos ni el contenido completo de un registro.

Ejemplos reales de eventos:

```text
[OfflineSync] 2026-10-26T00:58:46.791Z query-client:init { ... }
[OfflineSync] ... connectivity:change { reason: 'listener', isOnline: false, ... }
[OfflineSync] ... mutation:create:optimistic { optimisticId, pokemonId }
[OfflineSync] ... mutation:paused { mutationId, mutationKey }
[OfflineSync] ... mutations:resume:waiting { paused: 1 }
[OfflineSync] ... mutations:resume:start { paused: 1 }
[OfflineSync] ... collection:cache:reconciled { operation: 'create', id, pokemonId }
```

En el vídeo se pueden mostrar estos eventos en la terminal de Metro o en Logcat.

---

## 8. Interfaz

Diseño inspirado en una enciclopedia tipo WikiDex, con acento rojo Pokédex y superficies de papel cálido:

- Fondo `#F7F4EE`, superficie `#FFFFFF`, texto `#191B20`.
- Acento `#C62828`; modo oscuro con acento `#EF5350`.
- Títulos con serif editorial; cuerpo sans.
- Tarjetas con borde fino, sombra suave y barra de estado.
- Badges de tipo con colores oficiales simplificados.
- Cabecera con Pokébola dibujada en Views (sin imágenes externas).
- Layout responsive: 1 columna en móvil, 2 desde 580 px, 3 desde 820 px.
- Ficha de detalle en dos columnas desde 620 px.
- Insets de pestañas nativas y `SafeAreaView`.

La paleta y las reglas están resumidas en `.opencode/skills/pokedex-wikidex-design/SKILL.md`.

---

## 9. Puesta en marcha

Requisitos: Node.js compatible con Expo SDK 57 y npm.

```bash
npm install
```

Crea el archivo de entorno:

```powershell
Copy-Item .env.example .env
```

Contenido:

```env
EXPO_PUBLIC_MOCKAPI_BASE_URL=https://6ade969f4e88f1bba4a53489.mockapi.io
```

Inicia el servidor:

```bash
npx expo start
```

Atajos:

```bash
npx expo start --web       # versión web/estática
npx expo start --android   # emulador o dispositivo Android
```

Si agregas módulos nativos, usa un development build (`npx expo run:android`) en lugar de Expo Go.

---

## 10. Build de APK con EAS

El perfil `preview` de `eas.json` genera un APK e inyecta la variable de MockAPI:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

Si el repositorio aún no está vinculado a un proyecto de EAS, el CLI pedirá crearlo o enlazarlo. Al terminar, EAS muestra un enlace de descarga del `.apk`. También puedes usar `--local` si tu entorno tiene Android SDK y credenciales configuradas.

> **No se ejecutó este build durante la entrega.** Requiere autenticación y credenciales de EAS. No hay un APK generado en el repositorio.

---

## 11. Verificación realizada

| Comando | Resultado real |
| --- | --- |
| `npx tsc --noEmit` (con rutas tipadas generadas) | ✅ Sin errores |
| `npx expo lint` | ✅ Sin errores ni warnings |
| `npx expo export --platform android` | ✅ Bundle de 1375 módulos, 3.1 MB |
| `npx expo export --platform web` | ✅ Bundle de 928 módulos y 9 rutas estáticas |
| `npx expo-doctor` | ⚠️ 20/21; única alerta: AsyncStorage `3.1.1` frente a `2.2.0` esperado por SDK 57 |
| `GET https://6ade969f4e88f1bba4a53489.mockapi.io/pokemon` | ✅ HTTP 200, cuerpo `[]` |

La alerta de Expo Doctor es intencional: el proyecto conserva AsyncStorage `3.1.1` por requisito. No se degradó la dependencia.

### Lo que **no** se verificó

- No se construyó un APK con EAS.
- No se probó en un dispositivo físico.
- No se activó el modo avión real.
- No se demostró en dispositivo la restauración de caché ni la reanudación tras cerrar la app.
- No se ejecutaron pruebas automatizadas (el proyecto no incluye suite de tests).

Los pasos para validar todo esto manualmente están en [`instrucciones.md`](./instrucciones.md) y el guion de demostración en [`guion-video.md`](./guion-video.md).

---

## 12. Estructura

```text
src/
  api/
    http.ts            # fetch con timeout, errores y logs
    pokeapi.ts         # GET PokéAPI
    mockapi.ts         # CRUD /pokemon, normalización y reconciliación
  app/
    _layout.tsx        # provider, stack, splash
    (tabs)/
      _layout.tsx
      index.tsx        # Pokédex
      collection.tsx   # Mi colección
    pokemon/[id].tsx
    collection/new.tsx
    collection/[id].tsx
  components/ui/       # botones, chips, feedback, banner, página
  features/
    pokedex/           # tarjeta, sprite, badge, buscador
    collection/        # tarjeta y formulario
  hooks/               # queries, mutaciones, sync, tema
  query/
    query-client.ts
    query-keys.ts
    policies.ts
    persistence.ts
    network.ts
    mutation-defaults.ts
    resume-mutations.ts
    retry.ts
  types/
  utils/               # entorno, errores, logs, fechas
```

---

## 13. Decisiones y limitaciones

- **Optimistic UI con identificador local**: el `id` remoto solo existe después de la confirmación. Mientras tanto se usa un `optimisticId` que nunca se envía a MockAPI.
- **Edición de pendientes bloqueada**: un registro creado offline no tiene id remoto estable; se debe sincronizar antes de editar sus campos.
- **Caché de 24 h**: pasado ese tiempo, la persistencia se descarta y la app vuelve a pedir datos (o muestra el estado sin conexión).
- **Paginación offline**: se deshabilita sin conexión; solo se puede consultar la página que ya estaba cargada.
- **Búsqueda offline**: funciona solo si esa ficha ya estaba en caché.
- **MockAPI sin esquema**: los datos remotos se normalizan; un registro malformado se omite y se registra un warning.
- **Sin `exactly-once`**: la reconciliación por `createdAt` reduce duplicados, pero no los elimina en todos los escenarios.
- **AsyncStorage 3.1.1**: se mantiene por requisito aunque Expo Doctor espere 2.2.0.

---

## 14. Documentación adicional

- [`instrucciones.md`](./instrucciones.md): instalación, uso y plan de pruebas manuales.
- [`guion-video.md`](./guion-video.md): guion de exposición y demostración.
- [`.opencode/skills/pokedex-wikidex-design/SKILL.md`](./.opencode/skills/pokedex-wikidex-design/SKILL.md): skill de diseño del proyecto.
