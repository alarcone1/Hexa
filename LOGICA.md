# HEXA FLOW - Lógica del Juego

## Concepto Core
El juego se basa en el flujo de fichas de colores a través de un tablero hexagonal. El objetivo es crear pilas de al menos 10 fichas del mismo color para eliminarlas y ganar puntos.

## Estructuras de Datos
- **Coordenadas**: Sistema Axial (q, r).
- **Tablero (`state.board`)**: Un `Map` donde la clave es "q,r" y el valor es un objeto Celda `{ type, chips: [] }`.
- **Fichas (`chips`)**: Un array simple de strings (colores hex). El último elemento es el superior (Top).

## Diagrama de Flujo (Strategic Reveal System)

El núcleo del juego es la función `processMove`. Ya no se mueve ciegamente; ahora "piensa" dónde unirse para causar el mayor impacto (Eliminación Inmediata) o preparar el futuro (Revelación Estratégica).

```mermaid
flowchart TD
    Start([Inicio: Cola de Procesamiento]) --> QueueCheck{¿Cola Vacía?}
    
    %% FAILSAFE SYSTEM
    QueueCheck -- Sí --> Failsafe1{¿Hay Eliminación Pendiente?}
    Failsafe1 -- Sí --> AddPending[Agregar a Cola] --> Process
    Failsafe1 -- No --> Failsafe2{¿Hay Conexión Fragmentada?}
    Failsafe2 -- Sí --> AddFragment[Agregar a Cola (Re-activar)] --> Process
    Failsafe2 -- No --> End([Fin de Turno])

    %% MAIN PROCESS
    QueueCheck -- No --> Process[Extraer Celda Actual]
    Process --> HasChips{¿Tiene Fichas?}
    HasChips -- No --> QueueCheck
    HasChips -- Sí --> Neighbors[Buscar Vecinos del mismo Color]
    
    Neighbors --> CountMatches{¿Vecinos > 0?}
    
    %% SOLITARY CASE
    CountMatches -- No --> SoloCheck[Verificar Eliminación en Sitio]
    SoloCheck --> Eliminated{¿Se eliminó?}
    Eliminated -- Sí --> QueueCheck
    Eliminated -- No --> QueueCheck

    %% STRATEGIC SCORING
    CountMatches -- Sí --> Scoring[**EVALUAR CANDIDATOS**]
    Scoring --> Score1[1. Prioridad: ELIMINACIÓN INMEDIATA (Suma >= 10)]
    Score1 --> Score2[2. Estrategia: REVELACIÓN (Ver qué color hay abajo)]
    Score2 --> Score3[3. Tie-Breaker: Tamaño de Pila (Gravedad)]
    
    Score3 --> Winner[Seleccionar MEJOR DESTINO]
    
    %% EXECUTION
    Winner --> IsCenter{¿Es la propia celda?}
    
    %% GATHER (Center wins)
    IsCenter -- Sí --> Gather[**GATHER**: Todos los vecinos vienen al Centro]
    Gather --> UpdateQ[Agregar todos a Cola] --> QueueCheck

    %% PUMP AND DUMP (Neighbor wins)
    IsCenter -- No --> Pump[**PUMP**: Vecinos lejanos vienen al Centro]
    Pump --> Dump[**DUMP**: Centro mueve todo al Vecino Ganador]
    Dump --> UpdateQ --> QueueCheck
```

### Reglas de Decisión (Scoring)
El sistema evalúa cada posible destino de fusión (la celda actual y sus vecinos) y asigna puntaje:
1.  **Eliminación Inmediata (Score 1000+)**: Si mover las fichas a ese destino causa una suma >= 10, es la prioridad absoluta.
2.  **Revelación Estratégica (+50 pts/match)**: Si no hay eliminación, el sistema simula el movimiento. "Mira" debajo de las fichas que se moverían. Si el color revelado crea nuevas conexiones, ese destino gana puntos extra.
3.  **Gravedad (+Size)**: A igualdad de condiciones, las fichas prefieren ir hacia pilas más grandes.

### Failsafe (Recuperación)
Si la cola se vacía pero el tablero quedó en un estado "roto" (fichas conectadas que no se unieron), el sistema ejecuta `findFragmentedConnection()` para reactivar esas celdas y asegurar que siempre se completen todas las fusiones posibles.

## Sistema de Dificultad Dinámica

El juego implementa "Presets de Balanceo" (`DIFFICULTY_PRESETS`) que ajustan las variables del entorno según el tamaño del tablero escogido, aunque el jugador puede refinar estos valores manualmente:

| Dificultad | Radio (Tablero) | Meta de Puntos | Límite de Altura | Descripción |
| :--- | :---: | :---: | :---: | :--- |
| **Fácil** | 2 (19 celdas) | 100 | 25 | Tablero pequeño, pilas muy altas permitidas. Ideal para aprender. |
| **Normal** | 3 (37 celdas) | 200 | 20 | Balance estándar. Requiere gestión de espacio. |
| **Difícil** | 4 (61 celdas) | 300 | 15 | Tablero grande, pero las pilas se bloquean rápido (15). Requiere High-IQ combos. |
79: 
80: ## Sistema de Amistad (Recambio Inteligente)
81: 
82: Cuando el jugador solicita un recambio de pilas (Trash/Refill), la App no genera colores aleatorios. En su lugar, ejecuta el **"Algoritmo de Amistad"** para actuar como un aliado estratega:
83: 
84: 1.  **Análisis de Revelación**: El sistema escanea las pilas actuales. Busca aquellas que están cerca de su límite (>= 7 fichas) y "mira" qué color hay debajo de la capa superior.
85: 2.  **Selección Provocadora (Mix Genético)**:
86:     -   **Componente A (Cierre)**: Incluye 1 o 2 fichas del color superior actual para ayudar al jugador a completar la pila y eliminarla pronto.
87:     -   **Componente B (Semilla)**: Incluye fichas del color que está inmediatamente debajo (la "revelación"). Esto asegura que, una vez que el jugador limpie la capa superior, ya tenga piezas en mano para continuar el flujo con el color revelado.
88: 3.  **Balance de Altura**: Si el tablero está muy saturado, el algoritmo prioriza generar pilas de tamaño 2 o 3 en lugar de 5, para dar "aire" al jugador y evitar el Game Over inmediato.
89: 
90: > [!TIP]
91: > Este sistema transforma el botón de recambio en un "botón de estrategia" que el jugador aprende a usar no solo para descartar lo que no quiere, sino para pedir ayuda táctica cuando el tablero se complica.
