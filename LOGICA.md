# HEXA FLOW - Lógica del Juego

## Concepto Core
El juego se basa en el flujo de fichas de colores a través de un tablero hexagonal. El objetivo es crear pilas de al menos 10 fichas del mismo color para eliminarlas y ganar puntos.

## Estructuras de Datos
- **Coordenadas**: Sistema Axial (q, r).
- **Tablero (`state.board`)**: Un `Map` donde la clave es "q,r" y el valor es un objeto Celda `{ type, chips: [] }`.
- **Fichas (`chips`)**: Un array simple de strings (colores hex). El último elemento es el superior (Top).

## Diagrama de Flujo (Sistema de Cascada / Queue)

El juego utiliza un sistema de **Cola de Eventos** para manejar las reacciones en cadena. Cuando una celda es activada (por el jugador o por recibir fichas), entra en la cola. Mientras la cola no esté vacía, el juego procesa la siguiente celda.

```mermaid
flowchart TD
    Start([Inicio: Celda Q,R agregada a Cola]) --> Loop{¿Cola > 0?}
    Loop -- No --> End([Fin de Cascada])
    Loop -- Sí --> Pop[Extraer Siguiente Celda: Current]
    
    Pop --> CheckChips{¿Tiene Fichas?}
    CheckChips -- No --> Loop
    CheckChips -- Sí --> GetColor[TopColor de Current]
    
    GetColor --> Scan[Escanear Vecinos]
    Scan --> MatchCount{¿Cuantos Vecinos con match?}
    
    %% CASO 0
    MatchCount -- 0 --> Stay[Stay: Fichas se quedan]
    Stay --> Loop
    
    %% CASO 1
    MatchCount -- 1 --> MoveDirect[Mover Directo a Target]
    MoveDirect --> AddTarget[Agregar Target a Cola]
    AddTarget --> CheckCurrent[Agregar Current a Cola]
    CheckCurrent --> CheckElim[¿Target >= 10? -> Eliminar]
    CheckElim --> Loop
    
    %% CASO > 1
    MatchCount -- "> 1" --> Gather[Gather: Vecinos -> Current]
    Gather --> AddNeighbors[Agregar Vecinos (vacíos) a Cola]
    AddNeighbors --> Recalc[Recalcular Current]
    
    Recalc --> Overflow{¿Current >= 10?}
    Overflow -- Sí --> ElimCenter[Eliminar en Current]
    ElimCenter --> CurrentAgain[Agregar Current a Cola]
    CurrentAgain --> Loop
    
    Overflow -- No --> Loop
    %% Nota: Si no hay overflow tras Gather, se queda ahí (Island) hasta que otro evento lo despierte.
```

### Reglas de Cascada (Queue System)
1.  **Activación**: Cualquier celda que sea *origen* o *destino* de un movimiento, o que sufra una eliminación, se agrega a la **Cola de Procesamiento**.
2.  **Ciclo de Vida**:
    *   Extraemos una celda de la cola.
    *   Si tiene fichas, buscamos vecinos coincidentes.
    *   Si **Mueve** sus fichas -> La celda destino se activa (entra a cola). La celda origen se activa de nuevo (para ver su siguiente color).
    *   Si **Reúne (Gather)** fichas -> Los vecinos origen se activan (perdieron fichas, revelan color). La celda actual crece.
    *   Si **Elimina** fichas -> La celda se activa de nuevo para procesar las fichas que estaban debajo.
3.  **Estabilidad**: El turno termina solo cuando la cola está vacía y ninguna ficha puede moverse más.
