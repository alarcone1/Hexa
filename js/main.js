import { state, hexRadius } from './state.js?v=3.0';
import { COLORS } from './constants.js?v=3.0';
import { initBoard, refillPlayerPiles, mulligan, processMove, checkEliminationAt, findFlowTarget } from './logic.js?v=3.0';
import {
    updateStat,
    updatePileUI,
    renderActiveColors,
    toggleConfig,
    updateDifficultyButtons,
    toggleHelp,
    showRankingModal,
    closeRanking,
    addActiveColor,
    updateGoalLabel,
    updateHeightLabel,
    saveScore,
    filterRankingByDifficulty
} from './ui.js?v=3.0';
import {
    drawHexBackground,
    drawHexChips,
    drawFlowArrow
} from './graphics.js?v=3.0';
import { pixelToAxial } from './utils.js?v=3.0';

const canvas = document.getElementById('gameCanvas');
if (!canvas) console.error("Canvas element not found!");
const ctx = canvas.getContext('2d');

console.log("Main.js loaded. Initializing...");

// --- GAME CONTROL ---

function resetGame() {
    console.log("Resetting game...");
    state.score = 0;

    // Config goal
    const goalSlider = document.getElementById('goal-range');
    if (goalSlider) {
        state.goal = parseInt(goalSlider.value);
    } else {
        state.goal = 100 + (state.difficulty * 20);
    }

    state.numColors = 3;
    state.mulligans = 3;
    state.moves = 0;
    state.startTime = Date.now();
    state.stats = { bestCombo: 0, currentCombo: 0, totalEliminated: 0 };
    state.board.clear();
    state.playerPiles = [null, null, null];
    state.selectedPileIndex = null;
    state.rotation = 0;

    // Reset flags
    state.isGameOver = false;
    state.isAnimating = false;
    state.hoveredCell = null;
    state.particles = [];
    state.effects = [];
    state.animatedChips = [];

    updateStat('score', 0);
    updateStat('goal', state.goal);
    updateStat('moves-count', 0);

    document.getElementById('mulligan-btn').innerHTML = `<span class="btn-icon" data-lucide="shuffle"></span> Otra Tanda (3)`;
    if (window.lucide) window.lucide.createIcons();

    const gameoverModal = document.getElementById('gameover-modal');
    gameoverModal.classList.remove('active');

    initBoard();
    refillPlayerPiles(); // This updates Pile UI
    renderActiveColors();
}

function startGame() {
    toggleConfig();
    resetGame();
}

function newGame() {
    resetGame();
}

function restartGame() {
    state.isGameOver = false; // logic reset handled in resetGame
    resetGame();
}

function selectPile(index) {
    if (!state.playerPiles[index] || state.isAnimating || state.isHelpOpen) return;
    state.selectedPileIndex = (state.selectedPileIndex === index) ? null : index;
    updatePileUI();
}



function setDifficulty(level) {
    level = parseInt(level); // Ensure number
    if (isNaN(level)) return;

    state.difficulty = level;
    console.log(`Difficulty set to: ${level}`);

    // Presets Definition (Moved inside for safety)
    const presets = {
        2: { goal: 100, height: 25 }, // Fácil
        3: { goal: 200, height: 20 }, // Normal
        4: { goal: 300, height: 15 }  // Difícil
    };

    // Apply Presets
    const preset = presets[level];
    if (preset) {
        state.goal = preset.goal;
        state.maxStackHeight = preset.height;
        console.log(`Applied preset for ${level}: Goal ${preset.goal}, Height ${preset.height}`);

        const goalSlider = document.getElementById('goal-range');
        if (goalSlider) {
            goalSlider.value = preset.goal;
            updateGoalLabel(preset.goal);
        }

        const heightSlider = document.getElementById('height-range');
        if (heightSlider) {
            heightSlider.value = preset.height;
            updateHeightLabel(preset.height);
        }
    }

    updateDifficultyButtons();
}

function setGoal(value) {
    state.goal = parseInt(value);
}

function setMaxHeight(value) {
    state.maxStackHeight = parseInt(value);
}

function showRankingFromConfig() {
    toggleConfig();
    showRankingModal();
}

function showRankingFromModal() {
    document.getElementById('gameover-modal').classList.remove('active');
    showRankingModal();
}

function resetRankingsConfirm() {
    if (confirm('¿Seguro que quieres borrar todos los rankings?')) {
        localStorage.removeItem('hexaflow_scores_v4');
        alert('Rankings borrados.');
    }
}

