import { state, hexRadius, loadProgress } from './state.js?v=3.1';
import { COLORS } from './constants.js?v=3.1';
import { initBoard, refillPlayerPiles, mulligan, processMove, checkEliminationAt, findFlowTarget } from './logic.js?v=3.1';
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
    updateFriendshipLabel,
    updateRevealLabel,
    updateAnalysisLabel,
    saveScore,
    filterRankingByDifficulty,
    showLevelFlashcard,
    handleCellHover
} from './ui.js?v=3.1';
import {
    drawHexBackground,
    drawHexChips,
    drawFlowArrow
} from './graphics.js?v=3.1';
import { pixelToAxial } from './utils.js?v=3.1';

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

    // Limpieza de estilos residuales si los hay
    const overlay = document.getElementById('message-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.opacity = 0;
        overlay.innerText = '';
    }

    resize(); // Recalcular escala segun dificultad

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

    // ASCENSIÓN: Mostrar Flashcard al inicio del Nivel (Partida 1)
    if (state.subLevel === 1) {
        import('./constants.js?v=3.1').then(m => {
            const types = ['ROCK', 'GRIETA', 'IMAN', 'VENTILADOR', 'CRISTAL', 'VALVULA', 'AGUJERO', 'PEAJE', 'NIEBLA', 'NUCLEO'];
            const obstacleType = types[Math.min(state.level - 2, types.length - 1)];
            const info = m.OBSTACLE_TYPES[obstacleType] || null;
            showLevelFlashcard(state.level, info);
        });
    }
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

function setFriendship(value) {
    state.friendshipThreshold = parseInt(value) / 100;
}

function setRevealBonus(value) {
    state.revealBonus = parseInt(value);
}

function setAnalysisHeight(value) {
    state.analysisHeight = parseInt(value);
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
    if (confirm('¿Seguro que quieres borrar todos los datos de juego y progreso de campaña?')) {
        localStorage.removeItem('hexaflow_scores_v4');
        localStorage.removeItem('hexaflow_progression_v1');
        alert('Datos borrados. El juego se reiniciará.');
        location.reload();
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
window.setGoal = setGoal;
window.setMaxHeight = setMaxHeight;
window.setFriendship = setFriendship;
window.setRevealBonus = setRevealBonus;
window.setAnalysisHeight = setAnalysisHeight;
window.updateGoalLabel = updateGoalLabel;
window.updateHeightLabel = updateHeightLabel;
window.updateFriendshipLabel = updateFriendshipLabel;
window.updateRevealLabel = updateRevealLabel;
window.updateAnalysisLabel = updateAnalysisLabel;
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

    // Calcular escala dinámica basada en el tablero
    // El tablero tiene radio 'state.difficulty'. 
    // Ancho total en hexes approx: (2 * radius + 1) * HEX_SIZE * 2.2
    const boardRadius = state.difficulty || 3;
    const boardWidthPx = (2 * boardRadius + 1) * 40 * 2.2; // Aumentado factor de seguridad de 1.8 a 2.2
    const boardHeightPx = (2 * boardRadius + 1) * 40 * 2.2;

    const scaleX = rect.width / boardWidthPx;
    const scaleY = rect.height / boardHeightPx;

    // Usar la menor escala para asegurar que quepa todo, limitado a un rango razonable
    state.scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.4), 1.2);

    console.log(`Resize: Scale set to ${state.scale.toFixed(2)} for difficulty ${boardRadius}`);
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
    // Aplicar escala inversa al mouse
    mouseX /= state.scale;
    mouseY /= state.scale;

    const rad = -state.rotation * Math.PI / 180;
    const rx = mouseX * Math.cos(rad) - mouseY * Math.sin(rad);
    const ry = mouseX * Math.sin(rad) + mouseY * Math.cos(rad);
    const { q, r } = pixelToAxial(rx, ry);
    const key = `${q},${r}`;

    if (state.board.has(key)) {
        state.hoveredCell = { q, r };
        const cell = state.board.get(key);
        handleCellHover(cell);
    } else {
        state.hoveredCell = null;
        handleCellHover(null);
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
        // Aplicar escala inversa al mouse
        mouseX /= state.scale;
        mouseY /= state.scale;

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
        if (cell.chips.length === 0 && !cell.isObstacle) {
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

    // Resetear matriz de transformación para limpiar TODO el canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Restaurar el escalado por DPR para dibujo de alta resolución
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);

    // Limpieza agresiva de sombras y estados previos
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.globalAlpha = 1.0;
    ctx.filter = 'none';

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
    ctx.scale(state.scale, state.scale);
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
loadProgress(); // Cargar nivel guardado antes de inicializar tablero
initBoard();
resetGame();
requestAnimationFrame(render);
