# HexaFlow: Strategic Honeycomb 🎮🐝

**HexaFlow** es un juego de estrategia y lógica basado en un tablero hexagonal donde el objetivo es manipular flujos de fichas de colores para crear pilas gigantes y limpiar el tablero.

![HexaFlow Screenshot](preview.png)

> **Estado**: Activo (En desarrollo)
> **Tecnologías**: HTML5 (Canvas), CSS3 (Glassmorphism Pura), Vanilla JS (Modular).

## 🌟 Características Principales

*   **Strategic Reveal Logic**: El juego no se mueve al azar. Las fichas "buscan" inteligentemente:
    1.  **Eliminaciones Inmediatas**: Prioridad absoluta para limpiar el tablero.
    2.  **Revelaciones**: Si no pueden eliminar, buscan un movimiento que revele un color útil debajo.
*   **Física de Fluidos Hexagonales**: Sistema de "Pump & Dump" donde las pilas vecinas fluyen hacia el centro para luego redistribuirse estratégicamente.
*   **Diseño Premium Glassmorphism**: Interfaz moderna translúcida, efectos de neón, iconos minimalistas y animaciones suaves a 60fps.
*   **Salón de la Fama**: Sistema de récords persistente con filtrado por dificultad (Fácil / Normal / Difícil).
*   **Personalizable**: Configura la dificultad (tamaño del tablero), el límite de altura de las pilas y la meta de puntos.

## 🕹️ Cómo Jugar

1.  **Tablero**: Un grid hexagonal compuesto por celdas individuales.
2.  **Tus Pilas**: Tienes 3 pilas de fichas disponibles en tu panel de control.
3.  **Movimiento**:
    *   Haz clic en una de tus pilas para seleccionarla.
    *   Haz clic en cualquier celda vacía o con espacio en el tablero para colocarla.
4.  **Flujo (Flow)**:
    *   Las fichas adyacentes del mismo color se atraerán magnéticamente.
    *   Si se forma una pila de **10 o más**, ¡se eliminan y ganas puntos!
    *   Al eliminar, se revelan las fichas de abajo, pudiendo causar reacciones en cadena (Combos).
5.  **Objetivo**: Alcanza la meta de puntos antes de quedarte sin movimientos.

## 🛠️ Tecnologías y Estructura

El proyecto está modularizado para mantenibilidad y escalabilidad:

*   **`index.html`**: Estructura semántica, HUD, Modales (Configuración, Ranking, Ayuda).
*   **`style.css`**: Sistema de diseño avanzado con variables CSS, selectores de alta especificidad y efectos visuales complejos (sin frameworks).
*   **`js/`**:
    *   `main.js`: Punto de entrada y control del ciclo de vida.
    *   `logic.js`: Algoritmos de grafos, búsqueda de caminos y sistema de puntuación.
    *   `graphics.js`: Motor de renderizado en Canvas, partículas y confetti.
    *   `ui.js`: Manejo del DOM, modales y actualizaciones del HUD.
    *   `state.js`: Gestión centralizada del estado reactivo.

## 📚 Documentación Técnica
*   [📄 LOGICA.md](./LOGICA.md) - Deep dive en el algoritmo de "Strategic Reveal" y Diagramas de Flujo.
*   [🎨 ESTILO.md](./ESTILO.md) - Guía de estilo gráfico, paleta de colores y componentes.

## 🚀 Instalación y Uso

Simplemente clona el repositorio y abre el archivo `index.html` en tu navegador web moderno favorito. No requiere build tools ni servidor (aunque se recomienda Live Server).

```bash
git clone https://github.com/tu-usuario/hexaflow.git
cd hexaflow
# Abrir index.html
```

## ⚙️ Configuración

Dentro del juego, el icono de engranaje (⚙) te permite ajustar:
*   **Dificultad (Radio)**: Fácil (2), Normal (3), Difícil (4).
*   **Meta de Puntos**: Define el desafío del nivel.
*   **Ranking**: Consulta tus mejores tiempos y movimientos por dificultad.

---
*Desarrollado con ❤️ y Lógica Hexagonal.*
