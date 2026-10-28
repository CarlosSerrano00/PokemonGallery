# Instrucciones de uso y pruebas — Pokédex Offline

Este documento explica cómo instalar, ejecutar y validar la aplicación. Las pruebas de la sección 6 están diseñadas para ejecutarse en un dispositivo o emulador; **no se marcaron como realizadas** porque la entrega se verificó solo con typecheck, lint, bundles de Metro y una lectura real de MockAPI.

---

## 1. Requisitos

- Node.js y npm compatibles con Expo SDK 57.
- Conexión a internet para la primera carga de PokéAPI y para MockAPI.
- Una de estas opciones:
  - Expo Go actualizado (para una revisión rápida).
  - Emulador Android con Expo Go o development build.
  - Dispositivo Android físico con Expo Go, development build o APK.
- Opcional para APK: cuenta de Expo/EAS y Android SDK si se compila en local.

> Para una demostración fiel de persistencia y reanudación se recomienda un **development build o APK**, no Expo Go. Expo Go comparte el entorno y puede limitar la observación de un arranque en frío real.

---

## 2. Instalación

Desde la raíz del repositorio:

```powershell
npm install
```

Copia el archivo de entorno:

```powershell
Copy-Item .env.example .env
```

Comprueba que contiene exactamente:

```env
EXPO_PUBLIC_MOCKAPI_BASE_URL=https://6ade969f4e88f1bba4a53489.mockapi.io
```

La app siempre llama a `${EXPO_PUBLIC_MOCKAPI_BASE_URL}/pokemon`. Si la variable falta, usa la misma URL como fallback (`src/utils/env.ts`).

---

## 3. Ejecución

```powershell
npx expo start
```

Opciones:

- Pulsa `a` para abrir Android.
- Pulsa `w` para abrir la versión web.
- Escanea el QR con Expo Go en un dispositivo.

Comandos útiles:

```powershell
npx expo start --android
npx expo start --web
npx tsc --noEmit
npx expo lint
```

---

## 4. Recorrido básico de la app

1. **Pokédex** (`/`): carga 20 especies desde PokéAPI.
2. **Buscar**: escribe un nombre o número y pulsa buscar. Ejemplos: `pikachu`, `25`, `charizard`.
3. **Ficha** (`/pokemon/[id]`): tipos, estadísticas, altura, peso, hábitat, generación, habilidades y descripción de especie.
4. **Añadir a mi colección**: abre el formulario modal, elige región, captura, prioridad y categoría personal.
5. **Mi colección** (`/collection`): filtra por capturados, pendientes o sin sincronizar; ordena por prioridad o nombre.
6. **Editar**: toca un registro confirmado para cambiar sus campos personales. Los pendientes de sincronizar no se pueden editar todavía.

La cabecera muestra el estado de conexión. El banner de sincronización informa de operaciones en curso, pendientes, fallidas o confirmadas.

---

## 5. Comportamiento esperado

### Online

- La Pokédex consulta PokéAPI y guarda el resultado en caché.
- Crear o editar espera la respuesta de MockAPI antes de navegar.
- Si MockAPI falla, el formulario muestra el error y no presenta el cambio como confirmado.

### Offline

- Se muestra la última copia guardada de páginas y fichas ya visitadas.
- Si la página actual no tiene copia (por ejemplo, un primer arranque sin red), aparece un estado «Sin datos guardados»; una ficha no cacheada muestra «Sin copia guardada».
- La paginación se deshabilita sin conexión para no mostrar una página vacía con el número equivocado.
- Crear un registro lo muestra de inmediato como **«Sin sincronizar»**.
- Editar un registro confirmado aplica el cambio de forma optimista y lo deja pendiente.
- La operación queda pausada por `networkMode: 'online'`.

### Al recuperar la red

- `expo-network` actualiza `onlineManager`.
- TanStack Query reanuda las mutaciones pausadas.
- La caché se reconcilia con la respuesta de MockAPI.
- El banner muestra la confirmación.

### Tras cerrar y abrir la app

- La caché de queries y las mutaciones pausadas se restauran desde AsyncStorage.
- La reanudación espera una comprobación real de conectividad.
- Si el dispositivo sigue offline, no se ejecuta nada y el registro permanece pendiente.

---

## 6. Plan de pruebas manuales

Ejecuta las pruebas en un dispositivo real o emulador. Marca cada una solo cuando la hayas observado.

