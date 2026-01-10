# Sistema de Diseño & Guía Técnica: HexaFlow

> **Filosofía:** "Glassmorphism Premium". Una estética etérea, sofisticada y oscura, donde los elementos flotan sobre un espacio profundo con contrastes de neón.

---

## 1. Design Tokens (Variables Globales)

Estas son las **únicas** fuentes de verdad. No hardcodear valores hexadecimales ni píxeles mágicos en el CSS de los componentes.

### 1.1 Paleta de Colores
| Token CSS | Valor | Semántica / Uso |
| :--- | :--- | :--- |
| `--bg-root` | `#0f172a` (Slate 900) | Fondo global del body. |
| `--bg-panel` | `rgba(30, 41, 59, 0.6)` | Base para paneles Glass. |
| `--bg-modal` | `rgba(15, 23, 42, 0.95)` | Fondo oscuro para Modales. |
| `--text-main` | `#f8fafc` (Slate 50) | Títulos y texto legible. |
| `--text-muted` | `#94a3b8` (Slate 400) | Etiquetas, placeholders. |
| `--color-accent` | `#38bdf8` (Sky 400) | **Interacción principal**, focus, bordes activos. |
| `--color-gold` | `#fbbf24` (Amber 400) | **Recompensa**, Mulligan, High Score. |
| `--color-danger` | `#ef4444` (Red 500) | Errores, acciones destructivas. |

### 1.2 Sistema de Espaciado (Spacing Scale)
Usar estas variables para `margin` y `padding`.
*   `--space-xs`: `4px`
*   `--space-sm`: `8px`
*   `--space-md`: `16px` (Estándar)
*   `--space-lg`: `24px`
*   `--space-xl`: `32px`
*   `--radius-main`: `12px` (Bordes redondeados estándar)
*   `--radius-pill`: `50px` (Botones redondos)

### 1.3 Mapa de Capas (Z-Index)
Evita conflictos de superposición usando estrictamente estas capas.
*   `--z-back`: `-1` (Partículas de fondo, efectos)
*   `--z-board`: `10` (Tablero de juego)
*   `--z-ui`: `100` (HUD, Botones flotantes)
*   `--z-modal`: `1000` (Overlays, Menús de pausa)
*   `--z-toast`: `9999` (Notificaciones urgentes)

---

## 2. Metodología de Código

Para mantener el CSS escalable y evitar colisiones, seguimos reglas estrictas.

### 2.1 Convención de Nombres (BEM)
Usamos **Block Element Modifier**.
*   ✅ `.card` (Bloque)
*   ✅ `.card__title` (Elemento hijo)
*   ✅ `.card--active` (Modificador de estado)
*   ❌ `.card .title` (Evitar anidamiento genérico)
*   ❌ `#gameButton` (No usar IDs para estilos, solo JS)

### 2.2 Arquitectura de Archivos
*   `styles/base/`: Reset, variables, tipografía.
*   `styles/components/`: Un archivo por componente (ej: `_button.css`, `_hud.css`).
*   `styles/utilities/`: Clases helper (ej: `_glass.css`).

---

## 3. Efectos Visuales Core

### 3.1 Mixin "Glassmorphism"
Cualquier panel debe implementar estas propiedades base (idealmente a través de una clase utilitaria `.u-glass`).

```css
.u-glass {
    background: var(--bg-panel);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}
```

### 3.2 Gradientes Activos
*   **Primary Action:** `linear-gradient(135deg, var(--color-accent), #0284c7)`
*   **Gold Action:** `linear-gradient(135deg, var(--color-gold), #d97706)`

---

## 4. Tipografía

**Fuente:** `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`

| Elemento | Peso | Tamaño (Desktop) | Estilos Extra |
| :--- | :--- | :--- | :--- |
| **H1 (Logo)** | 700 | 3rem | Uppercase, Text-Shadow Neon |
| **H2 (Secciones)** | 600 | 1.5rem | Uppercase, Tracking 2px |
| **Body** | 400 | 1rem | Color: `--text-main` |
| **Label/Small** | 400 | 0.875rem | Color: `--text-muted` |

