# FlowCash — Plan de refactor de arquitectura y diseño visual

Doc de coordinación compartido entre `arch-refactor` y `visual-design` (ver `.claude/agents/`).
Ambos agentes deben leer el estado antes de tocar una pantalla y actualizarlo al terminar.

## Reglas de secuenciación (no negociables)

1. Por feature: primero se completa el pase de **arquitectura** de toda la feature, se corren
   tests + lint, y solo entonces arranca el pase **visual** de esa misma feature.
2. El agente de arquitectura **nunca** toca una pantalla marcada `visual: in-progress` o
   `visual: done` sin autorización explícita del usuario.
3. El agente visual **nunca** toca una pantalla marcada `arch: not-started` o `arch: in-progress`.
4. Orden de features: **Wallet (piloto)** → Vision → Analytics → Dashboard → Auth → Notifications.
   `LandingScreen` y `settings` quedan fuera de este plan por ahora.

## Dirección estética

> Establecida el 2026-09-01 vía el skill `frontend-design`. **Es vinculante para todos los
> pases visuales.** Cualquier desviación se documenta aquí antes de aplicarse, no después.

### El sujeto y la tesis

FlowCash es una app de finanzas personales en español que se abre varias veces al día, de pie
y con una mano. Su trabajo real es responder *"¿cómo voy?"* de un vistazo y dejar registrar un
movimiento en menos de diez segundos. El material propio de este dominio no es el cristal
esmerilado ni el degradado de fintech: es **el libro contable**. Filas regladas, importes
alineados en columna, una sola marca de color para el estado.

**Tesis: superficie plana, línea de hairline, cifra tabular.** El protagonista de cada pantalla
es el número, y todo lo demás se aparta para que se lea.

### La decisión que asumimos (y por qué)

Se abandona el glassmorphism. La app tenía tokens `glass.*` y `gradients.*`, un `GlassCard` sin
usar y un `GradientBackground` que nunca pintó un degradado — la dirección "cristal" estaba
declarada pero no ejecutada. Se resuelve a favor de lo plano por tres razones concretas:

1. El blur en Android es caro e inconsistente; el coste no compra nada en una pantalla cuyo
   contenido es texto y cifras.
2. El fondo claro (`#e8f4e4`, menta) ya lee como papel. Un panel translúcido encima ensucia
   justo el contraste del dato que hay que leer.
3. Un solo lenguaje aplicado bien vence a dos lenguajes aplicados a medias en nueve pantallas.

`glass.*` y `gradients.*` quedan **deprecados** en `src/constants/theme.ts` (marcados con
comentario). Se conservan solo porque todavía los consumen `MetricGlassPill`, `ForecastCard`,
`VisionHeader`, `VisionEntityList`, `BudgetDashboard` y `VisionScreen`; cada uno se limpia en el
pase visual de su pantalla. **No añadir usos nuevos.**

> Progreso: el pase visual de Wallet ya limpió `GlassSegmentedControl` y `TransactionItem`
> (2026-09-01). `ForecastCard` sigue pendiente pese a vivir en `features/wallet/`: solo lo
> renderiza `AnalyticsScreen`, así que le toca en el pase de Analytics.

### Elemento firma: la línea del libro contable

Lo único que se permite ser memorable. Tres reglas, aplicadas sin excepción:

- Toda cifra en lista o tabla usa `<Typography variant="number">` → dígitos tabulares
  (`fontVariant: ["tabular-nums"]`) y alineación a la derecha, para que las columnas de
  importes cuadren verticalmente al hacer scroll.
- Las filas se separan con `StyleSheet.hairlineWidth` en `colors.border`, **no** con cards con
  sombra. Una card es para un *resumen*; una fila es para un *movimiento*.
- El signo del dinero se codifica con color solo cuando aporta información: `success` para
  ingresos, `expense` para gastos, `error` **únicamente** para lo que está mal (sobregiro,
  vencido, fallo). `expense` no es `error`: es rojo por tradición contable (tinta roja para
  débitos), pero un tono desaturado que se lee como "sale dinero", no como alarma — pintar el
  gasto con el mismo rojo que un fallo hace que un mes normal parezca una emergencia.

  > **Actualización 2026-09-01 (pedido explícito del usuario, tras ver el pase de Wallet):**
  > la primera versión de esta regla usaba `text` para gasto, sin color propio. Se corrigió a
  > un token dedicado `colors.expense` porque el usuario quería que el gasto se distinga
  > visualmente de un vistazo, sin volver a `error`. **Retrofit aplicado el 2026-09-01:**
  > `TransactionItem.tsx`, el saldo del día de `TransactionList.tsx` y el signo de
  > `AmountInput.tsx` ya van en `expense` — ver "Retrofit pendiente sobre Wallet".

### Paleta: reglas de uso

La paleta base no cambia (`Colors.light` "Glacial Breeze" / `Colors.dark` "Midnight Teal").
Lo que cambia es cuándo se usa cada token.

| Token | Uso permitido | Prohibido |
|---|---|---|
| `background` | Fondo de pantalla, vía `ScreenBackground` o el screen mismo | Fondo de card sobre el mismo fondo |
| `surface` | Card, sheet, fila elevada, input | Fondo de pantalla completa |
| `surfaceHighlight` | Estado hover/selección suave, chips, botón de cerrar | Superficie por defecto |
| `surfaceActive` | Elemento seleccionado en un grupo (segmented, filtro activo) | Decoración |
| `text` | Todo texto principal | — |
| `textSecondary` | Metadatos, fechas, ayudas, labels. Vía `<Typography muted>` | Texto de acción |
| `border` | Hairlines y bordes de `outlined` | Fondos |
| `primary` | Acción principal, tab activo, acento de foco | Texto blanco encima (ver aviso) |
| `onPrimary` | Contenido (texto/icono/pulgar) **encima** de un relleno `primary` | Como color de texto sobre el fondo de pantalla |
| `secondary` | Enlaces e informativo puntual | Rellenos grandes — es un azul saturado y grita |
| `accent` | Como mucho un elemento por pantalla | Segundo acento compitiendo |
| `success` | Ingreso, estado positivo | Categorización decorativa |
| `expense` | Importe de gasto/débito **únicamente** | Estado de error/fallo — para eso está `error` |
| `warning` / `error` | Estado real del dato (advertencia real / fallo real) | Categorización decorativa, ni gasto normal |

**Aviso de contraste:** en modo claro `primary` es `#78cf6c`, un verde claro. Texto blanco
encima da ~2:1 y **no pasa AA**. Regla: sobre `primary` en claro, el contenido va oscuro; en
oscuro (`#0D9488`) sí puede ir blanco.

