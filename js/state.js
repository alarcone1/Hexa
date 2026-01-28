export const state = {
    score: 0,
    goal: 200,
    mulligans: 3,
    numColors: 3,
    difficulty: 5,
    level: 1,           // Nivel actual de Ascensión (1-12)
    subLevel: 1,        // Sub-nivel actual (1-10)
    isConfigLocked: false, // Bloquea configuración tras la partida 1 de cada nivel
    maxStackHeight: 15,
    moves: 0,
    maxMoves: 50,       // Límite de movimientos por partida (ajustable)
    startTime: null,
    board: new Map(), // key: "q,r", value: { chips: [] }
    playerPiles: [null, null, null],
    selectedPileIndex: null,
    rotation: 0,
    rotationSpeed: 0,
    scale: 1, // Nuevo: Escala dinámica
    keysPressed: { ArrowLeft: false, ArrowRight: false },
    isGameOver: false,
    isConfigOpen: false,
    isHelpOpen: false,
    isAnimating: false,
    particles: [],
    effects: [],
    animatedChips: [],
    hoveredCell: null,
    stats: {
        bestCombo: 0,
        currentCombo: 0,
        totalEliminated: 0
    },
    // Configuración de Amistad y Estrategia (Dinámica)
    friendshipThreshold: 0.4, // 40% de ocupación activa ayuda
    revealBonus: 150,        // Puntos por revelar jugadas
    analysisHeight: 5        // Altura mínima para predecir necesidades
};

export let hexRadius = 4;

export function setHexRadius(val) {
    hexRadius = val;
}

const STORAGE_KEY_PROG = 'hexaflow_progression_v1';

export function saveProgress() {
    const data = {
        level: state.level,
        subLevel: state.subLevel,
        isConfigLocked: state.isConfigLocked,
        // Guardar configuración del usuario para mantenerla durante los 10 sub-niveles
        goal: state.goal,
        maxStackHeight: state.maxStackHeight,
        friendshipThreshold: state.friendshipThreshold,
        revealBonus: state.revealBonus,
        analysisHeight: state.analysisHeight
    };
    console.log("GUARDANDO PROGRESO ->", data);
    localStorage.setItem(STORAGE_KEY_PROG, JSON.stringify(data));
}

export function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY_PROG);
    console.log("CARGANDO PROGRESO... Encontrado:", saved);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.level = data.level || 1;
            state.subLevel = data.subLevel || 1;
            state.isConfigLocked = data.isConfigLocked || false;

            // Restaurar configuración del usuario si existe
            if (data.goal !== undefined) state.goal = data.goal;
            if (data.maxStackHeight !== undefined) state.maxStackHeight = data.maxStackHeight;
            if (data.friendshipThreshold !== undefined) state.friendshipThreshold = data.friendshipThreshold;
            if (data.revealBonus !== undefined) state.revealBonus = data.revealBonus;
            if (data.analysisHeight !== undefined) state.analysisHeight = data.analysisHeight;

            console.log("PROGRESO RESTAURADO:", state.level, state.subLevel, "Meta:", state.goal);
        } catch (e) {
            console.error("Error cargando progreso:", e);
        }
    } else {
        console.log("No se encontró progreso previo, iniciando en Nivel 1.");
    }
}
