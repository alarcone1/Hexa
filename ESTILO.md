# **Sistema de Diseño & Guía Técnica: HexaFlow (Edición Maestra V2.3)**

**Filosofía:** "Ultra-High Contrast Glassmorphism". Una estética etérea, sofisticada y oscura, donde los elementos flotan sobre un espacio profundo con contrastes de neón. En esta versión V2.3, la luminancia ha sido optimizada para garantizar la mejor accesibilidad del mercado sin perder el acabado premium.

## **1\. Design Tokens (Variables Globales)**

Estas son las **únicas** fuentes de verdad. No hardcodear valores hexadecimales ni píxeles mágicos en el CSS de los componentes.

### **1.1 Paleta de Colores (Certificada WCAG AA)**

| Token CSS | Valor | Semántica / Uso |
| :---- | :---- | :---- |
| \--bg-root | \#0f172a | Fondo global del body (Slate 900). |
| \--bg-panel | rgba(30, 41, 59, 0.45) | Base para paneles Glass (Blur optimizado). |
| \--bg-modal | rgba(15, 23, 42, 0.98) | Fondo oscuro casi opaco para máxima concentración. |
| \--text-main | \#ffffff | **Blanco Puro**. Títulos y texto de legibilidad crítica. |
| \--text-muted | \#cbd5e1 | **Slate 300**. Etiquetas y placeholders (Contraste 4.5:1). |
| \--color-accent | \#38bdf8 | **Interacción principal** (Sky 400), focus, neón. |
| \--color-gold | \#fbbf24 | **Recompensa**, Mulligan, High Score (Amber 400). |
| \--color-success | \#10b981 | Estados positivos y validación de sistema. |
| \--color-danger | \#ef4444 | Errores y acciones destructivas (Red 500). |

### **1.2 Sistema de Espaciado (Spacing Scale)**

*Usar estas variables estrictamente para margin y padding para mantener la armonía visual.*

* \--space-xs: 4px  
* \--space-sm: 8px  
* \--space-md: 16px (Estándar de rejilla)  
* \--space-lg: 24px  
* \--space-xl: 32px  
* \--radius-main: 16px (Bordes redondeados suavizados para estética premium)  
* \--radius-pill: 50px (Usado para botones redondos y cápsulas)

### **1.3 Mapa de Capas (Z-Index Jerárquico)**

*Evita conflictos de superposición usando estrictamente estas capas.*

* \--z-back: \-1 (Partículas de fondo, efectos decorativos)  
* \--z-board: 10 (Tablero principal de contenido)  
* \--z-ui: 100 (HUD, botones flotantes, barras de estado)  
* \--z-modal: 1000 (Overlays, menús de pausa, ventanas emergentes)  
* \--z-nav: 9999 (Selectores de navegación global y notificaciones toast)

## **2\. Metodología de Código**

### **2.1 Convención de Nombres (BEM)**

Para mantener el CSS escalable y evitar colisiones, usamos **Block Element Modifier**.

* ✅ .card (Bloque)  
* ✅ .card\_\_title (Elemento hijo)  
* ✅ .card--active (Modificador de estado)  
* ❌ .card .title (Evitar anidamiento genérico)

### **2.2 Arquitectura de Archivos**

* styles/base/: Reset, variables, tipografía.  
* styles/components/: Un archivo por componente (ej: \_button.css, \_hud.css).  
* styles/utilities/: Clases helper (ej: \_glass.css, \_layout.css).

## **3\. Efectos Visuales Core**

### **3.1 Mixin "Glassmorphism"**

Cualquier panel debe implementar estas propiedades base a través de la clase utilitaria .u-glass.

.u-glass {  
    background: var(--bg-panel);  
    backdrop-filter: blur(20px);  
    \-webkit-backdrop-filter: blur(20px);  
    border: 1px solid rgba(255, 255, 255, 0.1);  
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);  
}

### **3.2 Gradientes Activos**

Utilizar para elementos que requieran profundidad visual y énfasis.

