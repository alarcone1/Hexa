export const state = {
    score: 0,
    goal: 150,
    mulligans: 3,
    numColors: 3,
    difficulty: 2,
    level: 1, // Nuevo: Nivel actual de Ascensión
    maxStackHeight: 15,
    moves: 0,
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

export let hexRadius = 2;

export function setHexRadius(val) {
    hexRadius = val;
}