Desde el pase visual de Wallet (2026-09-01) esa regla está **codificada en un token**,
`colors.onPrimary` (claro `#0F172A`, oscuro `#FFFFFF`). Todo lo que se pinte encima de un
relleno `primary` — texto de botón, chip seleccionado, pulgar de `Switch`, segmento activo —
usa `onPrimary`; no se vuelve a escribir el blanco a mano. `Button.tsx`, que era la deuda
conocida (`getTextColor()` devolvía `#fff` para `primary`), quedó arreglado en ese mismo pase.
Excepción: sobre un relleno `error` o `icon` el token que contrasta en ambos temas es
`colors.surface`, no `onPrimary`.

### Ritmo de espaciado

Base de 4pt. `Spacing` en `src/constants/theme.ts` (se añadió `sm: 12`, el paso de fila de
lista, entre `s: 8` y `m: 16`).

| Situación | Valor |
|---|---|
| Padding horizontal de pantalla | `Spacing.m` (16) |
| Separación entre secciones | `Spacing.l` (24) |
| Padding interno de card | `Spacing.m` (16) |
| Padding vertical de fila de lista | `Spacing.sm` (12) |
| Separación entre elementos hermanos dentro de un bloque | `Spacing.s` (8) |
| Ajuste óptico junto a un icono | `Spacing.xs` (4) |
| Aire antes de un CTA de cierre / bloque final | `Spacing.xl` (32) |
| Empty state | `Spacing.xxl` (48) |

Fuera de `{2, StyleSheet.hairlineWidth}` para ajustes ópticos y bordes, **no se escriben
números crudos** de espaciado. `gap` es preferible a márgenes encadenados.

`BorderRadius` codifica jerarquía: cuanto mayor la superficie, mayor el radio.
Fila `0` · input/botón `m` (8) · card `l` (16) · sheet `xl` (24, solo esquinas superiores) ·
pill/avatar `round`.

### Escala tipográfica

Definida en `TypographyScale` (`src/constants/theme.ts`), aplicada vía las variantes de
`src/components/atoms/Typography.tsx`. Fuente del sistema; una tipografía propia queda
diferida — lo obligatorio es la consistencia de la escala. Line-heights en rejilla de 4pt.

| Variante | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|
| `display` | 34 / 40 | 700 | La cifra protagonista de la pantalla (saldo del mes) |
| `title` | 28 / 36 | 700 | Título de pantalla |
| `heading` | 22 / 28 | 700 | Título de sección |
| `subheading` | 18 / 24 | 600 | Título de card, header de sheet |
| `body` | 16 / 24 | 400 | Texto por defecto |
| `bodySmall` | 14 / 20 | 400 | Texto secundario denso |
| `caption` | 12 / 16 | 400 | Fechas, metadatos, ayudas |
| `overline` | 11 / 16 | 600 | Etiqueta de sección, en versalitas |
| `button` | 16 / 24 | 600 | Label de acción |
| `number` | 16 / 24 | 600 | Cifra tabular alineada a la derecha (**elemento firma**) |

Notas de migración:

- `h1` / `h2` / `h3` siguen funcionando como **alias** de `title` / `heading` / `subheading`
  (≈63 usos existentes). No usar en código nuevo; cada pase visual convierte los de su pantalla.
- La variante `button` **ya no es `textTransform: "uppercase"`**. Las mayúsculas eran un default
  de Material que rompe la legibilidad del español acentuado y choca con el resto de la app.
- El peso lo trae la variante. `weight` es un *override* puntual, no algo que se pase siempre.
- Color: por defecto `colors.text`; usar la prop `muted` para `textSecondary` en vez de pasar
  `style={{ color: ... }}`.
- Objetivo por pantalla: cero `fontSize` sueltos en `StyleSheet.create` (hoy hay ~14 tamaños
  distintos repartidos por la app). Si hace falta un tamaño que no está en la escala, es señal
  de que la jerarquía está mal, no de que falte un token.
- **Única excepción, establecida en el pase de Wallet:** un `TextInput` no puede renderizarse a
  través de `Typography`. En ese caso se toma el valor **de la escala**
  (`fontSize: TypographyScale.body.fontSize`), nunca un número crudo. Aplica hoy a `Input.tsx`,
  `AmountInput.tsx` y al buscador de `WalletListHeader.tsx`.

### Iconografía

- **Una sola familia: `IconSymbol`** (`src/components/ui/icon-symbol.tsx`, SF Symbols en iOS con
  fallback a Material Icons). `@expo/vector-icons`/`Ionicons` solo donde no exista equivalente
  mapeado; si falta un símbolo, se **añade al `MAPPING`** en lugar de importar otra familia.
- Tamaños: `16` inline con texto · `20` afordancia de fila · `24` navegación y toolbar ·
  `32` empty state / feature. Nada intermedio.
- Color: `colors.icon` por defecto. Solo se colorea el icono cuando codifica estado.
- Un icono nunca va solo si la acción no es obvia: o lleva label, o lleva
  `accessibilityLabel`.

### Movimiento

Tres duraciones y nada más, en `Motion` (`src/constants/theme.ts`):
`fast: 120` (feedback de press) · `enter: 220` (entrada de sheet/modal) · `exit: 180` (salida).

- Easing: `Easing.out(Easing.cubic)` al entrar, `Easing.in(Easing.cubic)` al salir.
- Los sheets entran deslizando desde abajo con el backdrop fundiendo a `BackdropOpacity` (0.45).
- Press: opacidad, no escala.
- **Se respeta "reducir movimiento"** (`AccessibilityInfo.isReduceMotionEnabled`): los sheets
  funden en vez de deslizar. `BottomSheet` ya lo hace; cualquier animación nueva también debe.
- Nada de bucles, parallax ni animación ambiental. Si una animación no comunica un cambio de
  estado, sobra.

### Liquid Glass nativo en iOS — toda la superficie flotante de la pantalla

