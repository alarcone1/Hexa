import { state } from './state.js?v=3.0';
import { COLORS } from './constants.js?v=3.0';
import { formatTime } from './utils.js?v=3.0';
import { spawnConfetti } from './graphics.js?v=3.0';

// Elementos del DOM
const scoreEl = document.getElementById('score');
const goalEl = document.getElementById('goal');
const movesEl = document.getElementById('moves-count');
const mulliganBtn = document.getElementById('mulligan-btn');
const gameoverModal = document.getElementById('gameover-modal');
const helpModal = document.getElementById('help-modal');
const configModal = document.getElementById('config-modal');

// --- STATISTICS & HUD ---

export function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) {
        const current = parseInt(el.innerText) || 0;
        if (current !== value) {
            el.innerText = value;
            el.classList.remove('changed');
            void el.offsetWidth; // Trigger reflow
            el.classList.add('changed');
        } else {
            el.innerText = value;
        }
    }

    // Update Progress Bar if score or goal changes
    if (id === 'score' || id === 'goal') {
        updateGoalProgress();
    }
}

function updateGoalProgress() {
    const bar = document.getElementById('goal-progress-fill');
    const label = document.getElementById('goal-progress-label');
    // Ensure state.goal is valid to avoid division by zero
    const goal = state.goal || 100;
    // Use the value passed to updateStat? No, read from state is safer for 'goal' context
    // Actually logic.js updates state.score before calling updateStat.

    if (bar && label) {
        const pct = Math.min(100, Math.floor((state.score / goal) * 100));
        bar.style.width = `${pct}%`;
        label.innerText = `${pct}%`;

        // Hide label if 0% to avoid clutter, show if > 0%
        label.style.opacity = pct > 0 ? '1' : '0';

        // Optional: Change color if near goal?
        if (pct >= 80) {
            bar.style.boxShadow = '0 0 15px var(--color-gold)';
            label.style.color = 'var(--color-gold)';
        } else {
            bar.style.boxShadow = '0 0 12px var(--color-accent)';
            label.style.color = 'var(--color-accent)';
        }
    }
}

export function updatePileUI() {
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`pile-${i}`);
        if (!slot) continue;
        slot.innerHTML = '';
        slot.classList.toggle('selected', state.selectedPileIndex === i);

        if (state.playerPiles[i]) {
            const preview = document.createElement('div');
            preview.style.display = 'flex';
            preview.style.flexDirection = 'column-reverse';
            state.playerPiles[i].forEach(color => {
                const chip = document.createElement('div');
                chip.style.width = '30px';
                chip.style.height = '10px';
                chip.style.backgroundColor = color;
                chip.style.margin = '1px';
                chip.style.borderRadius = '2px';
                chip.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                preview.appendChild(chip);
            });
            slot.appendChild(preview);
        }
    }

    // Actualizar botón mulligan si es necesario
    if (mulliganBtn) {
        mulliganBtn.innerHTML = `<span class="btn-icon" data-lucide="shuffle"></span> Otra Tanda (${state.mulligans})`;
        mulliganBtn.disabled = state.mulligans === 0;
        if (window.lucide) window.lucide.createIcons();
    }
}

export function renderActiveColors() {
    const list = document.getElementById('active-colors-list');
    if (!list) return;
    list.innerHTML = '';
    const active = COLORS.slice(0, state.numColors);
    active.forEach(color => addActiveColor(color));
}

export function addActiveColor(color) {
    const list = document.getElementById('active-colors-list');
    if (!list) return;
    // Evitar duplicados visuales si ya existe (aunque renderActiveColors limpia)
    // Pero addActiveColor se llama incrementalmente.
    // Verificamos si ya existe el último hijo con ese color para no duplicar si se llama redundante?
    // Mejor confiar en la lógica del juego.

    // Remove 'latest' class from any existing chips
    const existingChips = list.getElementsByClassName('active-color-chip');
    Array.from(existingChips).forEach(c => c.classList.remove('latest'));

    const chip = document.createElement('div');
    chip.className = 'active-color-chip latest'; // Add latest class
    chip.style.backgroundColor = color;
    list.appendChild(chip);

    // Forzar reflow para animación
    void chip.offsetWidth;
    chip.classList.add('visible');
}

// --- MODALS & GAME OVER ---

export function showGameOver() {
    state.isGameOver = true;
    document.getElementById('modal-title').innerText = "💀 GAME OVER";
    document.getElementById('final-moves').innerText = state.moves;
    const timeTotal = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
    document.getElementById('final-time').innerText = formatTime(timeTotal);

    // Ocultar stats de éxito
    document.getElementById('best-combo').parentNode.style.display = 'none';
    document.getElementById('total-eliminated').parentNode.style.display = 'none';

    gameoverModal.classList.add('active');
}

export function gameWin() {
    if (state.isGameOver) return;
    state.isGameOver = true;

    try {
        saveScore(true);
        state.level++;
        spawnConfetti();
    } catch (e) {
        console.error("Error in gameWin (stats/confetti):", e);
    }

    // Retrasar modal para ver la celebración
    setTimeout(() => {
        try {
            document.getElementById('modal-title').innerText = "🏆 ¡NIVEL COMPLETADO!";

            // Change button text to "SIGUIENTE NIVEL"
            const restartBtn = document.getElementById('restart-btn');
            if (restartBtn) {
                restartBtn.innerHTML = '<i data-lucide="arrow-right"></i> SIGUIENTE NIVEL';
                restartBtn.onclick = () => {
                    if (window.restartGame) {
                        window.restartGame(true);
                    } else {
                        console.error("restartGame not found on window");
                        location.reload();
                    }
                };
            }

            document.getElementById('final-moves').innerText = state.moves;
            const timeTotal = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
            document.getElementById('final-time').innerText = formatTime(timeTotal);

            const bestComboRow = document.getElementById('best-combo').parentNode;
            const totalElimRow = document.getElementById('total-eliminated').parentNode;
            if (bestComboRow) bestComboRow.style.display = 'flex';
            if (totalElimRow) totalElimRow.style.display = 'flex';

            document.getElementById('best-combo').innerText = state.stats.bestCombo;
            document.getElementById('total-eliminated').innerText = state.stats.totalEliminated;
        } catch (uiError) {
            console.error("Error updating Game Win Modal UI:", uiError);
        }

        gameoverModal.classList.add('active');
        if (window.lucide) window.lucide.createIcons();
    }, 1500);
}



