# HexaFlow: Strategic Honeycomb 🎮🐝

**HexaFlow** es un juego de estrategia y lógica basado en un tablero hexagonal donde el objetivo es manipular flujos de fichas de colores para crear pilas gigantes y limpiar el tablero.

![HexaFlow Banner](preview.png)

> **Estado**: Activo (En desarrollo)
> **Tecnologías**: HTML5 (Canvas), CSS3 (Glassmorphism), Vanilla JavaScript.

## 🌟 Características Principales

*   **Juego Estratégico**: Coloca tus fichas pensando a futuro. Las pilas interactúan con sus vecinas creando reacciones en cadena.
*   **Sistema de Cascada (Queue System)**: Una lógica robusta de procesamiento de eventos en cola que garantiza que cada movimiento desencadene todas las reacciones posibles de forma ordenada y visualmente satisfactoria.
*   **Diseño Premium**: Interfaz moderna con estética "Glassmorphism" (cristal translúcido), animaciones fluidas y efectos de neón.
*   **Personalizable**: Configura la dificultad (tamaño del tablero), el límite de altura de las pilas y la meta de puntos.

## 🕹️ Cómo Jugar

1.  **Tablero**: Un grid hexagonal compuesto por celdas individuales.
2.  **Tus Pilas**: Tienes 3 pilas de fichas disponibles en tu panel de control.
3.  **Movimiento**:
    *   Haz clic en una de tus pilas para seleccionarla.
    *   Haz clic en cualquier celda vacía o con espacio en el tablero para colocarla.
4.  **Flujo (Flow)**:
    *   Si la ficha superior de una celda coincide con el color de una vecina, las fichas intentarán **moverse** hacia la pila más alta.
    *   Si hay múltiples vecinos del mismo color, las fichas se **reunirán (gather)** en el centro.
5.  **Puntuación**:
    *   Acumula **10 o más** fichas del mismo color en una celda para **eliminarlas**.
    *   Las eliminaciones otorgan puntos y pueden revelar nuevos colores debajo, continuando la cadena.
    *   ¡Haz combos para multiplicar tu puntuación!

## 🛠️ Tecnologías y Estructura

El proyecto está construido sin dependencias externas pesadas, utilizando estándares web modernos:

*   **`index.html`**: Estructura semántica del juego y contenedores de UI (HUD, Modales).
*   **`style.css`**: Sistema de diseño con variables CSS, Flexbox/Grid y efectos de backdrop-filter para el estilo Glassmorphism. Ver [ESTILO.md](./ESTILO.md) para más detalles.
*   **`game.js`**: Lógica central del juego, renderizado en Canvas API y manejo de estados.
*   **`LOGICA.md`**: Documentación técnica detallada sobre el algoritmo de flujo y cascada.

### Archivos de Documentación
*   [📄 LOGICA.md](./LOGICA.md) - Explicación profunda de las reglas de movimiento y diagramas de flujo.
*   [🎨 ESTILO.md](./ESTILO.md) - Guía de estilo gráfico, paleta de colores y tipografía.

## 🚀 Instalación y Uso

Simplemente clona el repositorio y abre el archivo `index.html` en tu navegador web moderno favorito.

```bash
git clone https://github.com/tu-usuario/hexaflow.git
cd hexaflow
# Abrir index.html
```

## ⚙️ Configuración

Dentro del juego, el icono de engranaje (⚙) te permite ajustar:
*   **Dificultad**: Fácil (Radio 2), Normal (Radio 3), Difícil (Radio 4).
*   **Meta de Puntos**: Define cuántos puntos necesitas para ganar el nivel.
*   **Altura Máxima**: Límite visual de las pilas antes de considerarse "llenas" (estrategia).

---
*Desarrollado con ❤️ y Lógica Hexagonal.*