> Añadido 2026-09-01, pedido explícito del usuario. **Es una regla permanente**: se aplica en
> todo pase visual futuro, no solo en Wallet. No contradice "se abandona el glassmorphism" de
> arriba — ese abandono era sobre el falso vidrio (`rgba(...)` + `BlurView` cross-platform,
> caro e inconsistente en Android). Esto es distinto: **el vidrio real que da el propio SO en
> iOS 26+**, gratis en rendimiento porque lo renderiza el sistema, no la app. La base
> flat/hairline sigue siendo la identidad cross-platform; iOS 26+ obtiene además esta capa
> nativa.
>
> **Actualización 2026-09-01, misma tarde:** el alcance se amplió de "solo filas de lista" a
> **todos los componentes flotantes/elevados de una pantalla** — pedido explícito del usuario
> tras ver el resultado en Wallet. Sigue habiendo una superficie que se queda plana a propósito
> (ver "Qué NO lleva vidrio" abajo): no es un capricho, es como funciona el material en la
> [guía de Apple](https://docs.expo.dev/versions/latest/sdk/glass-effect/) — Liquid Glass es una
> capa que **flota sobre** el contenido de la app, nunca el contenido en sí. Si hasta el fondo
> de pantalla fuera vidrio, no habría nada opaco detrás contra lo que leer la transparencia.

- **Paquete:** `expo-glass-effect` (ya instalado). Exporta `GlassView`, `GlassContainer`,
  `isLiquidGlassAvailable()` e `isGlassEffectAPIAvailable()`.
- **Primitivo compartido:** `src/components/atoms/GlassSurface.tsx` (+ `.ios.tsx` con el vidrio
  real, split de Metro) ya implementa los dos gates obligatorios de abajo. **Reusar este
  componente para cada superficie nueva que se vidrie** — no reimplementar los gates por
  componente.
- **Alcance — lleva vidrio en iOS 26+:**
  - Filas de lista (`TransactionItem`, `CategoryListItem` y equivalentes) — ya hecho.
  - Headers/toolbars flotantes de pantalla (p. ej. `WalletListHeader`: selector de mes,
    segmented control, barra de búsqueda).
  - Controles flotantes: `GlassSegmentedControl` (recupera vidrio real — ya no miente su
    nombre), botones de acción flotante (`FloatingActionMenu`/FAB).
  - `BottomSheet`: el propio sheet (no su backdrop, que sigue siendo el fundido a negro de
    siempre — un backdrop vidriado no tiene sentido, tiene que oscurecer lo de atrás).
- **Qué NO lleva vidrio (a propósito, no es una laguna):**
  - El **fondo/canvas de la pantalla** (`ScreenBackground`, `colors.background`) — es el
    "detrás" contra el que el vidrio de encima tiene que leerse. Sigue plano.
  - Controles **dentro** de un contenedor que ya es de vidrio (inputs y botones dentro de un
    `BottomSheet` vidriado, filas dentro de una lista) — nunca apilar vidrio sobre vidrio.
  - Cards de resumen puntuales que viven directamente sobre el fondo de pantalla (no dentro de
    un header/toolbar flotante) — si hace falta vidriar una, tratarla como el resto: gates +
    `GlassSurface`, no una excepción, pero no es prioridad sobre lo listado arriba.
- **Solo iOS, y solo si el runtime lo soporta.** Nunca importar `expo-glass-effect` en un
  archivo que también se ejecuta en Android/web. Dos formas válidas, según cuánto diverge el
  componente:
  - Divergencia grande (la fila de iOS vale la pena separarla del todo): archivo hermano
    `Componente.ios.tsx` junto al `Componente.tsx` genérico — Metro resuelve el correcto según
    plataforma, así Android/web ni siquiera empaquetan `expo-glass-effect`.
  - Divergencia chica (mismo layout, solo cambia el fondo): `Platform.OS === "ios"` en el mismo
    archivo, con el import de `expo-glass-effect` también detrás de esa condición.
- **Gate obligatorio en tiempo de ejecución**, incluso dentro de la rama iOS: `GlassView` ya
  hace fallback solo a `View` normal en versiones viejas, pero algunas betas de iOS 26 no
  tienen la API y **crashean** en vez de caer con gracia — por eso se comprueba
  `isGlassEffectAPIAvailable()` (o `isLiquidGlassAvailable()`) antes de renderizar `GlassView`,
  y si es `false` se renderiza la fila plana normal, la misma que ve Android.
- **Accesibilidad:** respetar `AccessibilityInfo.isReduceTransparencyEnabled()` — si el usuario
  desactivó la transparencia, fila plana, igual que sin soporte de API.
- **Estilo:** `glassEffectStyle="regular"` (no `"clear"`, que es para overlays sobre contenido
  rico; una fila de lista sobre el fondo de la app usa `regular`). `tintColor` no se fija a
  mano: si hace falta un tinte, sale de `colors.surface`/`colors.surfaceHighlight` del tema
  activo, nunca un hex suelto. `isInteractive` solo si la fila entera es pulsable.
- **Caveat conocido:** poner `opacity: 0` en `GlassView` o en un padre rompe el efecto (deja de
  renderizarse). Para animar entrada/salida de una fila con glass, animar un wrapper con
  Reanimated y alternar `glassEffectStyle` entre el valor deseado y `"none"`, no la opacidad.
- **Ya existe la primitiva: usarla, no reimplementar los gates.**
  `src/components/atoms/GlassSurface.tsx` (+ `.ios.tsx` + `.types.ts`), creada en el retrofit de
  Wallet del 2026-09-01, encapsula todo lo anterior. Una fila de lista de cualquier feature
  futura solo tiene que cambiar su `View` contenedora por `<GlassSurface>`, pasando el layout en
  `style` y el fondo opaco + hairline en `fallbackStyle`. Está cubierta por
  `src/components/atoms/__tests__/GlassSurface.test.tsx`. Solo se escribe un `.ios.tsx` nuevo si
  una fila diverge en algo más que el fondo.

### Lista de verificación de un pase visual

1. Cero literales de color en el archivo (`#`, `rgb(`) salvo el negro del backdrop y sombras.
2. Cero `fontSize` / `fontWeight` sueltos: todo vía variantes de `Typography`.
3. Cero números de espaciado crudos fuera de `{2, hairlineWidth}`.
4. Los importes usan `variant="number"`; `expense` para gasto, `success` para ingreso, `error`
   solo para lo que está mal.
5. Revisado en claro **y** oscuro.
6. Si la pantalla tiene filas de lista: variante iOS con `GlassView`, gateada por
   `isGlassEffectAPIAvailable()` y por `isReduceTransparencyEnabled()`, sin que
   `expo-glass-effect` se importe en el archivo que corre en Android/web.
7. `npm run lint` limpio en los archivos tocados (`--max-warnings=0`).

## Estado legend

`not-started` | `in-progress` | `blocked` | `done`

## Prerequisitos visuales cross-cutting

Se hacen **una sola vez**, antes del primer pase visual (el de Wallet). No se repiten por feature.
Completados el 2026-09-01 (`npm run lint` → 0 errores, 17 warnings preexistentes; `npx tsc
--noEmit` → solo el error preexistente de `src/services/firebaseConfig.ts`). Con esto queda
desbloqueado el pase visual de Wallet.

| Tarea | Estado | Notas |
|---|---|---|
| Consolidar `useTheme()` / `useThemeColor()` legado | done | `Typography.tsx` migrado a `useTheme()` (los overrides `lightColor`/`darkColor` se mantienen, ahora resueltos con `theme` del contexto; se añadió la prop `muted` para `textSecondary`). `themed-view.tsx` verificado: ya usaba `useTheme()`, no el hook legado. Tras la migración `useThemeColor` quedó con cero referencias en todo el repo → `src/hooks/use-theme-color.ts` **borrado**. Cubierto por `src/components/atoms/__tests__/Typography.test.tsx` (claro + oscuro) |
| Borrar `GlassCard.tsx` | done | `src/components/atoms/GlassCard.tsx` borrado. Grep previo: única referencia era su propia definición |
| Borrar `CustomTabBar.tsx` | done | `src/components/ui/CustomTabBar.tsx` borrado. Grep previo: única referencia era su propia definición |
| Resolver `GradientBackground.tsx` | done | Resuelto **renombrando**, no añadiendo gradiente: la dirección estética es superficie plana (ver "Dirección estética"), así que el componente pasa a `src/components/layout/ScreenBackground.tsx` y el nombre deja de mentir. Comportamiento sin cambios (`View` con `colors.background`). Los 3 sitios de import actualizados (`app/(tabs)/statistics.tsx`, `app/(tabs)/balance/index.tsx`, `app/(tabs)/budget/index.tsx`). `expo-linear-gradient` sigue como dependencia pero ya no se espera que este componente la use |
| Crear esqueleto `BottomSheet` | done | `src/components/molecules/BottomSheet.tsx` — backdrop con press-to-dismiss (desactivable con `dismissOnBackdropPress={false}`), slide-up con `Motion.enter`/`Motion.exit` y desmontaje diferido para que se vea la salida, `useSafeAreaInsets` en el padding inferior, grabber, header opcional (`title`, `headerRight`, `hideCloseButton`), `onRequestClose` para el back de Android, y fundido en lugar de slide si "reducir movimiento" está activo. Todo el color sale de tokens. Cubierto por `src/components/molecules/__tests__/BottomSheet.test.tsx`. **Actualización 2026-09-01:** el pase visual de Wallet migró los 7 primeros modales a esta primitiva (`EntitySelectionModal`, `TransactionFilterModal`, `MonthYearPickerModal`, `StreakCalendarModal`, `CategoryFormModal`, `ReceiptScannerModal` y los dos pickers de fecha de los flujos multi/recibo). Sin cambios en la API de la primitiva: aguantó los 7 casos con `title` + `contentStyle` |
| Definir escala tipográfica en `theme.ts` | done | `TypographyScale` + `FontWeight` en `src/constants/theme.ts` (display/title/heading/subheading/body/bodySmall/caption/overline/button/number), aplicada por `Typography.tsx`. `h1`/`h2`/`h3` conservados como alias para los ~63 usos existentes. `variant="button"` deja de ser uppercase. Añadidos también `Motion`, `BackdropOpacity` y `Spacing.sm` (12). Detalle y reglas en "Dirección estética" |
| Documentar dirección estética | done | Sección "Dirección estética" arriba en este mismo doc: tesis (plano + hairline + cifra tabular), elemento firma, reglas de uso de paleta con el aviso de contraste de `primary` en claro, ritmo de espaciado, escala tipográfica, iconografía, movimiento y checklist de pase visual. `glass.*` / `gradients.*` marcados como deprecados en `theme.ts` |

## Tracker por pantalla

| Feature | Pantalla | Arch status | Visual status | Notas arquitectura | Notas visual |
|---|---|---|---|---|---|
| wallet | `TransactionFormScreen.tsx` | done | done | `useTransactionForm.ts` extendido (sync de `categoryPickerSelection` movido al hook); render extraído a `components/transaction-form/` (AmountInput, TransactionTypeSelector, DateField, PaymentTypeDropdown, CategorySelector, EntitySelectorField, RecurrenceSection, FormFooterActions, DeleteHeaderButton); `EntitySelectionModal.tsx` movido a esa carpeta y sus 3 sitios de import actualizados (screen, `ManualMultiTransactionModal.tsx`, `ReceiptScannerModal.tsx` — el plan original decía "un solo import", en realidad eran 3); pantalla quedó en 198 líneas | `EntitySelectionModal` migrado a `BottomSheet` (era `Modal` `pageSheet` a pantalla completa con su propio header y botón "Cerrar"; ahora sheet con header y X de la primitiva, filas a sangre vía `contentStyle`, secciones ACTIVOS/PASIVOS/OTROS deduplicadas en un `map` y check `✓` sustituido por `IconSymbol name="checkmark"`). Tipografía: `overline` para etiquetas de campo, `body`/`bodySmall` en dropdowns y chips, `display` (vía `TypographyScale`, es un `TextInput`) + `tabular-nums` en el importe. Color: fuera los 5 `#FFFFFF` de chips/switches/frecuencias → `colors.onPrimary`; el signo `−` del importe pasa de `error` a `text` (**retrofit 2026-09-01:** y de `text` a `expense`, ver "Alcance de `colors.expense` fuera de la fila de lista"). `TransactionTypeSelector` deja de colorear Gasto en rojo e Ingreso en verde: el seleccionado se marca con `surfaceActive` + peso. Chips de categoría y de entidad unificados en `chipStyles` (`sharedStyles.ts`). Bordes de 1px → `hairlineWidth` |
| wallet | `WalletScreen.tsx` | done | done | `useWalletScreen.ts` creado (compone `useWalletData`/`useWalletTransactions` internamente, sin duplicarlos; 8 `useState` — filtros, visibilidad de 5 modales, búsqueda y estado de voz —, `filteredTransactions`, comando de voz con `fetchWithAuth` movido al hook, handlers de navegación del FAB); render extraído a `components/wallet/` (`WalletListHeader` = selector de mes + segmented control + export + search bar, `WalletFilterToggle`, `VoiceCommandBar` que envuelve `VoiceInputButton`); todos los `style={{...}}` inline movidos a `StyleSheet.create` en el archivo que ahora posee ese bloque (valores sin cambios); pantalla quedó en 229 líneas (antes 532) | **Aquí aterriza el elemento firma.** `TransactionItem` reescrito como fila del libro contable: fuera la card con `glass.cardBg` + sombra, ahora hairline en `border`; fuera las 6 píldoras `rgba(...)` de icono e importe; el importe usa `variant="number"` (tabular, a la derecha) con `success` para ingreso y **`expense` para gasto** (`transfer` en `text`). `TransactionList`: cabecera de sección con hairline, fecha en `overline` y saldo del día en `number` (`success` positivo / `expense` negativo / `text` cero). **Retrofit 2026-09-01:** gasto y saldo negativo pasaron de `text` a `expense`, y la fila obtiene Liquid Glass nativo en iOS 26+ vía `GlassSurface` — ver "Retrofit pendiente sobre Wallet". Modales migrados a `BottomSheet`: `TransactionFilterModal` (además pasa de `useColorScheme()`+`Colors[...]` a `useTheme()`, así respeta el override manual de tema), `StreakCalendarModal` (fuera `#FF9500`/`#8E8E93`/`#5AC8FA`/`#34C759` y los rellenos con alfa `+"20"`; el estado del día se codifica en el color del dígito/icono sobre `surfaceHighlight`) y `MonthYearPickerModal` (también migrado a `useTheme()`). `MonthSelector` pierde el `BlurView` (superficie plana). `GlassSegmentedControl` deja de usar `colors.glass.*` → `surfaceHighlight` + hairline, y su texto pasa a `overline`/`onPrimary`. `ExportButton`: `#4F46E5` y `Ionicons` → `colors.icon`/`colors.primary` + `IconSymbol`. FAB: `#FF9500` → `colors.warning` y "Nuevo Gasto" de `error` → `text`. Buscador: panel translúcido con sombra → `surface` + hairline |
| wallet | `CategoriesScreen.tsx` | done | done | `useCategoriesScreen.ts` creado (fetch de categorías, CRUD con `addCategory`/`updateCategory`/`deleteCategory`, estado de modal add/edit, handlers); render extraído a `components/categories/` (`CategoriesHeader` = back + título + botón agregar, `CategoryListItem`, `CategoriesList` = FlatList + empty state, `modals/CategoryFormModal.tsx`); todos los `style={{...}}` inline movidos a `StyleSheet.create` en el archivo que ahora posee ese bloque (valores sin cambios, incluido mover `shadowColor: "#000"` — constante, no de tema — al `StyleSheet` del modal); pantalla quedó en 71 líneas (antes 304) | `CategoryFormModal` migrado a `BottomSheet`: desaparecen el overlay `rgba(0,0,0,0.5)` y el `shadowColor: "#000"` (los pone la primitiva), y con ellos la prop `colors` que ya no hacía falta (quitada también del sitio de llamada). `CategoryListItem` deja de ser una `Card` y pasa a fila con hairline — una card es para un resumen, una fila es para un elemento de lista (**retrofit 2026-09-01:** además Liquid Glass nativo en iOS 26+ vía `GlassSurface`; sin cambio de color, no tiene importe con signo). Cabecera: `h3` → `subheading`, fondo `surfaceHighlight` → `background` (no hay razón para una banda de color sobre la pantalla), iconos a `colors.icon`, `hitSlop` y `pressed` con tokens, más `accessibilityLabel` en los dos botones. **Delta de comportamiento:** pulsar el backdrop ahora cierra el formulario (antes solo cerraba el teclado); es el comportamiento estándar de `BottomSheet` y el mismo que el resto de sheets de la feature |
| vision | `LiabilityPaymentsManagementScreen.tsx` | not-started | not-started | No tiene `StyleSheet.create` — primera adopción; 23 estilos inline a mover | |
| vision | `VisionScreen.tsx` | not-started | not-started | | |
| analytics | `AnalyticsScreen.tsx` | not-started | not-started | | |
| dashboard | `DashboardScreen.tsx` | not-started | not-started | Crear `src/features/dashboard/hooks/`, `useDashboardScreen.ts` para los 15 `useMemo` | |
| auth | `RegisterScreen.tsx` | not-started | not-started | Crear `src/features/auth/hooks/`, `useRegisterForm.ts` | |
| auth | `LoginScreen.tsx` | not-started | not-started | Crear `useLoginForm.ts` | Reemplazar `#FFEBEE` hardcodeado por el token `error` existente en `theme.ts` |
| notifications | `NotificationsScreen.tsx` | not-started | not-started | Crear `src/features/notifications/hooks/useNotificationsScreen.ts`; reutilizar `EditNotificationModal.tsx` existente | |

## Decisiones tomadas durante el pase visual de Wallet

Se documentan aquí, no en el commit, porque afectan a pantallas que todavía no se han pasado.

- **Token nuevo `onPrimary`** (`Colors.light` = `#0F172A`, `Colors.dark` = `#FFFFFF`). No cambia la
  paleta base: **codifica en un solo sitio** el aviso de contraste que ya estaba escrito en la
  dirección estética ("sobre `primary` en claro el texto va oscuro"). Antes ese blanco estaba
  repetido a mano en 9 sitios de wallet más `Button.tsx`.
- **`Button.tsx` arreglado** (la deuda que la dirección dejaba para "el primer pase visual que
  toque un botón primario" — es este, vía `FormFooterActions`). `getTextColor()` ya no devuelve
  `#fff`: `outline`/`ghost` → `primary`, el resto → `onPrimary`, y deshabilitado → `surface`
  (que es lo que contrasta contra el relleno `colors.icon` en ambos temas). Se quitó el
  `weight="medium"` que pisaba el 600 de la variante `button`, y `paddingVertical: 12` → `Spacing.sm`.
- **`Input.tsx`**: `fontSize: 16` → `TypographyScale.body.fontSize` (un `TextInput` no puede usar
  `Typography`), label a `<Typography muted>` y los dos `style={{...}}` inline al `StyleSheet`.
- **Excepción documentada a "cero `fontSize` sueltos":** `AmountInput` y el buscador de
  `WalletListHeader` son `TextInput`, que no admiten `Typography`. Toman el tamaño de
  `TypographyScale` (`display` y `body`) en lugar de un número crudo. Es la única forma de estar
  en la escala en un `TextInput`; se aplicará el mismo patrón en el resto de features.
- **`icon-symbol.tsx`**: se añadieron al `MAPPING` 13 símbolos que la feature ya usaba sin estar
  mapeados (`arrow.left`, `checkmark`, `trash`, `camera`, `flame.fill`, `snowflake`, `lock.open`,
  `line.3.horizontal.decrease.circle(.fill)`, `chevron.up`, `square.and.pencil`, `info.circle`,
  `square.and.arrow.up`). En Android/web esos iconos **no pintaban nada**. Es lo que manda la
  sección "Iconografía": si falta un símbolo se añade al mapping, no se importa otra familia.

## Pendiente / marcado para `arch-refactor` (encontrado en el pase visual de Wallet)

No se tocó nada de esto: son problemas de estructura o de lógica, no de acabado visual.

- `TransactionModal.tsx` (710 líneas) y `TransactionDetailModal.tsx` (657) siguen sin descomponer.
  Se migró el envoltorio de los flujos que los abren (`ManualMultiTransactionModal`,
  `ReceiptScannerModal` y sus pickers de fecha, todos a `BottomSheet`), pero **su interior queda
  sin pase visual** hasta que arquitectura los parta. Ambos siguen usando el alias `h3`.
- `ReceiptScannerModal`: en el paso de fecha, "Aceptar" y "Cancelar" ejecutan exactamente lo
  mismo (`setShowDatePicker(false); setTransactionCarouselVisible(true)`). Se conservó tal cual
  y se extrajo a `leaveDateStep()` con un comentario. Es un bug de flujo, no de estilo.
- `ForecastCard.tsx` vive en `features/wallet/components/` pero **solo lo renderiza
  `AnalyticsScreen`**. Su limpieza de `colors.glass.cardBg` corresponde al pase visual de
  Analytics; conviene moverlo de carpeta en el pase de arquitectura de esa feature.
- `WalletHeader.tsx`, `QuickActions.tsx`, `StreakBadge.tsx`, `FinancialWeatherWidget.tsx` y
  `TransactionCarouselModal.tsx` están en `features/wallet/components/` pero **ninguna de las tres
  pantallas del tracker los renderiza**. Sin pase visual por ahora; verificar si siguen vivos.
- `GlassSegmentedControl` ya no usa `glass.*`, así que el nombre miente igual que lo hacía
  `GradientBackground`. **No se renombró** porque lo consume también
  `features/dashboard/components/DashboardPeriodControls.tsx`, cuya pantalla no está pasada;
  renombrar tocaría archivos fuera de alcance. Renombrarlo a `SegmentedControl` en el pase de
  Dashboard.
- `RecurringTransactionsScreen.tsx` y `TransactionDetailsScreen.tsx` (misma feature, no están en
  el tracker) siguen con `#FFF` suelto y aliases `h1`/`h3`.

## Retrofit pendiente sobre Wallet (regla añadida 2026-09-01, después de cerrar el pase)

El usuario pidió dos cambios a la dirección estética **después** de que el pase visual de
Wallet ya estaba cerrado. Ambos quedaron incorporados arriba como reglas permanentes; falta
aplicarlos retroactivamente a lo que ya se hizo:

- [x] `TransactionItem.tsx`: cambiar el color del importe de gasto de `colors.text` a
  `colors.expense` (token nuevo en `theme.ts`). Hecho. `transfer` se queda en `text`: no es un
  débito, no mueve saldo neto, y la tabla de paleta reserva `expense` para "importe de
  gasto/débito únicamente".
- [x] `TransactionItem.tsx` (o el nuevo componente que lo reemplace): fila con `GlassView`
  nativo en iOS 26+, gateada por `isGlassEffectAPIAvailable()` +
  `isReduceTransparencyEnabled()`, con fallback a la fila plana actual. Ver la sección
  "Liquid Glass nativo en iOS" arriba para el contrato completo. Hecho vía la primitiva
  compartida `GlassSurface` (ver abajo).
- [x] `CategoryListItem.tsx`: mismo tratamiento de `GlassView` en iOS (también es un item de
  lista). No lleva importe con signo, así que `colors.expense` no aplica ahí. Hecho, misma
  primitiva.
- [x] Revisar si `expense` aplica en otros lugares de Wallet que muestran signo de gasto fuera
  de la lista (p. ej. el importe en `TransactionFormScreen`/`AmountInput` cuando `type ===
  "expense"`, hoy en `text` tras el pase de arquitectura+visual). Revisado; ver
  "Alcance de `colors.expense` fuera de la fila de lista" abajo.

### Retrofit ronda 2 — ampliar el vidrio a toda la superficie flotante de `WalletScreen`

Pedido explícito del usuario el mismo día, tras ver el resultado limitado a filas de lista.
Alcance ampliado arriba en "Liquid Glass nativo en iOS — toda la superficie flotante de la
pantalla". Antes de este retrofit, el usuario ya había tocado a mano 3 archivos preparando el
terreno (quitados los hairlines de `sectionHeader`, agregado `marginHorizontal`/
`ItemSeparatorComponent` en `TransactionList.tsx`, `marginHorizontal` en
`WalletListHeader.tsx`, comentado el `paddingHorizontal` del contenedor en `WalletScreen.tsx`)
— **revisar esos cambios y conservarlos como base**, no revertirlos; son layout, no van contra
ninguna regla de la dirección estética, y probablemente sea justo el respiro que necesitan las
superficies vidriadas de abajo para no verse encimadas.

- [ ] `WalletListHeader.tsx`: el bloque completo (selector de mes + `GlassSegmentedControl` +
  barra de búsqueda) como una sola superficie `GlassSurface`, o cada control por separado —
  decidir según cómo luzca, documentar la elección.
- [ ] `GlassSegmentedControl.tsx`: recuperar vidrio real vía `GlassSurface` en su fondo (dejó de
  usar `colors.glass.*` en el pase visual; ahora puede volver a ser vidrio pero con el
  material nativo, no el `rgba(...)` viejo). En Android/web sigue con `surfaceHighlight` +
  hairline, sin cambios.
- [ ] FAB / `FloatingActionMenu`: vidrio en el botón flotante y/o el menú que despliega.
- [ ] `BottomSheet.tsx`: el propio panel del sheet en `GlassSurface` (no el backdrop, que sigue
  siendo el fundido a negro de `BackdropOpacity`). Con esto se propaga a los ~7 modales de
  Wallet que ya usan `BottomSheet` sin tocarlos uno por uno.
- [ ] Confirmar que nada quedó vidrio-sobre-vidrio: si `WalletListHeader` es glass y vive dentro
  de un contenedor que también se vidrió, corregir.
- [ ] Actualizar los comentarios de `GlassSurface.tsx`/`.ios.tsx`, que hoy dicen "fila de
  lista" — ya no es solo eso.

### Cómo se hizo el split de iOS (y por qué no fue `TransactionItem.ios.tsx`)

La sección "Liquid Glass nativo en iOS" ofrece dos formas: archivo hermano `.ios.tsx` cuando la
divergencia es grande, o `Platform.OS === "ios"` en el mismo archivo cuando es chica. Aquí la
divergencia es **chica** —el layout de la fila, el icono, la copy y el importe son idénticos;
lo único que cambia es el tratamiento de fondo— pero la opción de `Platform.OS` obliga a meter
`expo-glass-effect` detrás de un `require()`, que Metro empaqueta igual en Android/web y que
además dispara `@typescript-eslint/no-require-imports`. Y duplicar `TransactionItem` entero en
un `.ios.tsx` (170 líneas) para cambiar el fondo dejaría dos copias que se desincronizan.

Se resolvió aislando **solo la divergencia** en una primitiva visual compartida, con el split
de plataforma a nivel de esa primitiva:

- `src/components/atoms/GlassSurface.tsx` — variante genérica (Android/web): `View` plano.
- `src/components/atoms/GlassSurface.ios.tsx` — variante iOS: los dos gates y `GlassView`.
- `src/components/atoms/GlassSurface.types.ts` — el tipo compartido por ambas.

Metro resuelve `.ios.tsx` por plataforma (mismo patrón que el `icon-symbol.tsx` /
`icon-symbol.ios.tsx` que ya existía), así que **`expo-glass-effect` no entra en el bundle de
Android/web**, que es el requisito duro de la sección. `TransactionItem.tsx` y
`CategoryListItem.tsx` siguen siendo un solo archivo cada uno y solo cambian su `View` de fila
por `<GlassSurface>`. La lógica de gating vive en un único sitio y es testeable una sola vez.

Contrato de `GlassSurface`: `style` son los estilos de layout (aplican siempre) y
`fallbackStyle` son los que **solo** valen sin cristal (fondo opaco + hairline). Con `GlassView`
activo el material del sistema ya separa una fila de la siguiente, así que el hairline se
retira: dejarlo puesto sumaría una línea sobre un borde que el material ya dibuja, y el fondo
opaco taparía el propio efecto. `colorScheme` se ata al tema **de la app** (`useTheme().theme`),
no al del SO, porque FlowCash tiene su propio toggle y puede ir en oscuro con el sistema en
claro.

**A verificar en simulador (no comprobable aquí):** `TransactionItem` va dentro de un
`Swipeable`. La fila plana es opaca a propósito, para tapar la acción de borrado roja que hay
debajo; con cristal la fila es translúcida, así que durante el swipe el rojo podría transparentar
más de la cuenta. Si molesta, el arreglo es un `tintColor={colors.surface}` en el `GlassSurface`
de esa fila (el prop ya está en el contrato, y sale de un token, no de un hex).

### Alcance de `colors.expense` fuera de la fila de lista

La regla de la sección "Elemento firma" habla de "el signo del dinero", no de "las filas de
lista", así que **sí extiende** fuera de `TransactionItem`. Aplicado en dos sitios más:

- `AmountInput.tsx`: el signo `+`/`−` pasa de `text` a `success`/`expense` según `type`. El
  número que el usuario teclea se queda en `colors.text`: es un campo editable, y pintar de rojo
  el texto que se está escribiendo lee como error de validación, justo lo que `expense` intenta
  no significar. Transferencia sigue en `text`.
- `TransactionList.tsx`, saldo del día: negativo pasa de `text` a `expense` (positivo sigue en
  `success`, cero en `text`). El comentario que había justificaba el `text` con "el rojo se
  reserva para lo que está mal" — pero eso se escribió cuando el único rojo disponible era
  `error`. Con `expense` ese motivo desaparece, y dejar la cabecera en negro mientras las filas
  de debajo van en rojo rompía la columna.

Fuera de eso no hay más importes con signo en Wallet (`grep` de `colors.text` sobre
`components/transaction-form/` solo devolvía `AmountInput`). `TransactionModal.tsx` y
`TransactionDetailModal.tsx` siguen sin pase visual a la espera de que arquitectura los parta;
cuando les toque, aplicarles la misma regla.

## Fuera de alcance (por ahora)

- `LandingScreen.tsx` — verificar complejidad real antes de agendar
- `settings` — no existe pantalla todavía; si se crea, hacerla hook-first desde el día 1
- Revivir `CustomTabBar.tsx` como tab bar custom — decisión de producto separada
- Rebranding de ícono/splash — necesita assets/aprobación explícita del usuario

## Log de verificación

| Pantalla | `npm test` | `npm run lint` | Fecha |
|---|---|---|---|
| Prerequisitos visuales cross-cutting (sin pantalla) | `npx jest src/components/atoms/__tests__/Typography.test.tsx src/components/molecules/__tests__/BottomSheet.test.tsx` → 7/7 pasan. Son suites nuevas escritas para verificar las dos primitivas compartidas creadas aquí (`Typography` con la escala nueva en claro y oscuro; `BottomSheet` render/backdrop/dismiss desactivado/desmontaje tras la salida). Ninguna suite preexistente toca los archivos modificados. | Limpio: `npx eslint --max-warnings=0` sobre los archivos tocados (`Typography.tsx`, `BottomSheet.tsx`, `ScreenBackground.tsx`, `theme.ts`, las 3 rutas de `app/(tabs)/` y las 2 suites nuevas) → 0 problemas. `npm run lint` global → 0 errores, 17 warnings preexistentes (mismos de siempre). `npx tsc --noEmit` → solo el error preexistente de `src/services/firebaseConfig.ts`. | 2026-09-01 |
| `TransactionFormScreen.tsx` | Parcial: 3/8 pasan (`npx jest .../TransactionFormScreen.test.tsx`). Los 5 fallos son preexistentes y no relacionados al refactor de arquitectura: 3 comparan contra copy que nunca existió en este screen (`"Nuevo Gasto"`/`"Nuevo Ingreso"`/`"Editar Transacción"` vs. el `headerTitle` real `"Agregar"`/`"Editar"`), y 2 buscan un botón "Icon: chevron.left" que el screen nunca renderiza (no hay `headerLeft` custom) y el trash icon vía `HeaderButton` (que en iOS usa `@expo/ui/swift-ui`, no `IconSymbol`, por lo que el mock de `IconSymbol` no aplica). Se arreglaron los mocks legítimamente rotos por la reubicación/estructura (`jest.mock` de `EntitySelectionModal` al nuevo path, mock de `@/contexts/ThemeContext` y de `Stack.Screen` que faltaban y bloqueaban el render por completo, sin tocar ningún `expect()`). | Limpio: `npx eslint --max-warnings=0` sobre todos los archivos tocados → 0 problemas. `npm run lint` global → 0 errores, 17 warnings preexistentes sin relación a este cambio. | 2026-09-01 |
| `WalletScreen.tsx` | Falla, preexistente y no relacionada al refactor de arquitectura: `npx jest src/features/wallet/screens/__tests__/WalletScreen.test.tsx` no llega a correr ningún test — la suite falla al importar (`Cannot find native module 'ExpoTextRecognition'`, disparado por `expo-text-recognition` dentro de `ReceiptScannerModal.tsx`, que `WalletScreen.tsx` ya importaba antes de este refactor). Verificado con `git stash` (stash de los 3 archivos tocados/nuevos, re-run del mismo test, mismo error exacto en la misma línea de import, `git stash pop` para restaurar) — el fallo es de configuración de Jest para un módulo nativo, no del código movido; no había ningún `jest.mock(...)` para actualizar. | Limpio: `npx eslint --max-warnings=0` sobre los archivos tocados (`WalletScreen.tsx`, `useWalletScreen.ts`, `components/wallet/VoiceCommandBar.tsx`, `WalletListHeader.tsx`, `WalletFilterToggle.tsx`) → 0 problemas. `npm run lint` global → 0 errores, 17 warnings preexistentes sin relación a este cambio (mismos que en la fila anterior). `npx tsc --noEmit` → sin errores en archivos de wallet (el único error del proyecto es preexistente en `src/services/firebaseConfig.ts`, no tocado). | 2026-09-01 |
| `CategoriesScreen.tsx` | No existe archivo de test para este screen (`find` sobre el repo no encuentra `CategoriesScreen.test.tsx` ni spec colocado; tampoco existía antes del refactor). `npx jest CategoriesScreen` → "No tests found, exiting with code 1" (esperado, no hay suite que correr; no había mocks que actualizar). | Limpio: `npx eslint --max-warnings=0` sobre los archivos tocados (`CategoriesScreen.tsx`, `useCategoriesScreen.ts`, `components/categories/CategoriesHeader.tsx`, `CategoryListItem.tsx`, `CategoriesList.tsx`, `modals/CategoryFormModal.tsx`) → 0 problemas. `npm run lint` global → 0 errores, 17 warnings preexistentes sin relación a este cambio (mismos que en las filas anteriores). `npx tsc --noEmit` → sin errores en archivos de wallet (el único error del proyecto sigue siendo el preexistente en `src/services/firebaseConfig.ts`, no tocado). | 2026-09-01 |
| Pase visual de Wallet — `TransactionFormScreen.tsx` | `npx jest src/features/wallet/components/transaction-form/__tests__/EntitySelectionModal.test.tsx` → 6/6 pasan. Suite nueva: cubre el sheet migrado (header, grupos, filtrado por búsqueda), que se preserva el comportamiento seleccionar→cerrar y la fila "Ninguno", el dismiss por backdrop de `BottomSheet`, y que el hairline de fila se resuelve desde `Colors.light.border` / `Colors.dark.border` (verificación claro+oscuro sin simulador, forzando `useColorScheme`). La suite preexistente `TransactionFormScreen.test.tsx` sigue en **3/8, exactamente el mismo resultado que antes del pase** (los 5 fallos son los preexistentes ya documentados en la fila de arquitectura: copy que nunca existió y un botón `chevron.left` que el screen no renderiza). | Limpio: `npx eslint --max-warnings=0` sobre todos los archivos tocados → 0 problemas. `npx tsc --noEmit` → sin errores. | 2026-09-01 |
| Pase visual de Wallet — `WalletScreen.tsx` | `npx jest src/components/molecules/__tests__/TransactionItem.test.tsx src/features/wallet/components/__tests__/MonthYearPickerModal.test.tsx src/features/wallet/components/__tests__/TransactionFilterModal.test.tsx` → 18/18 pasan. Suites nuevas: (a) `TransactionItem` verifica el elemento firma — `fontVariant: tabular-nums` + `textAlign: right`, gasto en `text` y **no** en `error`, ingreso en `success`, signo `−`/`+`, separación por `hairlineWidth` en `border` sin `shadowOpacity`/`elevation`, y todo lo anterior resuelto también con el tema oscuro activo; (b) `MonthYearPickerModal` verifica el sheet migrado (meses, paso de año sin cerrar, seleccionar→cerrar, dismiss por backdrop, modo año) y que el mes seleccionado usa `onPrimary` en claro **y** en oscuro; (c) `TransactionFilterModal` verifica header/secciones, aplicar y limpiar con los mismos callbacks, el dropdown que se despliega en sitio, el dismiss por backdrop, y que renderiza en oscuro (antes leía `useColorScheme()` directo). La suite preexistente `WalletScreen.test.tsx` sigue sin poder importarse por `Cannot find native module 'ExpoTextRecognition'` — **mismo fallo exacto que antes del pase**, es config de Jest para un módulo nativo. | Limpio: `npx eslint --max-warnings=0` sobre todos los archivos tocados → 0 problemas. `npx tsc --noEmit` → sin errores. | 2026-09-01 |
| Pase visual de Wallet — `CategoriesScreen.tsx` | `npx jest src/features/wallet/components/categories/__tests__/CategoryFormModal.test.tsx` → 6/6 pasan. Suite nueva (sigue sin existir test del screen en sí): título del sheet por modo, valor mostrado y `onChangeName`, Cancelar/Guardar cableados a los mismos callbacks, dismiss por backdrop, y que las filas de `CategoriesList` se separan con `hairlineWidth` en `Colors.light.border` / `Colors.dark.border` más el empty state. | Limpio: `npx eslint --max-warnings=0` sobre todos los archivos tocados → 0 problemas. `npx tsc --noEmit` → sin errores. | 2026-09-01 |
| Pase visual de Wallet — global (cierre) | `npx jest` completo: 8 suites pasan / 7 fallan, todas las fallidas **preexistentes y ajenas al pase** — `LoginScreen`/`RegisterScreen` (`useTheme must be used within a ThemeProvider`, lanzado desde el propio `LoginScreen.tsx:41`, archivo no tocado y sin `ThemeProvider` en su test), `VisionScreen`/`BudgetScreen` (`WorkletsError: Native part of Worklets doesn't seem to be initialized`, en el import de `react-native-reanimated`), `AnalyticsScreen` (`No safe area value available`), más las dos de wallet ya explicadas arriba. Ninguna toca un archivo modificado en este pase. | `npm run lint` global → **0 errores, 16 warnings** (uno menos que los 17 preexistentes: se arregló el `catch (error)` sin usar de `StreakCalendarModal.tsx`, archivo que este pase reescribía de todas formas). `npx tsc --noEmit` → **0 errores**. | 2026-09-01 |
| Retrofit sobre Wallet — `colors.expense` + Liquid Glass en items de lista | `npx jest src/components/atoms/__tests__/GlassSurface.test.tsx` → 5/5 pasan. Suite nueva, y la que importa aquí: como `jest-expo` corre con `haste.defaultPlatform: "ios"`, Jest resuelve `GlassSurface.ios.tsx`, así que el suite ejerce **la variante real de iOS**, no la genérica (lo confirman los asserts sobre `glassEffectStyle`/`colorScheme`, que solo existen en esa rama). Cubre los dos gates por separado — `isGlassEffectAPIAvailable() === false` → fila plana con hairline en `border`; API disponible pero `isReduceTransparencyEnabled() === true` → también fila plana — más el camino feliz (`glassEffectStyle="regular"`, sin hairline porque lo pone el material, `colorScheme` atado al tema de la app y no al del SO) y que los children se renderizan en las tres ramas. No hay simulador aquí, así que el cristal en sí no se puede ver; lo unit-testeable —y lo que crashea en producción si se rompe— es el gating, que es lo que cubre. `TransactionItem.test.tsx` actualizado: el caso "gasto en `text`" pasa a "gasto en `expense`, y **ni** `error` **ni** `text`", en claro y en oscuro, más un caso nuevo de que `transfer` sigue en `text`; 7/7 pasan. `CategoryFormModal.test.tsx` (que renderiza `CategoryListItem`) sigue 6/6. Se añadió a `jest.setup.js` un mock global de `expo-glass-effect` — obligatorio, porque sus builds `.ios` llaman a `requireNativeModule`/`requireNativeViewManager` al importarse y revientan sin runtime nativo; el default del mock es `isGlassEffectAPIAvailable() === false`, o sea la fila plana, para que ninguna suite existente cambie de comportamiento. `npx jest` completo: 9 suites pasan / 7 fallan — **las mismas 7 preexistentes de la fila anterior**, sin ninguna nueva (`LoginScreen`/`RegisterScreen` por `ThemeProvider`, `VisionScreen`/`BudgetScreen` por Worklets, `AnalyticsScreen` por safe-area, `TransactionFormScreen` en 3/8 exactamente igual que antes pese a tocar `AmountInput`, y `WalletScreen` sin poder importarse por `ExpoTextRecognition`). | Limpio: `npx eslint --max-warnings=0` sobre los archivos tocados (`GlassSurface.tsx`, `GlassSurface.ios.tsx`, `GlassSurface.types.ts`, `TransactionItem.tsx`, `TransactionList.tsx`, `CategoryListItem.tsx`, `AmountInput.tsx`, `jest.setup.js` y las 2 suites) → 0 problemas. `npm run lint` global → **0 errores, 16 warnings**, idénticos a los medidos antes de empezar el retrofit. `npx tsc --noEmit` → **0 errores**. Claro/oscuro verificado por test en vez de a ojo: `TransactionItem` afirma `Colors.light.expense` y `Colors.dark.expense` forzando `useColorScheme`, y `GlassSurface` no introduce ningún color propio (todo sale de `fallbackStyle`/`tintColor` del llamante). | 2026-09-01 |