// --- EXPOSE TO WINDOW ---
window.startGame = startGame;
window.newGame = newGame;
window.restartGame = restartGame;
window.selectPile = selectPile;
window.mulligan = mulligan;
window.toggleConfig = toggleConfig;
window.toggleHelp = toggleHelp;
window.setDifficulty = setDifficulty;
window.setGoal = setGoal; // Added missing export
window.setMaxHeight = setMaxHeight;
window.updateGoalLabel = updateGoalLabel;
window.updateHeightLabel = updateHeightLabel;
window.showRankingFromConfig = showRankingFromConfig;
window.showRankingFromModal = showRankingFromModal;
window.closeRanking = closeRanking;
window.showRankingModal = showRankingModal;
window.resetRankingsConfirm = resetRankingsConfirm;
window.filterRankingByDifficulty = filterRankingByDifficulty;

// --- EVENT LISTENERS ---

function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);

window.addEventListener('keydown', (e) => {
    if (state.isAnimating || state.isHelpOpen) return;
    if (e.key === 'ArrowLeft') state.keysPressed.ArrowLeft = true;
    if (e.key === 'ArrowRight') state.keysPressed.ArrowRight = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') state.keysPressed.ArrowLeft = false;
    if (e.key === 'ArrowRight') state.keysPressed.ArrowRight = false;
});

canvas.addEventListener('mousemove', (e) => {
    if (state.isAnimating || state.isHelpOpen || state.isGameOver) {
        state.hoveredCell = null;
        return;
    }
    const rect = canvas.getBoundingClientRect();
    let mouseX = (e.clientX - rect.left) - rect.width / 2;
    let mouseY = (e.clientY - rect.top) - rect.height / 2;
    const rad = -state.rotation * Math.PI / 180;
    const rx = mouseX * Math.cos(rad) - mouseY * Math.sin(rad);
    const ry = mouseX * Math.sin(rad) + mouseY * Math.cos(rad);
    const { q, r } = pixelToAxial(rx, ry);
    const key = `${q},${r}`;

    if (state.board.has(key)) {
        state.hoveredCell = { q, r };
    } else {
        state.hoveredCell = null;
    }
});

canvas.addEventListener('mouseleave', () => {
    state.hoveredCell = null;
});

canvas.addEventListener('mousedown', async (e) => {
    if (state.selectedPileIndex === null || state.isAnimating || state.isHelpOpen || state.isGameOver) return;

    let q, r;
    if (state.hoveredCell) {
        q = state.hoveredCell.q;
        r = state.hoveredCell.r;
    } else {
        const rect = canvas.getBoundingClientRect();
        let mouseX = (e.clientX - rect.left) - rect.width / 2;
        let mouseY = (e.clientY - rect.top) - rect.height / 2;
        const rad = -state.rotation * Math.PI / 180;
        const rx = mouseX * Math.cos(rad) - mouseY * Math.sin(rad);
        const ry = mouseX * Math.sin(rad) + mouseY * Math.cos(rad);
        const axial = pixelToAxial(rx, ry);
        q = axial.q;
        r = axial.r;
    }

    const key = `${q},${r}`;
    if (state.board.has(key)) {
        const cell = state.board.get(key);
        if (cell.chips.length === 0) {
            cell.chips = [...state.playerPiles[state.selectedPileIndex]];
            state.playerPiles[state.selectedPileIndex] = null;
            state.selectedPileIndex = null;
            state.hoveredCell = null;
            state.moves++;
            updateStat('moves-count', state.moves);

            // New Color Logic
            if (state.moves % 10 === 0 && state.numColors < COLORS.length) {
                state.numColors++;
                const newCol = COLORS[state.numColors - 1];
                addActiveColor(newCol);
            }

            refillPlayerPiles();
            await processMove(q, r);
        }
    }
});

// --- RENDER LOOP ---

