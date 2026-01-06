/**
 * HEXAFLOW: STRATEGIC HONEYCOMB
 * Lógica del juego modularizada.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const goalEl = document.getElementById('goal');
const roundEl = document.getElementById('round');
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
    goal: 100,
    round: 1,
    mulligans: 3,
    numColors: 3,
    difficulty: 2, // Radio del tablero (2-4), inicia en Fácil
    maxStackHeight: 15, // Límite de altura por celda (configurable)
    moves: 0, // Contador de movimientos
    startTime: null, // Tiempo de inicio para calcular duración
    board: new Map(), // key: "q,r", value: { chips: [] }
    playerPiles: [null, null, null],
    selectedPileIndex: null,
    rotation: 0, // En grados (60, 120, etc)
    isAnimating: false,
    isHelpOpen: false,
    isGameOver: false,
    isConfigOpen: false,
    particles: [],
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
        this.size = Math.random() * 5 + 5;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10 - 5;
        this.life = 1.0;
        this.gravity = 0.2;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= 0.02;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

function spawnConfetti() {
    for (let i = 0; i < 100; i++) {
        state.particles.push(new Particle(canvas.width / 2, canvas.height / 2, COLORS[Math.floor(Math.random() * COLORS.length)]));
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

        // Fase de flip (rotación en Y como hoja de libro)
        this.flipPhase = this.progress;

        if (this.progress >= 1) {
            this.done = true;
        }
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
        mulliganBtn.innerText = `Mulligan (${state.mulligans})`;
        if (state.mulligans === 0) mulliganBtn.disabled = true;
        updatePileUI();
    }
}

function toggleHelp() {
    state.isHelpOpen = !state.isHelpOpen;
    helpModal.classList.toggle('active', state.isHelpOpen);
    if (state.isHelpOpen) {
        updateHighScores(); // Mostrar records en ayuda si se desea
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

function updateHighScores(newScore) {
    const storageKey = 'hexaflow_scores_v3'; // Versión con tiempo
    let scores = JSON.parse(localStorage.getItem(storageKey) || '[]');

    if (newScore !== undefined) {
        // Calcular tiempo de juego
        const endTime = Date.now();
        const timeSeconds = state.startTime ? Math.floor((endTime - state.startTime) / 1000) : 0;

        scores.push({
            date: new Date().toLocaleDateString(),
            score: newScore,
            difficulty: state.difficulty,
            moves: state.moves,
            time: timeSeconds,
            difficultyName: DIFFICULTY_NAMES[state.difficulty]
        });
        // Ordenar por dificultad, luego por puntuación (mayor es mejor)
        scores.sort((a, b) => {
            if (b.difficulty !== a.difficulty) return b.difficulty - a.difficulty;
            return b.score - a.score;
        });
        // Guardar top 5 por cada nivel
        const grouped = {};
        scores.forEach(s => {
            if (!grouped[s.difficulty]) grouped[s.difficulty] = [];
            if (grouped[s.difficulty].length < 5) {
                grouped[s.difficulty].push(s);
            }
        });
        scores = Object.values(grouped).flat();
        localStorage.setItem(storageKey, JSON.stringify(scores));
    }

    const list = document.getElementById('scores-list');
    const filteredScores = scores.filter(s => s.difficulty === state.difficulty).slice(0, 5);

    // Formatear tiempo como mm:ss
    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    list.innerHTML = filteredScores.map((s, i) => `
        <div class="score-row">
            <span>#${i + 1}</span>
            <span>${s.score} pts</span>
            <span style="color: #fbbf24;">${formatTime(s.time || 0)}</span>
            <span style="color: #64748b; font-size: 0.6rem">${s.date}</span>
        </div>
    `).join('') || '<div style="text-align:center">Sin records para este nivel</div>';
}

function render() {
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
async function processMove(q, r) {
    if (state.isAnimating) return;
    state.isAnimating = true;

    try {
        state.stats.currentCombo = 0;

        const ANIM_DURATION = 300; // Animación más lenta para apreciarla
        let totalMoved = 0;

        // FASE 1: Volcar fichas a las vecinas del mismo color (sin límite)
        const placedCell = state.board.get(`${q},${r}`);
        if (placedCell && placedCell.chips.length > 0) {
            await spreadToNeighbors(q, r, ANIM_DURATION);
        }

        // FASE 2: Cascada continua - procesar todos los flujos hasta estabilizar
        let needsProcessing = true;
        let loopCount = 0;
        const MAX_LOOPS = 50; // Evitar bucles infinitos

        while (needsProcessing && loopCount < MAX_LOOPS) {
            needsProcessing = false;
            loopCount++;

            for (const [key, cell] of state.board) {
                if (cell.chips.length === 0) continue;

                const [curQ, curR] = key.split(',').map(Number);
                const topColor = cell.chips[cell.chips.length - 1];

                // Buscar el mejor destino para TODAS las fichas del mismo color
                const target = findBestTarget(curQ, curR, topColor);

                if (target) {
                    // Contar cuántas fichas del mismo color hay en el tope
                    const chipsToMove = [];
                    while (cell.chips.length > 0 && cell.chips[cell.chips.length - 1] === topColor) {
                        chipsToMove.push(cell.chips.pop());
                    }

                    // Animar todas las fichas moviéndose juntas
                    for (let i = 0; i < chipsToMove.length; i++) {
                        const animChip = new AnimatedChip(curQ, curR, target.q, target.r, chipsToMove[i], ANIM_DURATION);
                        // Pequeño delay entre cada ficha para efecto visual
                        animChip.startTime = performance.now() + (i * 30);
                        state.animatedChips.push(animChip);
                    }

                    // Esperar la animación del grupo
                    await new Promise(res => setTimeout(res, ANIM_DURATION + (chipsToMove.length * 30)));

                    // Agregar fichas al destino (en orden inverso para mantener el orden)
                    const targetCell = state.board.get(`${target.q},${target.r}`);
                    if (targetCell) {
                        for (let i = chipsToMove.length - 1; i >= 0; i--) {
                            targetCell.chips.push(chipsToMove[i]);
                        }
                    }

                    totalMoved += chipsToMove.length;
                    needsProcessing = true;

                    checkEliminations(target.q, target.r, totalMoved);
                    checkEliminations(curQ, curR, totalMoved);
                    break;
                }
            }
        }
    } catch (error) {
        console.error("Error crítico en processMove:", error);
    } finally {
        state.isAnimating = false;
        checkGameOver();
    }
}

// FASE 1: Al colocar pila, agrupar TODAS las fichas del mismo color de centro+vecinas en la más alta
async function spreadToNeighbors(centerQ, centerR, duration) {
    const centerCell = state.board.get(`${centerQ},${centerR}`);
    if (!centerCell || centerCell.chips.length === 0) return;

    const neighbors = getNeighbors(centerQ, centerR);
    let totalMoved = 0;

    // Procesar cada color del tope de la pila colocada
    let continueProcessing = true;
    let safetyLoop = 0;

    // Safety loop para evitar congelamientos
    while (continueProcessing && centerCell.chips.length > 0 && safetyLoop < 100) {
        safetyLoop++;
        continueProcessing = false;
        const currentColor = centerCell.chips[centerCell.chips.length - 1];

        // 1. Identificar TODAS las celdas participantes (Centro + Vecinas con match)
        const participatingCells = [];

        // Revisar Centro
        if (centerCell.chips.length > 0 && centerCell.chips[centerCell.chips.length - 1] === currentColor) {
            let count = 0;
            // Contar cuántas fichas consecutivas de este color hay
            for (let i = centerCell.chips.length - 1; i >= 0 && centerCell.chips[i] === currentColor; i--) count++;
            participatingCells.push({ q: centerQ, r: centerR, cell: centerCell, sameColorCount: count, isCenter: true });
        }

        // Revisar Vecinas
        for (const n of neighbors) {
            const nKey = `${n.q},${n.r}`;
            if (!state.board.has(nKey)) continue;
            const nCell = state.board.get(nKey);
            if (nCell.chips.length === 0) continue;

            if (nCell.chips[nCell.chips.length - 1] === currentColor) {
                let count = 0;
                for (let i = nCell.chips.length - 1; i >= 0 && nCell.chips[i] === currentColor; i--) count++;
                participatingCells.push({ q: n.q, r: n.r, cell: nCell, sameColorCount: count, isCenter: false });
            }
        }

        // Contar vecinos reales (no centro)
        const neighborsWithColor = participatingCells.filter(pc => !pc.isCenter);

        // Si hay vecinos involucrados (o centro + vecinos)
        if (participatingCells.length > 1) {

            // FASE A: LÓGICA DE 2 PASOS (SOLO SI HAY MÁS DE 1 VECINO)
            if (neighborsWithColor.length > 1) {
                // PASO 1: Determinar quién será el DESTINO FINAL (Target)
                participatingCells.sort((a, b) => {
                    if (b.sameColorCount !== a.sameColorCount) return b.sameColorCount - a.sameColorCount;
                    return b.cell.chips.length - a.cell.chips.length;
                });
                const target = participatingCells[0];

                // PASO 2: ANIMACIÓN 1 - REUNIR EN EL CENTRO (Gather)
                const gatheredChips = [];
                const neighborsToEmpty = neighborsWithColor;

                if (neighborsToEmpty.length > 0) {
                    const animPromises = [];
                    let animIndex = 0;

                    for (const source of neighborsToEmpty) {
                        const chipsToMove = [];
                        while (source.cell.chips.length > 0 &&
                            source.cell.chips[source.cell.chips.length - 1] === currentColor) {
                            chipsToMove.push(source.cell.chips.pop());
                        }
                        gatheredChips.push(...chipsToMove);

                        for (let j = 0; j < chipsToMove.length; j++) {
                            const animChip = new AnimatedChip(
                                source.q, source.r,
                                centerQ, centerR,
                                chipsToMove[j],
                                duration
                            );
                            animChip.startTime = performance.now() + (animIndex * 30);
                            state.animatedChips.push(animChip);
                            animIndex++;
                        }
                    }
                    await new Promise(res => setTimeout(res, duration + (animIndex * 30) + 50));
                }

                // Agregar las fichas recolectadas al centro LÓGICAMENTE
                // (Visualmente ya llegaron)
                for (const chip of gatheredChips) {
                    centerCell.chips.push(chip);
                }
                totalMoved += gatheredChips.length;

                // PASO 2.5: VERIFICAR SI HAY SUPERÁVIT EN EL CENTRO (>= 10)
                let countInCenter = 0;
                for (let i = centerCell.chips.length - 1; i >= 0 && centerCell.chips[i] === currentColor; i--) {
                    countInCenter++;
                }

                if (countInCenter >= 10) {
                    // CONDICIÓN ESPECIAL: SI SE JUNTAN >= 10, SE ELIMINAN AQUÍ.
                    // NO VIAJAN AL TARGET.
                    checkEliminations(centerQ, centerR, totalMoved);
                    // Si se eliminaron, habrán desaparecido del array.
                    // Si no (por alguna razón rara), seguirían ahí.

                    // Aseguramos que si se eliminaron, continueProcessing dependa de si quedan fichas (de otro color)
                    continueProcessing = centerCell.chips.length > 0;
                }
                else {
                    // SI NO SE ELIMINAN (Son < 10), ENTONCES VIAJAN AL TARGET

                    if (target.isCenter) {
                        // El centro YA era el target, y no llegaron a 10. Se quedan aquí.
                        checkEliminations(centerQ, centerR, totalMoved);
                        continueProcessing = centerCell.chips.length > 0;
                    }
                    else {
                        // PASO 3: ANIMACIÓN 2 - DISTRIBUIR (MOVER TODO DEL CENTRO AL TARGET)
                        const centerChipsToMove = [];
                        while (centerCell.chips.length > 0 &&
                            centerCell.chips[centerCell.chips.length - 1] === currentColor) {
                            centerChipsToMove.push(centerCell.chips.pop());
                        }

                        // Reordenar para vuelo
                        const chipsFromCenterOriginalOrder = centerChipsToMove.reverse();
                        const finalBlock = [...chipsFromCenterOriginalOrder];
                        // Nota: gatheredChips ya fueron pusheadas al centerCell y popeadas recién.
                        // Así que 'finalBlock' contiene TODO lo que hay que mover.

                        let animIndex = 0;
                        for (const chip of finalBlock) {
                            const animChip = new AnimatedChip(
                                centerQ, centerR,
                                target.q, target.r,
                                chip,
                                duration
                            );
                            animChip.startTime = performance.now() + (animIndex * 30);
                            state.animatedChips.push(animChip);
                            animIndex++;
                        }

                        await new Promise(res => setTimeout(res, duration + (animIndex * 30) + 50));

                        for (const chip of finalBlock) {
                            target.cell.chips.push(chip);
                        }

                        totalMoved += finalBlock.length;
                        checkEliminations(target.q, target.r, totalMoved);
                        continueProcessing = centerCell.chips.length > 0;
                    }
                }
            }
            // FASE B: LÓGICA DE 1 PASO (Directa) - SOLO 1 VECINO
            else {
                participatingCells.sort((a, b) => {
                    if (b.sameColorCount !== a.sameColorCount) return b.sameColorCount - a.sameColorCount;
                    return b.cell.chips.length - a.cell.chips.length;
                });
                const target = participatingCells[0];
                const sources = participatingCells.filter(pc => pc !== target);

                // Mover fichas de source a target directamente
                for (const source of sources) {
                    const chipsToMove = [];
                    while (source.cell.chips.length > 0 &&
                        source.cell.chips[source.cell.chips.length - 1] === currentColor) {
                        chipsToMove.push(source.cell.chips.pop());
                    }

                    if (chipsToMove.length > 0) {
                        for (let j = 0; j < chipsToMove.length; j++) {
                            const animChip = new AnimatedChip(
                                source.q, source.r,
                                target.q, target.r,
                                chipsToMove[j],
                                duration
                            );
                            animChip.startTime = performance.now() + (j * 35);
                            state.animatedChips.push(animChip);
                        }
                        await new Promise(res => setTimeout(res, duration + (chipsToMove.length * 35)));

                        for (let j = chipsToMove.length - 1; j >= 0; j--) {
                            target.cell.chips.push(chipsToMove[j]);
                        }
                        totalMoved += chipsToMove.length;
                    }
                }

                checkEliminations(target.q, target.r, totalMoved);
                continueProcessing = centerCell.chips.length > 0;
            }
        }
        else if (participatingCells.length === 1 && participatingCells[0].isCenter) {
            // Solo el centro tiene este color.
        }
    }
}

// Encuentra el mejor destino para fichas de un color
function findBestTarget(q, r, topColor) {
    const neighbors = getNeighbors(q, r);
    let bestTarget = null;
    let maxSameColor = -1;
    let maxTotalChips = -1;

    for (const n of neighbors) {
        const nKey = `${n.q},${n.r}`;
        if (state.board.has(nKey)) {
            const nCell = state.board.get(nKey);
            if (nCell.chips.length > 0 && nCell.chips[nCell.chips.length - 1] === topColor) {
                const sameColorCount = nCell.chips.filter(c => c === topColor).length;

                if (sameColorCount > maxSameColor) {
                    maxSameColor = sameColorCount;
                    maxTotalChips = nCell.chips.length;
                    bestTarget = { q: n.q, r: n.r };
                } else if (sameColorCount === maxSameColor && nCell.chips.length > maxTotalChips) {
                    maxTotalChips = nCell.chips.length;
                    bestTarget = { q: n.q, r: n.r };
                }
            }
        }
    }
    return bestTarget;
}

function checkEliminations(q, r, totalMoved) {
    const key = `${q},${r}`;
    const cell = state.board.get(key);
    if (!cell || cell.chips.length === 0) return;

    const topColor = cell.chips[cell.chips.length - 1];
    let count = 0;
    // Contar cuántas del mismo color hay consecutivas en el tope
    for (let i = cell.chips.length - 1; i >= 0; i--) {
        if (cell.chips[i] === topColor) count++;
        else break;
    }

    if (count >= 10) {
        // Eliminar SOLO las fichas de ese color superior (máximo 10 o todas las consecutivas)
        let removed = 0;
        while (cell.chips.length > 0 && cell.chips[cell.chips.length - 1] === topColor) {
            cell.chips.pop();
            removed++;
        }

        // Actualizar estadísticas
        state.stats.totalEliminated += removed;
        state.stats.currentCombo++;
        if (state.stats.currentCombo > state.stats.bestCombo) {
            state.stats.bestCombo = state.stats.currentCombo;
        }

        let points = removed;
        if (totalMoved > 20) {
            points += 10;
            showMessage("¡COMBO x" + state.stats.currentCombo + "!");
        }
        state.score += points;
        scoreEl.innerText = state.score;

        if (state.score >= state.goal) {
            nextRound();
        }
    }
}

function nextRound() {
    state.round++;
    state.goal += 300; // Aumentar dificultad
    state.numColors = Math.min(COLORS.length, 3 + Math.floor(state.round / 2));
    roundEl.innerText = state.round;
    goalEl.innerText = state.goal;

    spawnConfetti();
    showMessage("¡META ALCANZADA! Nivel " + state.round);
}

function checkGameOver() {
    let emptyCells = 0;
    state.board.forEach(cell => {
        if (cell.chips.length === 0) emptyCells++;
    });

    if (emptyCells === 0) {
        showGameOver();
    }
}

function showGameOver() {
    state.isGameOver = true;

    // Verificar si es nuevo récord
    let scores = JSON.parse(localStorage.getItem('hexaflow_scores') || '[]');
    const isNewRecord = scores.length === 0 || state.score > (scores[0]?.score || 0);

    // Guardar puntuación
    updateHighScores(state.score);

    // Actualizar UI del modal
    document.getElementById('final-score').innerText = state.score;
    document.getElementById('final-round').innerText = state.round;
    document.getElementById('best-combo').innerText = state.stats.bestCombo;
    document.getElementById('total-eliminated').innerText = state.stats.totalEliminated;

    // Mostrar indicador de nuevo récord
    const recordEl = document.getElementById('new-record');
    recordEl.style.display = isNewRecord ? 'block' : 'none';

    // Mostrar modal con animación
    gameoverModal.classList.add('active');
    spawnConfetti(); // Confeti dramático
}

function restartGame() {
    gameoverModal.classList.remove('active');
    state.isGameOver = false;
    resetGame();
}

function resetGame() {
    state.score = 0;
    state.round = 1;
    state.goal = 100;
    state.numColors = 3;
    state.mulligans = 3;
    state.moves = 0;
    state.startTime = Date.now(); // Iniciar cronómetro
    state.stats = { bestCombo: 0, currentCombo: 0, totalEliminated: 0 };
    scoreEl.innerText = "0";
    roundEl.innerText = "1";
    goalEl.innerText = "100";
    mulliganBtn.innerText = "Mulligan (3)";
    mulliganBtn.disabled = false;
    document.getElementById('moves-count').innerText = "0";
    initBoard();
    refillPlayerPiles();
    updateHighScores(); // Mostrar ranking del nivel actual
}

// CONFIGURACIÓN
function toggleConfig() {
    state.isConfigOpen = !state.isConfigOpen;
    configModal.classList.toggle('active', state.isConfigOpen);
    updateDifficultyButtons();
}

function updateDifficultyButtons() {
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        const diff = parseInt(btn.dataset.difficulty);
        btn.classList.toggle('selected', diff === state.difficulty);
    });
}

function setDifficulty(level) {
    state.difficulty = level;
    hexRadius = level;
    updateDifficultyButtons();
}

function setMaxHeight(value) {
    state.maxStackHeight = parseInt(value);
}

function updateHeightLabel(value) {
    document.getElementById('height-label').innerText = value;
}

// Nuevo juego en el MISMO nivel de dificultad
function newGame() {
    toggleConfig();
    resetGame();
}

// Iniciar juego con NUEVO nivel de dificultad
function startGame() {
    toggleConfig();
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
    if (e.key === 'ArrowLeft') state.rotation -= 60;
    if (e.key === 'ArrowRight') state.rotation += 60;
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
            document.getElementById('moves-count').innerText = state.moves;

            // Cada 10 movimientos, añadir un color (máximo 6)
            if (state.moves % 10 === 0 && state.numColors < COLORS.length) {
                state.numColors++;
                showMessage(`¡+1 COLOR! Ahora ${state.numColors} colores`);
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
refillPlayerPiles();
updateHighScores();
render();