* **Primary Action:** linear-gradient(135deg, var(--color-accent), \#0284c7)  
* **Gold Action:** linear-gradient(135deg, var(--color-gold), \#d97706)  
* **Success Glow:** linear-gradient(135deg, var(--color-success), \#059669)

## **4\. Tipografía y Reglas de Brillo**

**Fuente:** 'Segoe UI', system-ui, \-apple-system, sans-serif

| Elemento | Peso | Tamaño | Estilos / Regla de Brillo |
| :---- | :---- | :---- | :---- |
| **H1 (Logo)** | 900 (Black) | 3.5rem | Uppercase, Neón Text Shadow (Cian) |
| **H2 (Secciones)** | 800 (ExtraBold) | 1.75rem | Uppercase, Relief Shadow, Blanco Puro |
| **Body (Main)** | 500 (Medium) | 1rem | Color: \--text-main |
| **Label/Small** | 600 (Bold) | 0.875rem | Color: \--text-muted, Tracking 1px |

*Nota: Para evitar "títulos oscuros", los encabezados deben usar siempre \#ffffff con un sutil text-shadow para despegarse del fondo.*

## **5\. Componentes UI**

### **5.1 Botones (.btn)**

Los botones deben parecer físicos, táctiles y responder instantáneamente.

* **Estructura:** Padding 0.75rem 1.5rem, Border Radius \--radius-main.  
* **Variantes:**  
  * .btn--primary: Fondo gradiente azul (Acción Principal).  
  * .btn--gold: Fondo gradiente dorado (Mulligan/Premios).  
  * .btn--gold-outline: Fondo rgba(251, 191, 36, 0.1), Borde 2px Dorado, Texto Oro.  
  * .btn--danger: Fondo sólido \--color-danger para acciones destructivas.

#### **Estados de Interacción (Obligatorios)**

1. **Default:** Opacidad 100%, sombra suave según variante.  
2. **Hover:** transform: translateY(-2px), brillo aumentado (brightness(1.15)).  
3. **Active (Click):** transform: scale(0.96) translateY(0), sombra reducida.  
4. **Disabled:** opacity: 0.5, cursor: not-allowed, filter: grayscale(80%).

### **5.2 Sliders / Inputs**

* **Track:** Altura 6px, fondo rgba(255, 255, 255, 0.05), borde sutil.  
* **Thumb:** Círculo perfecto (24px), color \--color-accent o blanco, sombra de neón intensa box-shadow: 0 0 15px var(--color-accent).  
* **Input Text:** Fondo rgba(0,0,0,0.2), borde \--color-accent al focus, texto \--text-main.

### **5.3 Iconografía**

**Librería:** Lucide Icons.

* **Grosor:** stroke-width: 2.5px o 3px para compensar el desenfoque del fondo.  
* **Contenedores:** Los iconos deben tener un tamaño explícito (ej: w-6 h-6) y, preferiblemente, un fondo sutil redondeado cuando actúan como disparadores.

## **6\. Sistema de Modales (Unificado Gold Premium)**

El sistema de ventanas emergentes sigue el estándar de alta gama:

1. **Contenedor Maestro:**  
   * Borde: 1px solid var(--color-gold).  
   * Fondo: Glassmorphism Ultra-Oscuro (--bg-modal).  
   * Comportamiento: **Sin scroll interno forzado**. El modal crece naturalmente. El scroll lo maneja el overlay si se excede el alto de pantalla.  
2. **Encabezados:**  
   * Color: var(--color-gold).  
   * Iconografía: Siempre acompañan al título para reforzar el contexto.  
3. **Zonificación (No-Line Strategy):**  
   * Para separar secciones (ej: Ajustes vs. Info), **NO USAR LÍNEAS**.  
   * Usar contenedores .u-subtle-zone: background: rgba(255, 255, 255, 0.03), borde sutil rgba(255, 255, 255, 0.05).

## **7\. Layout y Disposición**

### **7.1 Estrategia de Posicionamiento**

* **Contenedor Principal:** Centrado absoluto o Flex Center para enfoque total.  
* **HUD (Info de Usuario):** position: fixed anclado arriba-izquierda con margen \--space-md.  
* **Panel de Acciones:** Flotante abajo-centro con margin-bottom: var(--space-lg).

### **7.2 Responsive (Mobile First)**

* **Touch Targets:** Mínimo 44px x 44px para cualquier elemento interactivo.  
* **Adaptabilidad:** En móviles, los paneles horizontales se apilan verticalmente o se convierten en cajones inferiores (bottom sheets).

## **8\. Accesibilidad y Animaciones**

### **8.1 Movimiento Adaptable (Reduced Motion)**

Es imperativo respetar la configuración del usuario para evitar mareos o fatiga visual.

@media (prefers-reduced-motion: reduce) {  
  \* {  
    animation-duration: 0.01ms \!important;  
    transition-duration: 0.01ms \!important;  
  }  
}

### **8.2 Micro-interacciones Suaves**

* **Global Transition:** transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1).  
* **Keyframes Float:** Flotación vertical sutil (12px) para paneles de métricas.  
* **Keyframes Pulse:** Brillo oscilante para elementos que requieren atención inmediata.  
* **Pop-in:** Entrada elástica para modales (scale(0.95) \-\> scale(1)) usando cubic-bezier(0.34, 1.56, 0.64, 1).