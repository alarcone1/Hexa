export const state = {
    score: 0,
    goal: 150,
    mulligans: 3,
    numColors: 3,
    difficulty: 2,
    maxStackHeight: 15,
    moves: 0,
    startTime: null,
    board: new Map(), // key: "q,r", value: { chips: [] }
    playerPiles: [null, null, null],
    selectedPileIndex: null,
    rotation: 0,
    rotationSpeed: 0,
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
    }
};

export let hexRadius = 2;

export function setHexRadius(val) {
    hexRadius = val;
}
