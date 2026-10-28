# DISEÑO.md --- Guía visual de la Pokédex

## Propósito

Esta guía define cómo diseñar la interfaz de **Pokédex Offline**, una
aplicación móvil hecha con React Native y Expo. La referencia visual y
de organización es [WikiDex](https://www.wikidex.net/wiki/WikiDex), una
enciclopedia Pokémon en español.

**Objetivo:** trasladar a una app móvil la sensación de una enciclopedia
Pokémon útil, ordenada y fácil de explorar: contenido organizado por
secciones, navegación clara, búsqueda visible, fichas informativas,
enlaces entre temas y un Pokémon destacado. La app debe tener identidad
propia; no se debe copiar literalmente el sitio, su logotipo, su
composición exacta ni sus recursos gráficos exclusivos.

## 1. Principios de diseño

1.  **Primero la información.** La imagen del Pokémon debe llamar la
    atención, pero el nombre, número, tipos y datos principales deben
    ser fáciles de localizar.
2.  **Estética de enciclopedia.** Presenta la información mediante
    títulos, subtítulos, apartados, etiquetas, tablas compactas y
    tarjetas con propósito claro. Evita que toda la app parezca una
    tienda o un juego de cartas.
3.  **Jerarquía visual constante.** Mantén patrones de título,
    descripción, metadatos, acciones y contenido en todas las pantallas.
4.  **Navegación directa.** El usuario debe poder volver al catálogo,
    buscar otro Pokémon o ir a su colección sin perderse.
5.  **Densidad controlada.** Aprovecha bien la pantalla, pero deja
    espacio entre grupos de contenido y evita bloques de texto largos
    sin división.
6.  **Diseño propio.** Usa WikiDex como inspiración conceptual, no como
    plantilla para calcar. No reproduzcas capturas de pantalla,
    logotipos, iconos propios ni el diseño píxel por píxel.
7.  **Accesibilidad y claridad.** El color no debe ser la única forma de
    comunicar un tipo, estado de captura o sincronización.

## 2. Dirección visual

### Paleta

Usa una paleta inspirada en la temática Pokémon, con rojo como acento,
superficies claras y texto de alto contraste. Centraliza los colores en
un archivo de tema o constantes compartidas.

-   **Rojo de acento:** para acciones principales, selección activa y
    detalles destacados.
-   **Rojo oscuro:** para estados de pulsación o títulos de énfasis;
    comprueba el contraste antes de usarlo para texto pequeño.
-   **Fondo principal:** blanco roto o gris muy claro.
-   **Superficie de tarjetas:** blanco.
-   **Bordes y separadores:** gris claro.
-   **Texto principal:** gris muy oscuro, casi negro.
-   **Texto secundario:** gris medio con contraste suficiente.
-   **Éxito/sincronizado:** verde accesible acompañado de texto o icono.
-   **Pendiente/sin conexión:** ámbar o naranja acompañado de una
    etiqueta explícita.
-   **Error:** rojo oscuro con un mensaje claro y una acción para
    recuperarse.

No uses demasiados colores saturados simultáneamente. Los colores de los
tipos Pokémon pueden aparecer en pequeñas etiquetas, pero el resto de la
interfaz debe seguir siendo consistente.

### Tipografía

-   Usa una tipografía sans serif legible disponible en el proyecto.
-   Mantén una escala tipográfica consistente: título de pantalla,
    título de sección, título de tarjeta, cuerpo y metadatos.
-   Usa negrita para nombres y datos importantes, no para párrafos
    completos.
-   Evita textos diminutos para los números de Pokédex, estados de
    sincronización o datos secundarios.
-   No dependas de mayúsculas sostenidas para crear jerarquía.

### Formas y espaciado

-   Tarjetas con esquinas moderadamente redondeadas, bordes sutiles y
    elevación mínima solo cuando ayude a separar niveles.
-   Mantén un sistema de espaciado coherente, por ejemplo, múltiplos de
    4 u 8.
-   Alinea títulos, imágenes, etiquetas y datos dentro de cada tarjeta.
-   Evita sombras fuertes, gradientes excesivos, efectos de vidrio y
    animaciones decorativas que distraigan del contenido.
-   Usa iconos consistentes y con etiquetas accesibles cuando la acción
    no sea obvia.

## 3. Estructura general de navegación

Implementa una navegación inferior apropiada para móvil con tres
destinos principales:

1.  **Pokédex:** catálogo y búsqueda de Pokémon.
2.  **Mi colección:** registros personales guardados en MockAPI.
3.  **Estado/ajustes:** información breve de conectividad y
    sincronización, además de opciones auxiliares si hacen falta.

Si el proyecto ya tiene una navegación funcional, adáptala sin
reescribirla innecesariamente. La pantalla de detalle debe abrirse desde
el catálogo o la colección y permitir volver fácilmente al origen.

La cabecera de las pantallas debe incluir un título claro. La búsqueda
debe estar visible en el catálogo y ser fácil de activar. Evita menús
ocultos para las acciones más importantes.

## 4. Pantalla Pokédex

Diseña el catálogo como un índice de enciclopedia.

### Cabecera

-   Título de pantalla: **Pokédex**.
-   Una frase breve que explique que permite explorar Pokémon.
-   Campo de búsqueda con placeholder como "Buscar por nombre o número".
-   Indicador discreto de conexión cuando no haya Internet.
-   Opcionalmente, filtros sencillos por tipo si pueden implementarse
    con datos reales.

### Listado

-   Muestra los Pokémon en una cuadrícula de dos columnas cuando el
    ancho lo permita; en pantallas estrechas, adapta la distribución sin
    recortar contenido.
-   Cada tarjeta debe mostrar sprite, número de Pokédex, nombre y tipos
    principales disponibles.
-   El número debe ser legible y visualmente secundario al nombre.
-   Mantén las alturas y alineaciones consistentes.
-   La tarjeta completa puede ser pulsable, con un área táctil
    suficiente.
-   Incluye carga inicial, carga adicional, error con botón de reintento
    y estado vacío.
-   Si hay datos en caché, muéstralos sin esperar a que termine la
    solicitud de red; si se actualizan en segundo plano, usa un
    indicador discreto.

No inventes tipos ni estadísticas para completar tarjetas. Usa la
información recibida de PokéAPI.

## 5. Ficha de detalle del Pokémon

La ficha debe recordar a una entrada enciclopédica móvil, con secciones
claramente separadas.

Orden recomendado:

1.  **Identidad:** nombre, número de Pokédex y sprite grande.
2.  **Tipos:** etiquetas de tipo con texto visible y color
    complementario.
3.  **Datos básicos:** altura, peso y habilidades si la API los
    proporciona.
4.  **Estadísticas:** filas compactas con nombre y valor numérico; si se
    usan barras, muestra también el valor escrito.
5.  **Información de especie:** descripción o datos de especie solo si
    se han obtenido de forma fiable.
6.  **Acción de colección:** botón visible para añadir el Pokémon a Mi
    colección o consultar su registro si ya existe.

Usa encabezados de sección y separadores sutiles. En móvil, evita tablas
anchas que obliguen a desplazarse horizontalmente; convierte los datos
en filas o bloques apilados.

Si un dato no está disponible, omite la sección o muestra un mensaje
discreto. No presentes datos de ejemplo como si fueran datos reales.

## 6. Pantalla «Mi colección»

Esta pantalla muestra únicamente los registros propios obtenidos de
MockAPI y los cambios locales pendientes de sincronización.

### Resumen

En la parte superior puede aparecer un resumen compacto:

-   Total de registros.
-   Pokémon marcados como capturados.
-   Registros pendientes de sincronización.

Estos valores deben calcularse a partir de los datos reales disponibles.
Si la colección está parcialmente cargada o hay una mutación pendiente,
indícalo de forma clara.

### Tarjeta de colección

Cada tarjeta debe mostrar:

-   Sprite.
-   Nombre y número del Pokémon.
-   Región.
-   Estado de captura.
-   Prioridad.
-   Categoría personal (`personalType`).
-   Estado de sincronización, si aplica.
-   Acción de editar.

Usa etiquetas legibles como **Capturado**, **Por capturar**, **Pendiente
de sincronizar** y **Sincronizado**. No dependas solo de colores o
iconos.

Permite ordenar por prioridad. Si agregas filtros, prioriza región,
estado de captura y categoría personal antes de incorporar opciones
innecesarias.

### Formulario de creación y edición

El formulario debe incluir los campos del modelo de MockAPI:

-   `pokemonId`: identificador numérico del Pokémon.
-   `name`: nombre.
-   `spriteUrl`: URL del sprite.
-   `region`: región.
-   `captured`: estado de captura booleano.
-   `priority`: prioridad numérica.
-   `personalType`: categoría personal, por ejemplo `favorito`,
    `competitivo`, `intercambio` o `pendiente`.
-   `createdAt`: fecha ISO de creación, generada al crear el registro.

No pidas al usuario escribir manualmente la URL del sprite si puede
seleccionarse un Pokémon desde la Pokédex y completar automáticamente
`pokemonId`, `name` y `spriteUrl`. Permite editar los campos personales.
Si se permite crear un registro desde un formulario vacío, valida los
datos y explica los errores junto al campo correspondiente.

El `id` lo genera MockAPI automáticamente y no debe solicitarse al
usuario ni enviarse en el cuerpo de creación. En una edición, conserva
`createdAt`.

## 7. Estados offline y sincronización

El modo offline forma parte de la experiencia visual, no debe ser solo
un mensaje técnico.

-   Muestra una banda pequeña y persistente cuando la app detecte que no
    hay conexión, por ejemplo: **Sin conexión · Mostrando datos
    guardados**.
-   Si una mutación queda pausada, muestra una etiqueta **Pendiente de
    sincronizar** junto al registro.
-   Distingue una actualización optimista de una respuesta confirmada
    por el servidor.
-   Al recuperar conexión, indica que se está sincronizando; después
    muestra el estado confirmado si la operación tiene éxito.
-   Si falla la sincronización, conserva la información que corresponda
    y muestra un error comprensible con una acción de reintento cuando
    sea seguro.
-   No muestres "Guardado en MockAPI" hasta que el servidor confirme la
    operación.
-   No bloquees la navegación ni ocultes los datos de caché mientras se
    actualiza la red.

Mantén los mensajes breves y sin jerga. Los detalles técnicos pueden
quedar en logs de desarrollo, no en el mensaje principal de la interfaz.

## 8. Búsqueda, filtros y estados vacíos

-   La búsqueda debe ser fácil de encontrar y tener un botón claro para
    limpiar el texto.
-   No hagas solicitudes repetidas en cada pulsación si una estrategia
    de debounce es adecuada para la implementación.
-   Conserva resultados previamente cargados si una búsqueda falla por
    falta de conexión, sin fingir que corresponden a la nueva consulta.
-   Para listas vacías, explica qué falta y ofrece una acción útil:
    limpiar filtros, buscar un Pokémon o añadir un registro.
-   Para errores, usa mensajes humanos y un botón de reintento.
-   Para carga inicial, usa placeholders o skeletons discretos y
    consistentes con el diseño final.

## 9. Componentes reutilizables

Crea o reutiliza componentes coherentes, por ejemplo:

-   `ScreenHeader`
-   `PokemonCard`
-   `PokemonTypeBadge`
-   `PokemonSearchBar`
-   `SectionHeader`
-   `CollectionStatusBadge`
-   `OfflineBanner`
-   `SyncStatusLabel`
-   `EmptyState`
-   `ErrorState`
-   `LoadingState`
-   `PriorityBadge`

Adapta los nombres a las convenciones del repositorio. Evita duplicar
estilos o lógica entre catálogo, detalle y colección. Los componentes
visuales deben recibir datos y callbacks mediante props, sin acoplarlos
innecesariamente a las llamadas HTTP.

## 10. Accesibilidad y comportamiento móvil

-   Respeta las áreas seguras del dispositivo y no ocultes contenido
    bajo la barra de estado o navegación.
-   Comprueba el comportamiento con teclado abierto en búsqueda y
    formularios.
-   Usa áreas táctiles cómodas.
-   Añade etiquetas accesibles a botones de icono.
-   No comuniques estados únicamente mediante color.
-   Mantén contraste adecuado entre texto y fondo.
-   Permite que el contenido se desplace verticalmente en pantallas
    pequeñas.
-   Evita saltos bruscos de diseño al cargar imágenes.
-   Añade un texto alternativo o etiqueta accesible apropiada para
    imágenes y controles.

## 11. Reglas técnicas para React Native y Expo

-   Implementa los diseños con componentes nativos de React Native.
-   Respeta las dependencias y versiones existentes de Expo.
-   No copies CSS web ni elementos HTML directamente a React Native.
-   Usa `StyleSheet` o el sistema de estilos ya adoptado por el
    proyecto; no añadas una biblioteca de estilos sin necesidad.
-   Centraliza tokens de color, espaciado, tipografía y radios.
-   Mantén separada la presentación de la lógica de TanStack Query.
-   No hardcodees datos de Pokémon que deban proceder de PokéAPI.
-   No confundas la caché de TanStack Query con la persistencia remota
    de MockAPI.
-   Conserva los requisitos de `queryKeys.ts`, persistencia,
    `onlineManager`, `setMutationDefaults`, mutaciones pausadas e
    invalidación.
-   No cambies el esquema remoto de MockAPI para resolver un problema
    visual.

## 12. Qué evitar

No hagas lo siguiente:

-   Copiar exactamente el diseño web de WikiDex.
-   Incrustar una página web de WikiDex dentro de la app como sustituto
    de la interfaz nativa.
-   Usar el logotipo de WikiDex como si fuera la identidad del proyecto.
-   Llenar todas las pantallas de tarjetas, sombras, gradientes o
    animaciones.
-   Usar fuentes diminutas para que quepa más información.
-   Inventar datos cuando una consulta falla.
-   Mostrar estados falsos de sincronización.
-   Crear botones decorativos que no funcionen.
-   Añadir pantallas que no aporten al objetivo de la aplicación.
-   Reemplazar la arquitectura existente sin inspeccionarla primero.

## 13. Criterios de aceptación visual

Antes de dar por terminada la interfaz, comprueba que:

-   La app se siente como una enciclopedia Pokémon móvil y no como una
    tienda genérica.
-   El catálogo permite identificar rápidamente nombre, número e imagen.
-   La ficha de detalle separa los datos en secciones legibles.
-   Mi colección presenta claramente región, captura, prioridad y
    categoría personal.
-   Los estados offline, pendientes, sincronizados y de error son
    distinguibles.
-   Los datos persistidos pueden verse sin esperar a que termine una
    nueva consulta.
-   Los controles principales son accesibles y funcionan.
-   Los componentes mantienen estilos consistentes entre pantallas.
-   No se ha copiado literalmente la composición, identidad o recursos
    exclusivos de WikiDex.
-   La interfaz funciona en pantallas pequeñas y no presenta
    desbordamientos evidentes.

## Referencia

Usa la página de WikiDex como referencia de organización enciclopédica,
navegación por secciones, búsqueda de información y contenido destacado:

-   https://www.wikidex.net/wiki/WikiDex

La referencia orienta el concepto visual; la implementación final debe
ser una interfaz móvil original, coherente con **Pokédex Offline** y con
sus requisitos técnicos.