export function saveScore(isWin) {
    if (!isWin) return;

    const storageKey = 'hexaflow_scores_v4';
    let allScores = JSON.parse(localStorage.getItem(storageKey) || '{}');

    if (!allScores[state.difficulty]) allScores[state.difficulty] = [];

    const endTime = Date.now();
    const timeSeconds = state.startTime ? Math.floor((endTime - state.startTime) / 1000) : 0;

    const newEntry = {
        moves: state.moves,
        time: timeSeconds,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        score: state.score,
        level: state.level // Save Level
    };

    allScores[state.difficulty].push(newEntry);

    // CRITERIO DE RANKING (ASCENSIÓN):
    // 1. Mayor Nivel (Descendente)
    // 2. Menos Movimientos (Ascendente)
    // 3. Menos Tiempo (Ascendente)
    allScores[state.difficulty].sort((a, b) => {
        const lvA = a.level || 1;
        const lvB = b.level || 1;
        if (lvA !== lvB) return lvB - lvA; // Higher level = better
        if (a.moves !== b.moves) return a.moves - b.moves;
        return a.time - b.time;
    });

    // Mantener solo top 5
    allScores[state.difficulty] = allScores[state.difficulty].slice(0, 5);

    localStorage.setItem(storageKey, JSON.stringify(allScores));

    return newEntry;
}

// --- CONFIG MODAL helpers ---
export function toggleConfig() {
    state.isConfigOpen = !state.isConfigOpen;
    configModal.classList.toggle('active', state.isConfigOpen);
    updateDifficultyButtons();
}

export function updateDifficultyButtons() {
    document.querySelectorAll('.segment-btn').forEach(btn => {
        const diff = parseInt(btn.dataset.difficulty);
        // Rename Labels
        if (diff === 2) btn.innerText = "Pequeño";
        if (diff === 3) btn.innerText = "Normal";
        if (diff === 4) btn.innerText = "Grande";
        btn.classList.toggle('active', diff === state.difficulty);
    });

    const texts = {
        2: "Radio 2 • 19 celdas",
        3: "Radio 3 • 37 celdas",
        4: "Radio 4 • 61 celdas"
    };
    const descEl = document.getElementById('difficulty-description');
    if (descEl) descEl.innerText = texts[state.difficulty] || "";
}

export function toggleHelp() {
    state.isHelpOpen = !state.isHelpOpen;
    helpModal.classList.toggle('active', state.isHelpOpen);
}

export function updateGoalLabel(value) {
    const lbl = document.getElementById('goal-label');
    if (lbl) lbl.innerText = value;
}

export function updateHeightLabel(value) {
    const lbl = document.getElementById('height-label');
    if (lbl) lbl.innerText = value;
}

export function updateFriendshipLabel(value) {
    const lbl = document.getElementById('friendship-label');
    if (lbl) lbl.innerText = value;
}

export function updateRevealLabel(value) {
    const lbl = document.getElementById('reveal-label');
    if (lbl) lbl.innerText = value;
}

export function updateAnalysisLabel(value) {
    const lbl = document.getElementById('analysis-label');
    if (lbl) lbl.innerText = value;
}

// Ranking Modal
export function showRankingModal(forceDifficulty = null) {
    const modal = document.getElementById('ranking-modal');
    const container = document.getElementById('full-scores-list');

    // Determine difficulty to show (default to current game difficulty if not specified)
    // But if we are switching tabs, we stick to the forced one.
    let showDiff = forceDifficulty !== null ? forceDifficulty : state.difficulty;

    // Update active state of tabs
    const tabs = document.querySelectorAll('.ranking-filter');
    tabs.forEach(btn => {
        const d = parseInt(btn.dataset.difficulty);
        if (d === showDiff) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const storageKey = 'hexaflow_scores_v4';
    const allScores = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const scores = allScores[showDiff] || [];

    if (scores.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay registros aún.</p>';
    } else {
        container.innerHTML = scores.map((s, i) => {
            let medalClass = '';
            if (i === 0) medalClass = 'gold';
            else if (i === 1) medalClass = 'silver';
            else if (i === 2) medalClass = 'bronze';

            const d = new Date(s.timestamp || Date.now());
            const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            let timeStr = "";
            if (s.timestamp) {
                timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            return `
            <div class="ranking-row ${medalClass}">
                <span>${i + 1}</span>
                <span style="color: var(--color-gold); font-weight: bold;">${s.level || 1}</span>
                <span>${s.moves}</span>
                <span>${formatTime(s.time)}</span>
                <span>${dateStr}</span>
                <span style="font-size: 0.9em; opacity: 0.7;">${timeStr}</span>
            </div>
            `;
        }).join('');
    }

    modal.classList.add('active');
}

export function filterRankingByDifficulty(level) {
    showRankingModal(level);
}

export function closeRanking() {
    document.getElementById('ranking-modal').classList.remove('active');
}
