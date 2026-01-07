/**
 * HEXAFLOW: STRATEGIC HONEYCOMB
 * Lógica del juego modularizada.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const goalEl = document.getElementById('goal');
// const roundEl = document.getElementById('round'); 
const movesEl = document.getElementById('moves-count');
const mulliganBtn = document.getElementById('mulligan-btn');
const messageOverlay = document.getElementById('message-overlay');
const helpModal = document.getElementById('help-modal');
const gameoverModal = document.getElementById('gameover-modal');

// CONFIGURACIÓN
let hexRadius = 2; // Dinámico: 2-4 (inicia en Fácil)
const HEX_SIZE = 40;
const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316'];
const DIFFICULTY_NAMES = { 2: 'Fácil', 3: 'Normal', 4: 'Difícil' };
const DIFFICULTY_ICONS = { 2: '○', 3: '◔', 4: '●' }; // Iconos minimalistas
const configModal = document.getElementById('config-modal');

let state = {
    score: 0,
    goal: 150, // Meta fija por partida (aumentable por dificultad si se quiere)
    // round: 1, // ELIMINAMOS RONDAS
    mulligans: 3,
    numColors: 3,
    difficulty: 2, // Radio del tablero (2-4), inicia en Fácil
    maxStackHeight: 15, // Límite de altura por celda (configurable)
    moves: 0, // Contador de movimientos
    startTime: null, // Tiempo de inicio para calcular duración
    board: new Map(), // key: "q,r", value: { chips: [] }
    playerPiles: [null, null, null],
    selectedPileIndex: null,
    rotation: 0, // En grados
    rotationSpeed: 0, // Velocidad actual de rotación
    keysPressed: { ArrowLeft: false, ArrowRight: false }, // Estado de teclas
    isGameOver: false,
    isConfigOpen: false,
    isConfigOpen: false,
    particles: [], // Partículas en espacio de pantalla (confetti)
    effects: [], // Efectos en espacio del tablero (eliminaciones, etc)
    // Estadísticas de la partida
    stats: {
        bestCombo: 0,
        currentCombo: 0,
        totalEliminated: 0
    },
    // Fichas en animación
    animatedChips: [],
    // Celda actualmente bajo el mouse (para preview)
    hoveredCell: null // { q, r }
};

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 6 + 4; // Variedad de tamaños
        this.vx = (Math.random() - 0.5) * 4; // Movimiento lateral suave
        this.vy = Math.random() * 5 + 2; // Velocidad de caída inicial
        this.life = 1.0;
        this.gravity = 0.05; // Gravedad ligera
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= 0.004; // Durar ~4-5 segundos (60fps)
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.translate(this.x, this.y);
        this.rotation += this.rotationSpeed;
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.fillStyle = this.color;

        // Formas variadas: rectangulos y circulos
        if (this.size > 7) {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// EFECTO DE ELIMINACIÓN: IMPLOSIÓN GRAVITACIONAL
class EliminationEffect {
    constructor(q, r, color) {
        this.q = q;
        this.r = r;
        this.color = color;
        this.startTime = performance.now();
        this.duration = 800; // ms
        const pos = axialToPixel(q, r);
        this.x = pos.x;
        this.y = pos.y;
    }

    draw(ctx, rotation, centerX, centerY) {
        const elapsed = performance.now() - this.startTime;
        const progress = elapsed / this.duration;

        if (progress >= 1) return false; // Terminado

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(this.x, this.y);

        // FASE 1: IMPLOSIÓN (0.0 -> 0.4)
        // La ficha se contrae rápidamente hacia el centro
        if (progress < 0.4) {
            const p = progress / 0.4;
            const scale = 1 - p; // De 1 a 0

            // Dibujar Hexágono contrayéndose
            const size = HEX_SIZE * 0.65 * scale;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const px = size * Math.cos(angle);
                const py = size * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();

            // Borde brillante oscilante
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2 * scale;
            ctx.stroke();
        }

        // FASE 2: DESTELLO (0.4 -> 0.6)
        // Un flash brillante en el centro
        else if (progress < 0.6) {
            const p = (progress - 0.4) / 0.2; // 0 a 1
            const alpha = 1 - Math.abs(2 * p - 1); // Fade in-out

            const radius = HEX_SIZE * (0.5 + p * 0.5);
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            grad.addColorStop(0, "rgba(255, 255, 255, 1)");
            grad.addColorStop(0.5, `rgba(255, 255, 255, ${0.8 * alpha})`);
            grad.addColorStop(1, "rgba(255, 255, 255, 0)");

            ctx.globalAlpha = alpha;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // FASE 3: ONDA EXPANSIVA (0.4 -> 1.0)
        // Anillo que se expande desde el centro
        if (progress > 0.4) {
            const p = (progress - 0.4) / 0.6; // 0 a 1
            const radius = HEX_SIZE * (0.5 + p * 1.5); // Expansión grande
            const alpha = 1 - p; // Fade out

            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3 * (1 - p);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Segundo anillo más rápido (blanco)
            if (p < 0.8) {
                const r2 = HEX_SIZE * (0.2 + p * 2.0);
                ctx.strokeStyle = "white";
                ctx.lineWidth = 1;
                ctx.globalAlpha = (1 - p) * 0.5;
                ctx.beginPath();
                ctx.arc(0, 0, r2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }
        }

        ctx.restore();
        return true; // Sigue vivo
    }
}

function spawnConfetti() {
    // "Lluvia" de confeti masiva
    for (let i = 0; i < 600; i++) {
        // Posición aleatoria en ancho
        const x = Math.random() * canvas.width;
        // Esparcir verticalmente para que caigan durante un rato
        const y = -100 - Math.random() * 800;

        // Solo colores DESBLOQUEADOS
        const color = COLORS[Math.floor(Math.random() * state.numColors)];
        state.particles.push(new Particle(x, y, color));
    }
}

// FICHA ANIMADA con efecto "hojas de libro"
class AnimatedChip {
    constructor(fromQ, fromR, toQ, toR, color, duration = 250) {
        const from = axialToPixel(fromQ, fromR);
        const to = axialToPixel(toQ, toR);
        this.startX = from.x;
        this.startY = from.y;
        this.endX = to.x;
        this.endY = to.y;
        this.x = from.x;
        this.y = from.y;
        this.color = color;
        this.progress = 0;
        this.duration = duration;
        this.startTime = performance.now();
        this.done = false;
        this.flipPhase = 0; // 0 a 1, representa la rotación de la "hoja"
    }

    update() {
        const elapsed = performance.now() - this.startTime;
        this.progress = Math.min(elapsed / this.duration, 1);

        // Easing más suave para movimiento tipo página
        const eased = this.easeInOutQuad(this.progress);

        // Interpolación de posición
        this.x = this.startX + (this.endX - this.startX) * eased;
        this.y = this.startY + (this.endY - this.startY) * eased;

        // Efecto de arco más pronunciado (la ficha sube como hoja volteando)
        const arcHeight = 20 + (this.duration / 100) * 3;
        const arc = Math.sin(this.progress * Math.PI) * arcHeight;
        this.y -= arc;

        if (this.progress >= 1) {
            this.done = true;
        }

        // Actualizar fase de volteo
        this.flipPhase = this.progress;
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    draw(ctx, rotation, canvasWidth, canvasHeight) {
        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(this.x, this.y);

        // Efecto de "volteo" tipo hoja de libro
        // La ficha se aplana en el eje X en el medio del movimiento
        const flipAngle = Math.sin(this.flipPhase * Math.PI);
        const scaleX = Math.cos(this.flipPhase * Math.PI * 0.7); // Compresión horizontal
        const scaleY = 1 + flipAngle * 0.1; // Pequeño estiramiento vertical

        ctx.scale(Math.abs(scaleX) * 0.8 + 0.2, scaleY);

        // Rotación sutil en Z para efecto de volteo
        ctx.rotate(flipAngle * 0.15);

        // Sombra dinámica más pronunciada en el punto más alto
        const shadowIntensity = 0.4 + flipAngle * 0.4;
        ctx.shadowColor = `rgba(0,0,0,${shadowIntensity})`;
        ctx.shadowBlur = 6 + flipAngle * 10;
        ctx.shadowOffsetY = 3 + flipAngle * 6;
        ctx.shadowOffsetX = flipAngle * 4;

        // Dibujar ficha con esquinas redondeadas
        const size = HEX_SIZE * 0.65;
        ctx.beginPath();
        const vertices = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            vertices.push({
                x: size * Math.cos(angle),
                y: size * Math.sin(angle)
            });
        }

        for (let i = 0; i < 6; i++) {
            const curr = vertices[i];
            const next = vertices[(i + 1) % 6];
            const midX = (curr.x + next.x) / 2;
            const midY = (curr.y + next.y) / 2;
            const t = 0.75;
            const startX = curr.x * t + midX * (1 - t);
            const startY = curr.y * t + midY * (1 - t);
            const endX = next.x * t + midX * (1 - t);
            const endY = next.y * t + midY * (1 - t);

            if (i === 0) ctx.moveTo(startX, startY);
            ctx.lineTo(startX, startY);
            ctx.quadraticCurveTo(midX, midY, endX, endY);
        }
        ctx.closePath();

        // Gradiente con brillo dinámico según la fase del flip
        const brightness = 20 + flipAngle * 30;
        const grad = ctx.createRadialGradient(0, -size / 3, 0, 0, 0, size);
        grad.addColorStop(0, adjustColor(this.color, brightness));
        grad.addColorStop(0.5, this.color);
        grad.addColorStop(1, adjustColor(this.color, -40));
        ctx.fillStyle = grad;
        ctx.fill();

        // Borde brillante durante el flip
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowOffsetX = 0;
        ctx.strokeStyle = `rgba(255,255,255,${0.3 + flipAngle * 0.4})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}

// UTILS HEXAGONALES
function axialToPixel(q, r) {
    const x = HEX_SIZE * (3 / 2 * q);
    const y = HEX_SIZE * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
    return { x, y };
}

function pixelToAxial(x, y) {
    const q = (2 / 3 * x) / HEX_SIZE;
    const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / HEX_SIZE;
    return roundHex(q, r);
}

function roundHex(q, r) {
    let s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const dq = Math.abs(rq - q);
    const dr = Math.abs(rr - r);
    const ds = Math.abs(rs - s);

    if (dq > dr && dq > ds) {
        rq = -rr - rs;
    } else if (dr > ds) {
        rr = -rq - rs;
    }
    return { q: rq, r: rr };
}

function getNeighbors(q, r) {
    const dirs = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    return dirs.map(d => ({ q: q + d.q, r: r + d.r }));
}

// Encuentra hacia dónde saltaría una ficha de un color desde una celda
function findFlowTarget(q, r, topColor, boardState) {
    const neighbors = getNeighbors(q, r);
    let bestTarget = null;
    let maxSameColor = -1;
    let maxTotalChips = -1;

    for (const n of neighbors) {
        const nKey = `${n.q},${n.r}`;
        if (boardState.has(nKey)) {
            const nCell = boardState.get(nKey);
            if (nCell.chips.length > 0 && nCell.chips[nCell.chips.length - 1] === topColor) {
                const sameColorCount = nCell.chips.filter(c => c === topColor).length;

                if (sameColorCount > maxSameColor) {
                    maxSameColor = sameColorCount;
                    maxTotalChips = nCell.chips.length;
                    bestTarget = { q: n.q, r: n.r };
                } else if (sameColorCount === maxSameColor) {
                    if (nCell.chips.length > maxTotalChips) {
                        maxTotalChips = nCell.chips.length;
                        bestTarget = { q: n.q, r: n.r };
                    }
                }
            }
        }
    }
    return bestTarget;
}

// Dibuja una flecha entre dos celdas
function drawFlowArrow(fromQ, fromR, toQ, toR, color, alpha) {
    const from = axialToPixel(fromQ, fromR);
    const to = axialToPixel(toQ, toR);
    const rect = canvas.getBoundingClientRect();

    ctx.save();
    ctx.translate(rect.width / 2, rect.height / 2);
    ctx.rotate(state.rotation * Math.PI / 180);

    // Calcular dirección y acortar la flecha
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;

    // Puntos de inicio y fin (acortados para no tapar las fichas)
    const startX = from.x + ux * 25;
    const startY = from.y + uy * 25;
    const endX = to.x - ux * 25;
    const endY = to.y - uy * 25;

    ctx.globalAlpha = alpha;

    // Línea de la flecha con gradiente
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, color);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Punta de la flecha
    const arrowSize = 8;
    const angle = Math.atan2(dy, dx);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI / 6),
        endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI / 6),
        endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1.0;
    ctx.restore();
}

// Dibuja indicadores de flujo para una pila que se colocaría en (q, r)
function drawFlowIndicators(q, r, pile) {
    if (!pile || pile.length === 0) return;

    // Simular el estado del tablero con la pila colocada
    const simBoard = new Map();
    state.board.forEach((cell, key) => {
        simBoard.set(key, { chips: [...cell.chips] });
    });
    simBoard.set(`${q},${r}`, { chips: [...pile] });

    // Rastrear los primeros movimientos de la cadena
    const arrows = [];
    const visited = new Set();
    let currentQ = q;
    let currentR = r;
    let maxArrows = 5; // Limitar para no sobrecargar visualmente

    for (let i = 0; i < maxArrows; i++) {
        const key = `${currentQ},${currentR}`;
        if (visited.has(key)) break;
        visited.add(key);

        const cell = simBoard.get(key);
        if (!cell || cell.chips.length === 0) break;

        const topColor = cell.chips[cell.chips.length - 1];
        const target = findFlowTarget(currentQ, currentR, topColor, simBoard);

        if (target) {
            arrows.push({
                fromQ: currentQ,
                fromR: currentR,
                toQ: target.q,
                toR: target.r,
                color: topColor,
                alpha: 0.8 - (i * 0.15) // Flechas más lejanas más tenues
            });

            // Simular el movimiento
            const chip = cell.chips.pop();
            const targetCell = simBoard.get(`${target.q},${target.r}`);
            if (targetCell) {
                targetCell.chips.push(chip);
            }

            currentQ = target.q;
            currentR = target.r;
        } else {
            break;
        }
    }

    // Dibujar las flechas
    arrows.forEach(arrow => {
        drawFlowArrow(arrow.fromQ, arrow.fromR, arrow.toQ, arrow.toR, arrow.color, arrow.alpha);
    });
}

// INICIALIZACIÓN
function initBoard() {
    state.board.clear();
    const radius = state.difficulty;
    for (let q = -radius; q <= radius; q++) {
        let r1 = Math.max(-radius, -q - radius);
        let r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r++) {
            state.board.set(`${q},${r}`, { chips: [] });
        }
    }
    hexRadius = radius; // Actualizar variable global para renderizado
}

function generatePile() {
    const size = 2 + Math.floor(Math.random() * 3);
    const chips = [];
    for (let i = 0; i < size; i++) {
        chips.push(COLORS[Math.floor(Math.random() * state.numColors)]);
    }
    return chips;
}

function refillPlayerPiles() {
    const allEmpty = state.playerPiles.every(p => p === null);
    if (allEmpty) {
        for (let i = 0; i < 3; i++) {
            state.playerPiles[i] = generatePile();
        }
    }
    updatePileUI();
}

function updatePileUI() {
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`pile-${i}`);
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
}

// INTERACCIÓN
function selectPile(index) {
    if (!state.playerPiles[index] || state.isAnimating || state.isHelpOpen) return;
    state.selectedPileIndex = (state.selectedPileIndex === index) ? null : index;
    updatePileUI();
}

function mulligan() {
    if (state.mulligans > 0 && !state.isAnimating && !state.isHelpOpen) {
        state.mulligans--;
        state.playerPiles = [generatePile(), generatePile(), generatePile()];
        mulliganBtn.innerHTML = `<span class="btn-icon">↺</span> Otra Tanda (${state.mulligans})`;
        if (state.mulligans === 0) mulliganBtn.disabled = true;
        updatePileUI();
    }
}

function toggleHelp() {
    state.isHelpOpen = !state.isHelpOpen;
    helpModal.classList.toggle('active', state.isHelpOpen);
    // El ranking ya no se muestra en el modal de ayuda
}

function showRankingFromConfig() {
    toggleConfig(); // Cerrar config
    showRankingModal();
}

function showRankingFromModal() {
    gameoverModal.classList.remove('active');
    showRankingModal();
}

// Mostrar Ranking con soporte de Tabs
function showRankingModal(forceDifficulty = null) {
    const modal = document.getElementById('ranking-modal');
    const container = document.getElementById('full-scores-list');

    // Dificultad a mostrar: la pasada por argumento o la actual del estado
    const showDiff = forceDifficulty !== null ? forceDifficulty : state.difficulty;

    // Renderizar Tabs de Dificultad
    const difficultyControlHtml = `
        <div class="difficulty-segmented-control" style="margin-bottom: 20px;">
            <button class="segment-btn ${showDiff === 2 ? 'active' : ''}" onclick="showRankingModal(2)">FÁCIL</button>
            <button class="segment-btn ${showDiff === 3 ? 'active' : ''}" onclick="showRankingModal(3)">NORMAL</button>
            <button class="segment-btn ${showDiff === 4 ? 'active' : ''}" onclick="showRankingModal(4)">DIFÍCIL</button>
        </div>
    `;

    // Reemplazar el label anterior con los tabs
    const headerContainer = document.getElementById('ranking-header-container'); // Necesitaremos este ID en HTML
    if (headerContainer) {
        headerContainer.innerHTML = difficultyControlHtml;
    } else {
        // Fallback si no hemos actualizado HTML aún (para prevenir erorres durante dev)
        const label = document.getElementById('ranking-difficulty-label');
        if (label) label.style.display = 'none'; // ocultar viejo label
    }

    // Obtener scores
    const storageKey = 'hexaflow_scores_v4';
    let allScores = JSON.parse(localStorage.getItem(storageKey) || '{}');
    let levelScores = allScores[showDiff] || [];

    // Renderizar tabla
    if (levelScores.length === 0) {
        container.innerHTML = '<div style="padding: 20px; color: #64748b;">No hay records en este nivel aún.</div>';
    } else {
        container.innerHTML = levelScores.map((s, i) => {
            let medalClass = '';
            if (i === 0) medalClass = 'gold';
            if (i === 1) medalClass = 'silver';
            if (i === 2) medalClass = 'bronze';

            // Extraer hora si existe timestamp, sino fallback
            let dateStr = s.date;
            let timeStr = "--:--";

            if (s.timestamp) {
                const d = new Date(s.timestamp);
                dateStr = d.toLocaleDateString();
                timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            return `
            <div class="ranking-row ${medalClass}">
                <span>${i + 1}</span>
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

function closeRanking() {
    document.getElementById('ranking-modal').classList.remove('active');
}

function resetRankingsConfirm() {
    if (confirm("⚠️ ¿Estás seguro de que quieres borrar TODOS los rankings? Esta acción no se puede deshacer.")) {
        localStorage.removeItem('hexaflow_scores_v4');
        alert("Rankings eliminados.");
        toggleConfig();
    }
}

// RENDERIZADO
// Pasada 1: Solo dibuja el fondo de la celda hexagonal
function drawHexBackground(q, r, chips) {
    const { x, y } = axialToPixel(q, r);
    const rect = canvas.getBoundingClientRect();

    // Verificar si esta celda está siendo hovered
    const isHovered = state.hoveredCell &&
        state.hoveredCell.q === q &&
        state.hoveredCell.r === r;
    const isEmpty = chips.length === 0;
    const hasSelection = state.selectedPileIndex !== null;
    const showPreview = isHovered && isEmpty && hasSelection && !state.isAnimating;

    ctx.save();
    ctx.translate(rect.width / 2, rect.height / 2);
    ctx.rotate(state.rotation * Math.PI / 180);
    ctx.translate(x, y);

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = 2 * Math.PI / 6 * i;
        const px = HEX_SIZE * 0.95 * Math.cos(angle);
        const py = HEX_SIZE * 0.95 * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Color de fondo según estado
    if (showPreview) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    } else {
        ctx.fillStyle = '#1e293b';
    }
    ctx.fill();

    // Borde con highlight si es hover válido
    if (showPreview) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
        ctx.shadowBlur = 10;
    } else {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
}

// Pasada 2: Dibuja las fichas encima de todos los fondos
function drawHexChips(q, r, chips) {
    const { x, y } = axialToPixel(q, r);
    const rect = canvas.getBoundingClientRect();

    const isHovered = state.hoveredCell &&
        state.hoveredCell.q === q &&
        state.hoveredCell.r === r;
    const isEmpty = chips.length === 0;
    const hasSelection = state.selectedPileIndex !== null;
    const showPreview = isHovered && isEmpty && hasSelection && !state.isAnimating;

    ctx.save();
    ctx.translate(rect.width / 2, rect.height / 2);
    ctx.rotate(state.rotation * Math.PI / 180);
    ctx.translate(x, y);

    // Dibujar fichas reales
    chips.forEach((color, index) => {
        const offset = index * 4;
        drawChip(0, -offset, color, 1.0);
    });

    // Dibujar preview de fichas (semi-transparente)
    if (showPreview && state.playerPiles[state.selectedPileIndex]) {
        ctx.globalAlpha = 0.5;
        state.playerPiles[state.selectedPileIndex].forEach((color, index) => {
            const offset = index * 4;
            drawChip(0, -offset, color, 0.5);
        });
        ctx.globalAlpha = 1.0;
    }

    ctx.restore();
}

function drawChip(x, y, color) {
    const size = HEX_SIZE * 0.65; // Radio del hexágono
    const cornerRadius = 8; // Radio de las esquinas redondeadas

    ctx.save();
    ctx.translate(x, y);

    // Sombra más pronunciada para efecto de grosor
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 4;

    // Dibujar hexágono con esquinas redondeadas
    ctx.beginPath();
    const vertices = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i; // Orientación plana para coincidir con el tablero
        vertices.push({
            x: size * Math.cos(angle),
            y: size * Math.sin(angle)
        });
    }

    // Usar quadraticCurveTo para esquinas redondeadas
    for (let i = 0; i < 6; i++) {
        const curr = vertices[i];
        const next = vertices[(i + 1) % 6];

        // Punto intermedio para la curva
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;

        // Reducir el vértice para crear la curva
        const t = 0.75; // Factor de redondeo (0.5-0.9)
        const startX = curr.x * t + midX * (1 - t);
        const startY = curr.y * t + midY * (1 - t);
        const endX = next.x * t + midX * (1 - t);
        const endY = next.y * t + midY * (1 - t);

        if (i === 0) {
            ctx.moveTo(startX, startY);
        }
        ctx.lineTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
    }
    ctx.closePath();

    // Gradiente de relleno con brillo
    const grad = ctx.createRadialGradient(0, -size / 3, 0, 0, 0, size);
    grad.addColorStop(0, adjustColor(color, 30)); // Más brillante en el centro-arriba
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, adjustColor(color, -50));
    ctx.fillStyle = grad;
    ctx.fill();

    // Borde luminoso
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Borde interno sutil para profundidad
    ctx.strokeStyle = adjustColor(color, -30);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}

function adjustColor(hex, amt) {
    let usePound = false;
    if (hex[0] == "#") {
        hex = hex.slice(1);
        usePound = true;
    }
    let num = parseInt(hex, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

function showMessage(text) {
    const el = document.getElementById('message-overlay');
    el.innerText = text;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 1000);
}

function saveScore(isWin) {
    if (!isWin) return; // Solo guardamos victorias en el ranking de eficiencia

    const storageKey = 'hexaflow_scores_v4';
    let allScores = JSON.parse(localStorage.getItem(storageKey) || '{}');

    if (!allScores[state.difficulty]) allScores[state.difficulty] = [];

    const endTime = Date.now();
    const timeSeconds = state.startTime ? Math.floor((endTime - state.startTime) / 1000) : 0;

    const newEntry = {
        moves: state.moves,
        time: timeSeconds,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(), // Guardamos timestamp completo para hora
        score: state.score
    };

    allScores[state.difficulty].push(newEntry);

    // CRITERIO DE RANKING:
    // 1. Menos Movimientos (Ascendente)
    // 2. Menos Tiempo (Ascendente)
    allScores[state.difficulty].sort((a, b) => {
        if (a.moves !== b.moves) return a.moves - b.moves;
        return a.time - b.time;
    });

    // Mantener solo top 5
    allScores[state.difficulty] = allScores[state.difficulty].slice(0, 5);

    localStorage.setItem(storageKey, JSON.stringify(allScores));

    return newEntry; // Retornamos para mostrar en modal
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// (Función updateHighScores anterior ELIMINADA y reemplazada por showRankingModal y saveScore)

function render() {
    // Actualizar rotación suave
    if (state.keysPressed.ArrowLeft) state.rotation -= 2;
    if (state.keysPressed.ArrowRight) state.rotation += 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const rect = canvas.getBoundingClientRect();

    // PASADA 1: Dibujar todos los fondos de celdas primero
    state.board.forEach((cell, key) => {
        const [q, r] = key.split(',').map(Number);
        drawHexBackground(q, r, cell.chips);
    });

    // PASADA 2: Dibujar todas las fichas encima
    state.board.forEach((cell, key) => {
        const [q, r] = key.split(',').map(Number);
        drawHexChips(q, r, cell.chips);
    });

    // Dibujar y actualizar fichas animadas
    state.animatedChips = state.animatedChips.filter(chip => !chip.done);
    state.animatedChips.forEach(chip => {
        chip.update();
        chip.draw(ctx, state.rotation, rect.width, rect.height);
    });

    // PASADA 2.5: Dibujar efectos de eliminacion (detras de UI, sobre tablero)
    state.effects = state.effects.filter(fx => fx.draw(ctx, state.rotation, rect.width / 2, rect.height / 2));

    // PASADA 3: Dibujar indicadores de flujo (flechas) si hay preview activo
    if (state.hoveredCell && state.selectedPileIndex !== null && !state.isAnimating) {
        const hoveredKey = `${state.hoveredCell.q},${state.hoveredCell.r}`;
        const hoveredCell = state.board.get(hoveredKey);
        if (hoveredCell && hoveredCell.chips.length === 0) {
            drawFlowIndicators(
                state.hoveredCell.q,
                state.hoveredCell.r,
                state.playerPiles[state.selectedPileIndex]
            );
        }
    }

    // Dibujar y actualizar partículas
    state.particles = state.particles.filter(p => p.life > 0);
    state.particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    requestAnimationFrame(render);
}

// LÓGICA DE FLUJO MEJORADA
// LÓGICA DE FLUJO: IMPLEMENTACIÓN DEL DIAGRAMA
// LÓGICA DE FLUJO: IMPLEMENTACIÓN CON CASCADA (QUEUE)
async function processMove(startQ, startR) {
    if (state.isAnimating) return;
    state.isAnimating = true;

    // Asegurar enteros
    startQ = Math.round(startQ);
    startR = Math.round(startR);

    console.log(`[ProcessMove] Inicio Turno en ${startQ},${startR}`);

    // Cola de celdas pendientes de revisar
    // Usamos strings "q,r" para facilitar manejo
    let queue = [`${startQ},${startR}`];

    let safetyCounter = 0;
    const MAX_STEPS = 50; // Seguridad contra loops infinitos
    const ANIM_DURATION = 350; // Un poco más rápido para que la cascada no sea eterna

    try {
        state.stats.currentCombo = 0;

        while (queue.length > 0 && safetyCounter < MAX_STEPS) {
            safetyCounter++;

            // Extraer siguiente celda a procesar
            const currentKey = queue.shift();
            const [q, r] = currentKey.split(',').map(Number);

            // Verificar si la celda aun tiene fichas
            const cell = state.board.get(currentKey);
            if (!cell || cell.chips.length === 0) {
                continue; // Celda vacía, nada que hacer
            }

            const topColor = cell.chips[cell.chips.length - 1];
            console.log(`[Step ${safetyCounter}] Procesando ${currentKey} (${topColor})`);

            // 1. Escanear Vecinos (Scan)
            const neighbors = getNeighbors(q, r);
            const matchingNeighbors = [];

            for (const n of neighbors) {
                const nKey = `${n.q},${n.r}`;
                const nCell = state.board.get(nKey);
                if (nCell && nCell.chips.length > 0 && nCell.chips[nCell.chips.length - 1] === topColor) {
                    matchingNeighbors.push({ q: n.q, r: n.r, key: nKey, cell: nCell });
                }
            }

            const neighborCount = matchingNeighbors.length;

            // 2. Lógica de Decisión
            if (neighborCount > 1) {
                // CASO MULTI-VECINO -> GATHER (Reunir en Centro)
                console.log(`  -> Gather ${neighborCount} vecinos hacia ${currentKey}`);
                await gatherNeighborsToCenter(q, r, matchingNeighbors, topColor, ANIM_DURATION);

                // Las celdas vecinas se modificaron (perdieron fichas), podrían haber revelado nuevo color.
                // Las agregamos a la cola.
                matchingNeighbors.forEach(n => {
                    if (!queue.includes(n.key)) queue.push(n.key);
                });

                // El centro cambió (ganó fichas). Verificamos Overflow o Distribute.

                // Recalcular centro
                const { count } = countTopColorChips(cell, topColor);
                if (count >= 10) {
                    console.log(`  -> Overflow en ${currentKey}!`);
                    const elim = eliminateTopColor(cell, topColor);
                    processScore(elim, true);
                    state.effects.push(new EliminationEffect(q, r, topColor));
                    await new Promise(res => setTimeout(res, 300));

                    // Al eliminar, revelamos color de abajo.
                    if (!queue.includes(currentKey)) queue.push(currentKey);

                } else {
                    // Si NO explotó, ahora tenemos todo reunido.
                    // Ya no hay vecinos con ese color (los absorbimos).
                    // -> Stay (o podríamos intentar distribuir si aparecieran nuevos vecinos, pero no lo harán mágicamente)
                    console.log(`  -> Gather completado. Centro es isla ahora.`);
                }

            } else if (neighborCount === 1) {
                // CASO UNICO VECINO -> MOVE DIRECT (Distribute)
                const target = matchingNeighbors[0];
                console.log(`  -> MoveDirect hacia ${target.key}`);

                await distributeCenterToTarget(q, r, target, topColor, ANIM_DURATION);

                // Current perdió fichas (quizas destapó nuevo color). Re-encolar current.
                if (!queue.includes(currentKey)) queue.push(currentKey);

                // Target ganó fichas. Re-encolar target para que busque su camino (CASCADA).
                if (!queue.includes(target.key)) queue.push(target.key);

                // Verificar eliminación en target INMEDIATAMENTE visualmente
                await checkEliminationAt(target.q, target.r);

            } else {
                // CASO 0 VECINOS -> STAY
                console.log(`  -> Stay (0 matching neighbors)`);
                // No re-encolamos current.
            }

            // Pausa entre pasos de la cascada
            if (queue.length > 0) {
                await new Promise(r => setTimeout(r, 100));
            }
        }
    } catch (error) {
        console.error("Error CRÍTICO en processMove:", error);
        // Intentar recuperar estado visual
        canvas.style.opacity = 1;
    } finally {
        console.log(`[ProcessMove] Finalizado.`);

        state.isAnimating = false;
        checkGameOver();
    }
}

// Retorna el target dominante de una lista de candidatos
function selectDominantTarget(candidates) {
    if (candidates.length === 0) return null;
    let best = candidates[0];
    let maxSame = -1;
    let maxTotal = -1;

    for (const cand of candidates) {
        if (!cand.cell || cand.cell.chips.length === 0) continue;

        const topColor = cand.cell.chips[cand.cell.chips.length - 1];
        const sameCount = countTopColorChips(cand.cell, topColor).count;
        const total = cand.cell.chips.length;

        if (sameCount > maxSame) {
            maxSame = sameCount;
            maxTotal = total;
            best = cand;
        } else if (sameCount === maxSame) {
            if (total > maxTotal) {
                maxTotal = total;
                best = cand;
            }
        }
    }
    return best;
}

// Fase Gather: Mover ships de Neighbors -> Center
async function gatherNeighborsToCenter(centerQ, centerR, neighbors, color, duration) {
    const centerKey = `${centerQ},${centerR}`;
    const centerCell = state.board.get(centerKey);
    const totalMovedChips = [];

    // Extraer fichas LOGICAMENTE antes de animar
    for (const n of neighbors) {
        const chipsToMove = [];
        while (n.cell.chips.length > 0 && n.cell.chips[n.cell.chips.length - 1] === color) {
            chipsToMove.push(n.cell.chips.pop());
        }
        if (chipsToMove.length > 0) {
            // Animaciones
            for (let i = 0; i < chipsToMove.length; i++) {
                const anim = new AnimatedChip(n.q, n.r, centerQ, centerR, chipsToMove[i], duration);
                // Todos inician casi simultaneo
                anim.startTime = performance.now() + (i * 20);
                state.animatedChips.push(anim);
            }
            totalMovedChips.push(chipsToMove);
        }
    }

    if (totalMovedChips.length === 0) return;

    // Esperar a que lleguen visualmente (+ margen)
    await new Promise(r => setTimeout(r, duration + 200));

    // Lógica: Añadir al centro
    for (const batch of totalMovedChips) {
        for (let i = batch.length - 1; i >= 0; i--) {
            centerCell.chips.push(batch[i]);
        }
    }
}

// Fase Distribute: Mover chips de Center -> Target
async function distributeCenterToTarget(centerQ, centerR, target, color, duration) {
    const centerKey = `${centerQ},${centerR}`;
    const centerCell = state.board.get(centerKey);

    // Extraer todo el bloque del color
    const chipsToMove = [];
    while (centerCell.chips.length > 0 && centerCell.chips[centerCell.chips.length - 1] === color) {
        chipsToMove.push(centerCell.chips.pop());
    }

    if (chipsToMove.length === 0) return;

    // Animar
    for (let i = 0; i < chipsToMove.length; i++) {
        const anim = new AnimatedChip(centerQ, centerR, target.q, target.r, chipsToMove[i], duration);
        anim.startTime = performance.now() + (i * 30);
        state.animatedChips.push(anim);
    }

    await new Promise(r => setTimeout(r, duration + (chipsToMove.length * 30)));

    // Lógica: poner en target
    const targetCell = state.board.get(target.key || `${target.q},${target.r}`);
    if (targetCell) {
        for (let i = chipsToMove.length - 1; i >= 0; i--) {
            targetCell.chips.push(chipsToMove[i]);
        }
    }
}

// Utilidad: Contar fichas top del mismo color
function countTopColorChips(cell, color) {
    let count = 0;
    if (!cell || !cell.chips) return { count: 0 };
    for (let i = cell.chips.length - 1; i >= 0; i--) {
        if (cell.chips[i] === color) count++;
        else break;
    }
    return { count };
}

// Utilidad: Eliminar top color, retorna cuantos
function eliminateTopColor(cell, color) {
    let removed = 0;
    while (cell.chips.length > 0 && cell.chips[cell.chips.length - 1] === color) {
        cell.chips.pop();
        removed++;
    }
    return removed;
}

// Procesar Puntuación
function processScore(count, isCenterSuperavit) {
    state.stats.totalEliminated += count;
    state.stats.currentCombo++;
    if (state.stats.currentCombo > state.stats.bestCombo) {
        state.stats.bestCombo = state.stats.currentCombo;
    }

    let points = count;
    // Bonus por superavit en centro
    if (isCenterSuperavit) points += 5;
    if (state.stats.currentCombo > 1) points += (state.stats.currentCombo * 2);

    state.score += points;

    // showMessage(`¡+${points} PUNTOS!`); // Mensaje eliminado por solicitud
    updateStat('score', state.score);

    if (state.score >= state.goal) {
        gameWin();
    }
}

// Wrapper para checkear y ejecutar eliminación en una coordenada dada (Target)
async function checkEliminationAt(q, r) {
    const key = `${q},${r}`;
    const cell = state.board.get(key);
    if (!cell || cell.chips.length === 0) return;

    const topColor = cell.chips[cell.chips.length - 1];
    const { count } = countTopColorChips(cell, topColor);

    if (count >= 10) {
        // Eliminar
        const elim = eliminateTopColor(cell, topColor);
        processScore(elim, false);
        state.effects.push(new EliminationEffect(q, r, topColor));
        await new Promise(r => setTimeout(r, 300)); // Pausa dramática
    }
}

// Función nextRound ELIMINADA

function checkGameOver() {
    let emptyCells = 0;
    state.board.forEach(cell => {
        if (cell.chips.length === 0) emptyCells++;
    });

    if (emptyCells === 0) {
        showGameOver();
    }
}

function gameWin() {
    if (state.isGameOver) return;
    state.isGameOver = true;

    // Guardar Score
    const entry = saveScore(true);

    // UI
    spawnConfetti();

    // Retrasar modal para ver la celebración
    setTimeout(() => {
        document.getElementById('modal-title').innerText = "🏆 ¡NIVEL COMPLETADO!";
        document.getElementById('final-moves').innerText = state.moves;
        const timeTotal = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
        document.getElementById('final-time').innerText = formatTime(timeTotal);

        document.getElementById('best-combo').innerText = state.stats.bestCombo;
        document.getElementById('total-eliminated').innerText = state.stats.totalEliminated;

        gameoverModal.classList.add('active');
    }, 5000); // 5 segundos de fiesta antes del modal
}

function showGameOver() {
    state.isGameOver = true;
    // No guardamos score en game over (no completó el nivel)

    document.getElementById('modal-title').innerText = "💀 GAME OVER";
    document.getElementById('final-moves').innerText = state.moves;
    const timeTotal = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
    document.getElementById('final-time').innerText = formatTime(timeTotal);

    // ... stats ...
    document.getElementById('best-combo').innerText = state.stats.bestCombo;
    document.getElementById('total-eliminated').innerText = state.stats.totalEliminated;

    // ...
    gameoverModal.classList.add('active');
}

function restartGame() {
    gameoverModal.classList.remove('active');
    state.isGameOver = false;
    resetGame();
}

// Auxiliar para animar stats
function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) {
        // En caso de que el texto no sea numero puro (ej: inicializacion), manejamos
        const current = parseInt(el.innerText) || 0;
        if (current !== value) {
            el.innerText = value;
            el.classList.remove('changed');
            void el.offsetWidth; // Trigger reflow
            el.classList.add('changed');
        } else {
            // Si es igual, aseguramos texto correcto por si acaso
            el.innerText = value;
        }
    }
}

function resetGame() {
    state.score = 0;
    state.round = 1;

    // Configurar Meta: Si el usuario movió el slider, usamos ese valor? 
    // Por simplicidad, leemos el valor actual del slider
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

    updateStat('score', 0);
    updateStat('goal', state.goal);
    // roundEl eliminado

    mulliganBtn.innerHTML = `<span class="btn-icon">↺</span> Otra Tanda (3)`;
    updateStat('moves-count', 0);

    // IMPORTANTE: Resetear flags de estado
    state.isGameOver = false;
    state.isAnimating = false;
    // Ocultar modal si estaba abierto
    gameoverModal.classList.remove('active');

    state.rotation = 0;
    initBoard();
    refillPlayerPiles();
    renderActiveColors(); // Resetear barra lateral
    // Ranking no se actualiza al inicio
}

// CONFIGURACIÓN
function toggleConfig() {
    state.isConfigOpen = !state.isConfigOpen;
    document.getElementById('config-modal').classList.toggle('active', state.isConfigOpen);
    updateDifficultyButtons();
}

function updateDifficultyButtons() {
    document.querySelectorAll('.segment-btn').forEach(btn => {
        const diff = parseInt(btn.dataset.difficulty);
        btn.classList.toggle('active', diff === state.difficulty);
    });

    // Actualizar texto descriptivo
    const texts = {
        2: "Radio 2 • 19 celdas",
        3: "Radio 3 • 37 celdas",
        4: "Radio 4 • 61 celdas"
    };
    const descEl = document.getElementById('difficulty-description');
    if (descEl) descEl.innerText = texts[state.difficulty] || "";
}

function setDifficulty(level) {
    state.difficulty = level;
    hexRadius = level;
    updateDifficultyButtons();

    // Ajustar Meta sugerida al cambiar dificultad (opcional)
    const suggestedGoal = 100 + (level * 50);
    const goalSlider = document.getElementById('goal-range');
    if (goalSlider) {
        goalSlider.value = suggestedGoal;
        updateGoalLabel(suggestedGoal);
    }
}

function setGoal(value) {
    // Solo actualiza UI temporal, se aplica real en resetGame
    // O podríamos actualizar state.goal en tiempo real si el juego no ha empezado?
    // Mejor dejar que resetGame lo lea.
}

function updateGoalLabel(value) {
    document.getElementById('goal-label').innerText = value;
}

function setMaxHeight(value) {
    state.maxStackHeight = parseInt(value);
}

function updateHeightLabel(value) {
    document.getElementById('height-label').innerText = value;
}

// Unificamos lógica de inicio
// Unificamos lógica de inicio
function startGame() {
    toggleConfig();
    resetGame();
}

function newGame() {
    // Reinicio rápido sin cerrar/abrir config
    resetGame();
}

// EVENTOS
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

canvas.addEventListener('mousedown', async (e) => {
    if (state.selectedPileIndex === null || state.isAnimating || state.isHelpOpen || state.isGameOver) return;

    let q, r;

    // 1. Prioridad: Usar la celda que está en hover (donde se ve el preview)
    if (state.hoveredCell) {
        q = state.hoveredCell.q;
        r = state.hoveredCell.r;
    }
    // 2. Fallback: Calcular coordenadas si por alguna razón no hay hover (ej: touch)
    else {
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
            state.hoveredCell = null; // Limpiar hover
            state.moves++; // Incrementar contador de movimientos
            updateStat('moves-count', state.moves);

            // Cada 10 movimientos, añadir un color (máximo 6)
            if (state.moves % 10 === 0 && state.numColors < COLORS.length) {
                state.numColors++;
                const newCol = COLORS[state.numColors - 1];
                // Solo añadimos a la barra lateral (animado), sin notificación invasiva
                addActiveColor(newCol);
            }

            refillPlayerPiles();
            await processMove(q, r);
        }
    }
});

// Evento de mousemove para preview
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

// Limpiar hover al salir del canvas
canvas.addEventListener('mouseleave', () => {
    state.hoveredCell = null;
});

// START
resize();
initBoard();
// setDifficulty(2); // Inicia en fácil por defecto, ya lo hace initBoard con state.difficulty
resetGame(); // Inicia valores por defecto
// saveScore no se llama al inicio
requestAnimationFrame(render); // ¡IMPORTANTE! Iniciar bucle de renderizado

// UI HELPERS FOR ACTIVE COLORS SIDEBAR
function renderActiveColors() {
    const list = document.getElementById('active-colors-list');
    if (!list) return;
    list.innerHTML = '';
    const active = COLORS.slice(0, state.numColors);
    active.forEach(color => addActiveColor(color));
}

function addActiveColor(color) {
    const list = document.getElementById('active-colors-list');
    if (!list) return;
    const chip = document.createElement('div');
    chip.className = 'active-color-chip';
    chip.style.backgroundColor = color;
    list.appendChild(chip);
}

function showNewColorNotification(color) {
    // Crear elemento de notificación
    const notif = document.createElement('div');
    notif.className = 'new-color-notification';

    const icon = document.createElement('div');
    icon.className = 'chip-icon';
    icon.style.backgroundColor = color;

    const text = document.createElement('span');
    text.innerText = "¡NUEVO COLOR DESBLOQUEADO!";

    notif.appendChild(icon);
    notif.appendChild(text);

    document.body.appendChild(notif);

    // Remover después de la animación (4.5s total en CSS)
    setTimeout(() => {
        if (notif.parentNode) notif.parentNode.removeChild(notif);
    }, 5000);
}