---

## 5. Componentes UI

### 5.1 Botones (`.btn`)
Los botones deben parecer físicos y táctiles.

*   **Estructura:** Padding `0.75rem 1.5rem`, Border Radius `--radius-main`.
*   **Variantes:**
    *   `.btn--primary`: Fondo gradiente azul (Acción Principal).
    *   `.btn--gold`: Fondo gradiente dorado (Mulligan).
    *   `.btn--gold-outline` (NUEVO): Fondo `rgba(251, 191, 36, 0.15)`, Borde Dorado, Texto "VOLVER" con icono. Usado para navegación secundaria en modales.
    *   `.btn--ghost`: Deprecado/Uso limitado.

#### Estados de Interacción (Obligatorios)
1.  **Default:** Opacidad 100%, sombra suave.
2.  **Hover:** `transform: translateY(-2px)`, brillo aumentado (`brightness(1.1)`).
3.  **Active (Click):** `transform: scale(0.98) translateY(0)`.
4.  **Disabled:** `opacity: 0.5`, `cursor: not-allowed`, `filter: grayscale(100%)`.

### 5.2 Sliders / Inputs
*   **Track:** Altura 4px, fondo `rgba(255,255,255,0.1)`.
*   **Thumb:** Circulo perfecto, color `--color-accent`, sombra de neón `box-shadow: 0 0 10px var(--color-accent)`.

### 5.3 Iconografía
**Librería:** Lucide Icons (`stroke-width: 2px`).
*   Los iconos deben tener siempre un contenedor o un tamaño explícito (ej: `w-6 h-6`).

---

## 6. Sistema de Modales (Unificado)

El sistema de ventanas emergentes sigue el estándar **"Gold Premium"**:

1.  **Contenedor:**
    *   Borde: `1px solid var(--color-gold)`.
    *   Fondo: Glassmorphism oscuro.
    *   Comportamiento: **Sin scroll interno**. El modal crece naturalmente según su contenido. El scroll es manejado por el overlay padre si excede el viewport.

2.  **Encabezados:**
    *   Color: `var(--color-gold)`.
    *   Iconos: Siempre acompañan al título.

3.  **Zonificación de Contenido ("Subtle Zones"):**
    *   Para separar secciones (ej: Reglas, Configuración), **NO USAR LÍNEAS**.
    *   Usar contenedores con fondo sutil: `background: rgba(255, 255, 255, 0.03)`.
    *   Bordes redondeados `12px` y borde ultra sutil `rgba(255, 255, 255, 0.05)`.

---

## 7. Layout y Disposición

### Estrategia de Posicionamiento
*   **Contenedor de Juego:** Centrado absoluto o Flex Center en pantalla.
*   **HUD (Info):** `position: fixed` o `absolute`, anclado arriba-izquierda (`top: var(--space-md)`, `left: var(--space-md)`).
*   **Panel de Acciones:** Flotante abajo-centro. Debe tener `margin-bottom: var(--space-lg)` para no pegar al borde.

### Responsive (Mobile First)
*   En móviles, los paneles laterales pasan a ser inferiores o modales a pantalla completa.
*   Tamaño mínimo de zona táctil: `44px` x `44px`.

---

## 8. Animaciones y Transiciones

Usar la regla de "Micro-interacciones suaves".

*   **Global Transition:** `transition: all 0.2s ease-out;` (Para hovers).
*   **Keyframes:**
    *   `@keyframes float`: Flotación lenta vertical para paneles inactivos.
    *   `@keyframes pulse-glow`: Brillo oscilante para elementos que requieren atención (tutorial/hints).
    *   `@keyframes pop-in`: Entrada elástica para modales (`scale(0.8)` -> `scale(1)`).