### T1 — Carga online de la Pokédex

1. Abre la app con red.
2. Verifica que aparecen 20 tarjetas y el contador de especies.
3. Pulsa **Siguiente** y comprueba que cambia la página.

**Esperado:** datos de PokéAPI, spinner solo durante la carga, sin errores.

### T2 — Búsqueda

1. Busca `pikachu`.
2. Abre la ficha completa.
3. Vuelve y busca un término inexistente, por ejemplo `noexiste123`.

**Esperado:** resultado con sprite y tipos; para el inexistente, mensaje de «no encontramos» sin romper la pantalla.

### T3 — Ficha enciclopédica

1. Abre `/pokemon/25`.
2. Revisa tipos, estadísticas, datos de especie y descripción.
3. Comprueba el estado «PokéAPI · Actualizado» o «Datos en caché».

**Esperado:** ficha completa; si la especie no tiene descripción, se informa sin inventar texto.

### T4 — Alta online

1. Desde una ficha, pulsa **Añadir a mi colección**.
2. Elige región, captura, prioridad y categoría.
3. Guarda.

**Esperado:** navegación a la colección, registro confirmado y visible en MockAPI.

Verifica el registro remoto:

```powershell
Invoke-RestMethod -Uri 'https://6ade969f4e88f1bba4a53489.mockapi.io/pokemon' -Method Get |
  ConvertTo-Json -Depth 5
```

Comprueba que el registro tiene `id` generado por MockAPI y que el `createdAt` enviado se conserva.

### T5 — Edición online

1. Abre un registro confirmado.
2. Cambia región, captura, prioridad o categoría.
3. Guarda.

**Esperado:** `PUT /pokemon/{id}`, actualización visible y `createdAt` sin cambios.

### T6 — Alta offline

1. Carga una ficha con red para que quede en caché.
2. Activa **modo avión** o desactiva Wi-Fi y datos.
3. Abre la ficha cacheada y pulsa **Añadir a mi colección**.
4. Completa el formulario y guarda.

**Esperado:**

- Navegación inmediata a la colección.
- Registro con etiqueta **«Sin sincronizar»**.
- Banner «Sin conexión» o «Cambios pendientes».
- Log `mutation:create:optimistic` y `mutation:paused`.

### T7 — Edición offline

1. Sin conexión, abre un registro confirmado que ya estuviera en la caché de la colección.
2. Cambia la prioridad y guarda.

**Esperado:** cambio visible de inmediato, etiqueta «Sin sincronizar», mutación pausada.

### T8 — Cierre y restauración offline

1. Crea un registro offline (T6).
2. Espera al menos 2 segundos para que el persister escriba (throttle de 1 s).
3. Fuerza la detención de la app.
4. Abre la app **sin red**.
5. Entra en **Mi colección**.

**Esperado:**

- La lista cacheada se restaura.
- El registro pendiente sigue visible como «Sin sincronizar».
- Log `cache:restore:success` con `pausedMutations: 1`.
- No se intenta sincronizar mientras no hay red.

### T9 — Reanudación al recuperar la red

1. Continúa desde T8.
2. Desactiva el modo avión / activa Wi-Fi.
3. Espera unos segundos o trae la app a primer plano.

**Esperado:**

- Log `connectivity:change` con `isOnline: true`.
- Log `mutations:resume:start` y `mutations:resume:finished`.
- La etiqueta «Sin sincronizar» desaparece.
- El registro remoto existe una sola vez (o se reconcilia por `createdAt`).
- Banner de confirmación.

### T10 — Persistencia de caché PokéAPI

1. Con red, abre la página 1 y una ficha.
2. Cierra la app por completo.
3. Desactiva la red y vuelve a abrir.

**Esperado:** la página 1 y la ficha visitada se muestran desde caché. Los botones de paginación están deshabilitados; si abres por enlace una ficha no cacheada, aparece «Sin copia guardada».

### T11 — Caducidad de 24 h

Opcional, requiere manipular la hora o esperar 24 h.

**Esperado:** la persistencia se descarta y la app pide datos de nuevo; sin red, muestra estados sin caché.

### T12 — Error de MockAPI

1. Con red, fuerza un error temporal (por ejemplo, desactiva MockAPI o usa un id inexistente en edición).
2. Intenta guardar.

