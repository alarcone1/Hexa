# Sistema de Diseño: HexaFlow Glassmorphism Premium

Este documento define las guías de estilo visual implementadas en el juego **HexaFlow**. El diseño busca una estética moderna, etérea y sofisticada ("App Premium"), utilizando desenfoques, transparencias y contrastes de neón sobre fondo oscuro.

## 🎨 Iconografía (Lucide)
Para mantener una consistencia minimalista y geométrica, utilizamos **Lucide Icons** (versión light/outline).
- **Librería**: `lucide@latest`
- **Estilo**: Stroke width 2px, sin relleno.
- **Implementación**: `<i data-lucide="nombre-icono"></i>`
- **Renderizado**: `lucide.createIcons()` al cargar.

## 1. Paleta de Colores

El esquema de colores utiliza tonos oscuros profundos para el fondo y colores brillantes y saturados para acentos e interacción.

| Variable | Color HEX | Uso Principal |
| :--- | :--- | :--- |
| `--bg-color` | `#0f172a` (Slate 900) | Fondo principal de la aplicación (Espacio profundo). |
| `--panel-color` | `#1e293b` (Slate 800) | Fondos de contenedores opacos y slots vacíos. |
| `--text-color` | `#f8fafc` (Slate 50) | Texto principal y lectura. |
| `--accent-color` | `#38bdf8` (Sky 400) | Bordes activos, brillos, botones primarios (Cyan/Azul). |
| `--gold` | `#fbbf24` (Amber 400) | Puntuación alta, monedas, acciones especiales (Mulligan), advertencias. |

### Gradientes Comunes
*   **Botón Acción Principal:** `linear-gradient(135deg, var(--accent-color), #0284c7)`
*   **Botón Secundario/Gold:** `linear-gradient(135deg, var(--gold), #d97706)`
*   **Game Over Text:** `linear-gradient(135deg, #ef4444, #f97316, #eab308)`

---

## 2. Tipografía

Se utiliza una fuente sans-serif limpia y moderna para maximizar la legibilidad en UI.

*   **Familia:** `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
*   **Títulos (H2, H3):**
    *   Transformación: `uppercase`
    *   Letter-spacing: `2px` (espaciado amplio para elegancia)
    *   Peso: `300` (Light) a `700` (Bold) dependiendo del contexto.
    *   Efecto: `text-shadow` suave para dar sensación de luz propia.

---

## 3. Efectos "Glassmorphism" (Cristal)

El elemento central del diseño. Se aplica a tarjetas, modales y paneles de control para que parezcan flotar sobre el juego.

### Clase Base `.glass-panel` (Concepto)
```css
background: rgba(30, 41, 59, 0.4); /* Fondo semitransparente oscuro */
backdrop-filter: blur(10px);       /* Efecto de desenfoque de fondo */
-webkit-backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1); /* Borde sutil casi invisible */
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);  /* Sombra suave para elevación */
border-radius: 12px;
```

### Variaciones
*   **Modales:** Usa un fondo más oscuro (`rgba(15, 23, 42, 0.95)`) para enfocar la atención, pero manteniendo el blur.
*   **HUD Buttons:** Pequeñas cápsulas circulares o cuadradas con bordes redondeados (`border-radius: 12px` o `50%`).

---

## 4. Componentes UI

### Botones
*   **Estilo:** Planos pero con profundidad mediante `box-shadow` y gradientes suaves.
*   **Acción Hover:** Desplazamiento vertical (`transform: translateY(-2px)`) y aumento de brillo/sombra.
*   **Mulligan (Otra Tanda):** Estilo especial "Gold Glass" translúcido con icono.

### Sliders (Controles deslizantes)
*   **Track:** Fino (`4px`), color gris translúcido.
*   **Thumb:** Circular, color de acento (`--accent-color`), con sombra de brillo (`box-shadow: 0 0 10px`).

### Animaciones
El diseño se siente "vivo" mediante micro-interacciones:
*   **`gentlePulse`:** Brillo suave y oscilante para títulos importantes.
*   **`statPulse`:** Explosión de tamaño y brillo dorado cuando cambian los números (Puntos/Movimientos).
*   **Transiciones:** Todas las interacciones de hover tienen `transition: all 0.2s` para suavidad.

---

## 5. Layout (Disposición)

*   **HUD:** Flotante en la esquina superior izquierda, botones verticales.
*   **Stats:** Panel flotante centrado en la parte inferior, separado del borde.
*   **Controles:** Isla flotante centrada conteniendo las pilas del jugador.
*   **Simetría:** Se busca centrar los elementos clave para mantener el foco en el tablero hexagonal.