function render() {
    // Rotation logic
    if (state.keysPressed.ArrowLeft) state.rotation -= 2;
    if (state.keysPressed.ArrowRight) state.rotation += 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const rect = canvas.getBoundingClientRect();

    // 1. Board Backgrounds
    // Need to center the board?
    // drawHexBackground uses axialToPixel which returns coords from 0,0 center.
    // So we MUST translate to center of canvas.
    // But graphics.js drawHexBackground logic: `ctx.translate(x, y)`.
    // It assumes `x,y` are relative to current origin.
    // So we need to set origin to center of canvas.

    ctx.save();
    ctx.translate(rect.width / 2, rect.height / 2);
    ctx.rotate(state.rotation * Math.PI / 180);
    // Now (0,0) is center and rotated.
    // But wait, `drawHexBackground` logic:
    // `state.board.forEach...`
    // It iterates independently.

    state.board.forEach((cell, key) => {
        const [q, r] = key.split(',').map(Number);
        drawHexBackground(ctx, q, r, cell.chips);
    });

    // 2. Chips
    state.board.forEach((cell, key) => {
        const [q, r] = key.split(',').map(Number);
        drawHexChips(ctx, q, r, cell.chips);
    });

    ctx.restore(); // Back to top-left for other things?

    // 2.5 Effects (Elimination)
    // EliminationEffect.draw expects rotation, centerX, centerY.
    state.effects = state.effects.filter(fx => fx.draw(ctx, state.rotation, rect.width / 2, rect.height / 2));

    // 3. Animated Chips
    // AnimatedChip.draw expects rotation, canvasWidth, canvasHeight to center itself.
    state.animatedChips = state.animatedChips.filter(chip => !chip.done);
    state.animatedChips.forEach(chip => {
        chip.update();
        chip.draw(ctx, state.rotation, rect.width, rect.height);
    });

    // 4. Flow Indicators
    if (state.hoveredCell && state.selectedPileIndex !== null && !state.isAnimating) {
        const hoveredKey = `${state.hoveredCell.q},${state.hoveredCell.r}`;
        const hoveredCell = state.board.get(hoveredKey);
        if (hoveredCell && hoveredCell.chips.length === 0) {
            // Need logic to find targets (logic.js)
            // But main render loop shouldn't call logic heavy stuff?
            // Actually game.js did calling `drawFlowIndicators`.
            // We need `drawFlowIndicators` logic.
            // I missed extracting `drawFlowIndicators` to graphics/logic?

            // Re-implement simplified or extract properly?
            // `drawFlowIndicators` in game.js called `findFlowTarget` and `drawFlowArrow`.
            // `findFlowTarget` is in logic.js. `drawFlowArrow` is in graphics.js.
            // So we can implement `drawFlowIndicators` here or in graphics helper.
            // Let's implement here for clarity or create helper.

            // TODO: Extract logic properly. 
            // I'll implement inline for now to avoid file jumping.

            const pile = state.playerPiles[state.selectedPileIndex];
            if (pile) {
                // SimBoard... expensive?
                // game.js did it.
                // We need `findFlowTarget` from logic.js!
                // I need to import it. (Done).

                // ... implementation ...
                const simBoard = new Map();
                state.board.forEach((cell, key) => {
                    simBoard.set(key, { chips: [...cell.chips] });
                });
                simBoard.set(hoveredKey, { chips: [...pile] });

                let currentQ = state.hoveredCell.q;
                let currentR = state.hoveredCell.r;
                const visited = new Set();
                const maxArrows = 5;

                // Draw arrows
                // Iterate...
                // Ideally this logic should have been in graphics/logic as `getFlowPath`.
                // Let's iterate here.

                // Wait, `findFlowTarget` needs `boardState`.
                // findFlowTarget imported at top level

                for (let i = 0; i < maxArrows; i++) {
                    const key = `${currentQ},${currentR}`;
                    if (visited.has(key)) break;
                    visited.add(key);

                    const cell = simBoard.get(key);
                    if (!cell || cell.chips.length === 0) break;
                    const topColor = cell.chips[cell.chips.length - 1];

                    const target = findFlowTarget(currentQ, currentR, topColor, simBoard);

                    if (target) {
                        drawFlowArrow(ctx, state.rotation, currentQ, currentR, target.q, target.r, topColor, 0.8 - (i * 0.15), rect.width, rect.height);

                        // Update sim
                        const targetKey = `${target.q},${target.r}`;
                        const targetCell = simBoard.get(targetKey);

                        // Move chips logic sim
                        const moving = [];
                        while (cell.chips.length > 0 && cell.chips[cell.chips.length - 1] === topColor) {
                            moving.push(cell.chips.pop());
                        }
                        if (targetCell) {
                            for (let k = moving.length - 1; k >= 0; k--) targetCell.chips.push(moving[k]);
                        }
                        currentQ = target.q;
                        currentR = target.r;
                    } else {
                        break;
                    }
                }
            }
        }
    }

    // 5. Particles
    state.particles = state.particles.filter(p => p.life > 0);
    state.particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    requestAnimationFrame(render);
}

// Start
resize();
initBoard();
resetGame();
requestAnimationFrame(render);