**Esperado:** mensaje de error, sin presentar el cambio como confirmado. En edición, la colección se reconcilia con el servidor.

---

## 7. Cómo observar los logs

### Terminal de Metro

Los logs `console.log` y `console.warn` aparecen en la terminal donde ejecutas `npx expo start`:

```text
[OfflineSync] 2026-10-26T00:58:46.791Z query-client:init { ... }
[OfflineSync] 2026-10-26T00:59:01.123Z connectivity:change { reason: 'listener', isOnline: false, ... }
[OfflineSync] 2026-10-26T00:59:05.456Z mutation:paused { mutationId: 3, mutationKey: ['collection-mutation','create'] }
[OfflineSync] 2026-10-26T00:59:20.789Z mutations:resume:start { paused: 1 }
[OfflineSync] 2026-10-26T00:59:21.012Z collection:cache:reconciled { operation: 'create', id: '12', pokemonId: 25 }
```

### Android con adb

```powershell
adb logcat | Select-String "OfflineSync"
```

No se registran tokens ni secretos. Las URL de MockAPI son públicas; aun así, no se imprime el cuerpo completo de los registros.

---

## 8. Construir e instalar el APK

### Con EAS (recomendado)

```powershell
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

El perfil `preview` de `eas.json`:

- Genera un APK (`android.buildType: "apk"`).
- Inyecta `EXPO_PUBLIC_MOCKAPI_BASE_URL`.
- Distribución interna.

Si el repositorio no está vinculado todavía, EAS pedirá crear o enlazar un proyecto durante el primer build. Al finalizar, descarga el APK desde el enlace de EAS e instálalo:

```powershell
adb install -r ruta\al\archivo.apk
```

O transfiérelo al teléfono y ábrelo con permiso de «instalar apps desconocidas».

### Build local

Requiere Android SDK, Java y credenciales configuradas:

```powershell
npx eas-cli@latest build --platform android --profile preview --local
```

> El build **no se ejecutó** en esta entrega. No hay APK incluido en el repositorio.

---

## 9. Diagnóstico

Ejecuta estas comprobaciones antes de reportar un problema:

```powershell
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

Resultado esperado en este repositorio:

- TypeScript: sin salida (correcto).
- ESLint: sin errores ni warnings.
- Expo Doctor: 20/21. La única alerta es AsyncStorage `3.1.1` frente a `2.2.0`; se mantiene por requisito.

### La app no muestra datos sin conexión

- Esa página o ficha nunca se cargó.
- La caché superó las 24 h.
- Se borraron los datos de la app.
- La restauración aún no terminó: espera el estado «Restaurando caché local…».

### Un registro pendiente no se sincroniza

1. Comprueba que la red está activa y que la cabecera dice «En línea».
2. Trae la app a primer plano para forzar una nueva comprobación.
3. Revisa los logs: debe aparecer `connectivity:change` y luego `mutations:resume:*`.
4. Si el log dice `mutations:resume:deferred`, la app sigue considerando que no hay conexión.
5. Si hay un error 4xx, la mutación no se reintenta; revisa el endpoint y el payload.

### Hay un duplicado

La reconciliación por `createdAt + pokemonId + name` es de mejor esfuerzo. Si el `GET` previo falló y el `POST` sí se completó, puede aparecer un duplicado. Elimínalo manualmente en MockAPI y documenta el caso; la app no borra datos remotos automáticamente.

### Limpiar la caché local

- Android: Ajustes → Apps → Pokédex Offline → Almacenamiento → Borrar datos.
- O desinstala y vuelve a instalar.
- La clave usada es `pokedex-offline:query-cache:v1`.

### Expo Doctor marca AsyncStorage

Es esperado. No ejecutes `npx expo install --fix` sin revisar: cambiaría la versión fijada por requisito.

---

## 10. Evidencia de la entrega

Verificado realmente:

- `npx tsc --noEmit` → correcto.
- `npx expo lint` → correcto.
- `npx expo export --platform android` → bundle correcto.
- `npx expo export --platform web` → bundle y rutas estáticas correctos.
- `GET /pokemon` en MockAPI → HTTP 200, `[]`.

No verificado:

- APK con EAS.
- Dispositivo físico.
- Modo avión real.
- Persistencia y reanudación en un arranque en frío real.
- Pruebas automatizadas.

Las pruebas T1–T12 son el procedimiento para completar esa validación.
