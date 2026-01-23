import { HEX_SIZE, COLORS } from './constants.js?v=3.1';

import { state } from './state.js?v=3.1';
import { axialToPixel, adjustColor } from './utils.js?v=3.1';

export class Particle {
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

export class EliminationEffect {
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

export class AnimatedChip {
    constructor(fromQ, fromR, toQ, toR, color, duration = 500, arcHeight = 60, startStackHeight = 0, endStackHeight = 0) {
        if (color === 'ROCK') color = '#475569';

        const from = axialToPixel(fromQ, fromR);
        const to = axialToPixel(toQ, toR);

        // Offset vertical basado en la altura de la pila (-4px por ficha)
        this.startYOffset = startStackHeight * -4;
        this.endYOffset = endStackHeight * -4;

        this.startX = from.x;
        this.startY = from.y + this.startYOffset;
        this.endX = to.x;
        this.endY = to.y + this.endYOffset;

        this.color = color;
        this.duration = duration;
        this.arcHeight = arcHeight;
        this.startTime = performance.now();
        this.progress = 0;
        this.done = false;

        this.x = this.startX;
        this.y = this.startY;
        this.thickness = 8;
    }

    update() {
        const elapsed = performance.now() - this.startTime;
        this.progress = Math.min(elapsed / this.duration, 1);

        if (this.progress < 1) {
            const t = this.progress;
            this.x = this.startX + (this.endX - this.startX) * t;
            const baseY = this.startY + (this.endY - this.startY) * t;
            const arc = Math.sin(t * Math.PI) * this.arcHeight;
            this.y = baseY - arc;
        } else {
            const settleTime = 250;
            const sProgress = Math.min((elapsed - this.duration) / settleTime, 1);
            if (sProgress >= 1) {
                this.done = true;
                this.x = this.endX;
                this.y = this.endY;
            } else {
                const bounce = Math.sin(sProgress * Math.PI * 4) * 4 * Math.exp(-sProgress * 6);
                this.y = this.endY - bounce;
            }
        }
    }

    draw(ctx, rotation, canvasWidth, canvasHeight) {
        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);

        // APLICAR ESCALA GLOBAL DEL ESTADO (Crucial para alineación)
        ctx.scale(state.scale, state.scale);
        ctx.rotate(rotation * Math.PI / 180);

        // SOMBRA DINÁMICA
        const currentArc = this.progress < 1 ? Math.sin(this.progress * Math.PI) * this.arcHeight : 0;
        const shadowAlpha = this.progress < 1 ? Math.max(0, 0.2 - currentArc * 0.001) : 0;

        const radius = HEX_SIZE * 0.85; // Fiel a CHIP_RADIUS

        if (shadowAlpha > 0) {
            ctx.save();
            ctx.translate(this.x, this.y + currentArc + 4);
            ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 0.75, radius * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 3D CHIP SIMULATION
        const t = this.progress;
        const flipAngle = t * Math.PI;
        const cos = Math.cos(flipAngle);
        const sin = Math.abs(Math.sin(flipAngle));

        ctx.translate(this.x, this.y);

        // Puntos del hexágono (Orientación plana para coincidir con tablero)
        const pts = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            pts.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
        }

        const buildRoundedPath = (c) => {
            c.beginPath();
            for (let i = 0; i < 6; i++) {
                const curr = pts[i];
                const next = pts[(i + 1) % 6];
                const midX = (curr.x + next.x) / 2;
                const midY = (curr.y + next.y) / 2;
                const weight = 0.75;
                const startX = curr.x * weight + midX * (1 - weight);
                const startY = curr.y * weight + midY * (1 - weight);
                const endX = next.x * weight + midX * (1 - weight);
                const endY = next.y * weight + midY * (1 - weight);
                if (i === 0) c.moveTo(startX, startY);
                c.lineTo(startX, startY);
                c.quadraticCurveTo(midX, midY, endX, endY);
            }
            c.closePath();
        };

        // Canto (Grosor 3D)
        if (sin > 0.05) {
            ctx.fillStyle = adjustColor(this.color, -50);
            for (let i = 0; i < 6; i++) {
                const p1 = pts[i];
                const p2 = pts[(i + 1) % 6];
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y * cos);
                ctx.lineTo(p2.x, p2.y * cos);
                ctx.lineTo(p2.x, p2.y * cos + this.thickness * sin);
                ctx.lineTo(p1.x, p1.y * cos + this.thickness * sin);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Cara visible
        ctx.save();
        ctx.scale(1, cos);
        buildRoundedPath(ctx);

        const grad = ctx.createRadialGradient(0, -radius / 3, 0, 0, 0, radius);
        const bright = cos < 0 ? -25 : 30; // Diferenciar caras
        grad.addColorStop(0, adjustColor(this.color, bright));
        grad.addColorStop(0.5, this.color);
        grad.addColorStop(1, adjustColor(this.color, -50));

        ctx.fillStyle = grad;
        ctx.fill();

        // Bordes (Sistema de Doble Borde de ESTILO.md)
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = adjustColor(this.color, -30);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();

        ctx.restore();
    }
}

export function drawHexBackground(ctx, q, r, chips) {
    const { x, y } = axialToPixel(q, r);
    ctx.save();
    ctx.translate(x, y);

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = HEX_SIZE * Math.cos(angle);
        const py = HEX_SIZE * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Estilo sutil del fondo (Glassmorphism en tablero)
    ctx.fillStyle = "rgba(100, 116, 139, 0.1)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

export function drawHexChips(ctx, q, r, chips) {
    if (chips.length === 0) return;

    const { x, y } = axialToPixel(q, r);
    ctx.save();
    ctx.translate(x, y);

    // SPECIAL HANDLING: OBSTACLES (CRYSTAL EMERGENCE)
    const cell = state.board.get(`${q},${r}`);
    if (cell && cell.isObstacle) {
        drawCrystalObstacle(ctx, cell.spawnTime || 0);
        ctx.restore();
        return;
    }

    // Dibujar chips apilados
    const stackHeight = Math.min(chips.length, 15);
    for (let i = 0; i < stackHeight; i++) {
        // Offset vertical para efecto 3D
        const offsetY = -i * 4;
        const color = chips[i];

        ctx.save();
        ctx.translate(0, offsetY);
        drawSingleChip(ctx, color);
        ctx.restore();
    }

    // Indicador de cantidad
    if (chips.length > 1) {
        ctx.fillStyle = "white";
        ctx.font = "bold 16px 'Segoe UI', sans-serif"; // Use premium font
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;

        // Position text on the face of the top chip
        // Top chip offset is (stackHeight - 1) * -4
        // We want to be slightly above the logical center to look optically centered on the face
        const textY = -(stackHeight - 1) * 4;

        // Count consecutive chips of the top color
        const topColor = chips[chips.length - 1];
        let consecutiveCount = 0;
        for (let i = chips.length - 1; i >= 0; i--) {
            if (chips[i] === topColor) consecutiveCount++;
            else break;
        }

        ctx.fillText(consecutiveCount, 0, textY);
    }

    ctx.restore();
}

const CHIP_RADIUS = HEX_SIZE * 0.85; // Helper constant

function drawCrystalObstacle(ctx, spawnTime) {
    const elapsed = performance.now() - spawnTime;
    const duration = 1200; // ms de emergencia
    const progress = Math.min(elapsed / duration, 1);

    // Animación de "Emergencia": Crecimiento y Espiral
    const easedProgress = Math.pow(progress, 0.5); // Rápido al inicio
    const scale = easedProgress;
    const rotation = (1 - easedProgress) * Math.PI; // Efecto espiral al salir

    ctx.save();
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    const size = HEX_SIZE * 0.9;

    // 1. CUERPO: Cristal de Obsidiana (Facetas)
    const grad = ctx.createLinearGradient(-size, -size, size, size);
    grad.addColorStop(0, "#0f172a"); // Deep dark
    grad.addColorStop(0.5, "#1e293b"); // Slate 800
    grad.addColorStop(1, "#020617"); // Blackest

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        ctx.lineTo(size * Math.cos(angle), size * Math.sin(angle));
    }
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 2. FACETAS INTERNAS (Corte de diamante/cristal)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * Math.cos(angle), size * Math.sin(angle));
        ctx.stroke();
    }

    // 3. BORDES NEÓN (Pulsantes)
    const pulse = Math.sin(performance.now() / 400) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 + pulse * 0.4})`; // Sky 400 neón
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10 * pulse;
    ctx.shadowColor = "#38bdf8";

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        ctx.lineTo(size * Math.cos(angle), size * Math.sin(angle));
    }
    ctx.closePath();
    ctx.stroke();

    // 4. NÚCLEO DE ENERGÍA
    const corePulse = Math.sin(performance.now() / 200) * 0.5 + 0.5;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.4);
    coreGrad.addColorStop(0, `rgba(56, 189, 248, ${0.2 * corePulse})`);
    coreGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawSingleChip(ctx, color) {
    const size = CHIP_RADIUS;

    // OBSTACLE FALLBACK (Si se intenta dibujar ROCK como chip individual)
    if (color === 'ROCK') {
        drawCrystalObstacle(ctx, performance.now() - 10000); // Ya salió hace mucho
        return;
    }

    ctx.beginPath();
    const vertices = [];
    for (let i = 0; i < 6; i++) {
        // Removed - Math.PI / 6 to align with flat-topped background hexes
        const angle = (Math.PI / 3) * i;
        vertices.push({
            x: size * Math.cos(angle),
            y: size * Math.sin(angle)
        });
    }

    // Usar quadraticCurveTo para esquinas redondeadas
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

    // Gradiente de relleno con brillo
    const grad = ctx.createRadialGradient(0, -size / 3, 0, 0, 0, size);
    grad.addColorStop(0, adjustColor(color, 30));
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

    // Borde interno sutil
    ctx.strokeStyle = adjustColor(color, -30);
    ctx.lineWidth = 1;
    ctx.stroke();
}

export function drawFlowArrow(ctx, rotation, fromQ, fromR, toQ, toR, color, alpha, canvasWidth, canvasHeight) {
    const from = axialToPixel(fromQ, fromR);
    const to = axialToPixel(toQ, toR);

    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2); // Center context first, assume it was cleared
    // Actually, the main render translation usually happens outside?
    // In original code: ctx.translate(rect.width / 2, rect.height / 2); in drawFlowArrow
    // But here we might call this with a context already translated?
    // Let's assume the context passed is raw and we need to translate relative to center IF we are not already nested.
    // Wait, drawHexBackground calls axialToPixel then translates to x,y.
    // The original drawFlowArrow took canvas size and did global translate.
    // We should probably keep that logic or pass a transformed context.
    // Let's mimic original logic: reset transform or assume identity and translate.
    // BUT typically render() sets the transform for the board...
    // In original game.js render(), `drawFlowIndicators` calls `drawFlowArrow`.
    // And `render` had `ctx.clearRect` but didn't set global translate for the board loop?
    // Ah, `drawHexBackground` did `ctx.translate(x, y)`.
    // So the board is drawn in screen coordinates relative to top-left? NO.
    // Wait, let's check `render` in game.js.
    // `state.board.forEach... drawHexBackground`
    // `drawHexBackground` calls `axialToPixel` then `ctx.translate(x, y)`.
    // `axialToPixel` returns coords centered at 0,0?
    // `const x = HEX_SIZE * (3 / 2 * q);`
    // So if q=0,r=0 -> x=0,y=0.
    // The canvas has 0,0 at top left.
    // Where is the board centered?
    // In original `game.js`: `ctx.translate(rect.width / 2, rect.height / 2);` was MISSING in `render()`??
    // Let me check `render` again in line 902.
    // It does NOT translate to center.
    // BUT `resize()` calls `ctx.scale`.
    // AND `drawHexBackground` does `ctx.translate(x, y)`.
    // So 0,0 is top-left!
    // But `drawFlowArrow` does `ctx.translate(rect.width / 2, rect.height / 2);` ??
    // This implies `drawFlowArrow` expects to draw relative to center, but `axialToPixel` returns relative to 0,0?
    // Oh, `axialToPixel` returns coords relative to "board center".
    // If board center is 0,0, then we MUST translate canvas to center for ANY hex drawing.
    // I missed where the global translation happens.
    // Let's re-read line 900-910 in game.js.
    // It seems `drawHexBackground` only translates to `x,y`. If `x,y` are small, board is top-left corner?
    // Wait, `resize()` in line 1424: `ctx.scale(dpr, dpr)`.
    // Maybe `axialToPixel` includes an offset?
    // `const x = HEX_SIZE * ...` No offset.
    // So 0,0 is top left.
    // UNLESS `ctx` is translated elsewhere.
    // Let's look at `game.js` line 440-480 for `drawFlowArrow` context.
    // It says: `ctx.translate(rect.width / 2, rect.height / 2);`.
    // And `render` (line 925 `state.effects...`) passes `rect.width/2`.
    // But `drawHexBackground` loop (line 906) does NOT seem to translate context to center before loop?
    // If so, the board would be cut off at top left.
    // AH! `resize()` logic?
    // Maybe I missed a `ctx.translate` in `initBoard` or `render`?
    // Or maybe css handles it? No.
    // Checking `game.js` lines 926...
    // `const rect = canvas.getBoundingClientRect();`
    // `drawHexBackground`...
    // I must have missed something.
    // Let's check `drawHexBackground` in `game.js` again (line 709).
    // `const { x, y } = axialToPixel(q, r);`
    // `ctx.save(); ctx.translate(x, y);`
    // If x,y are (0,0), it draws at 0,0 (top left).
    // This implies the board IS at top left??
    // But `drawFlowArrow` translates to center?
    // And `EliminationEffect` translates to `centerX, centerY`.
    // If effect and arrows are centered, but board is top left, they wouldn't align.
    // UNLESS `ctx` has a global translation applied somewhere I missed.
    // Let's look at `resize` again... Just scale.
    // Is it possible `ctx.translate` is called at start of `render`? I viewed `render` and didn't see it.
    // Wait! `drawFlowArrow` has `ctx.translate...`
    // But `drawHexBackground` does NOT?
    // This is weird.
    // Let me check `render` in `game.js` one more time.
    // Line 902: `ctx.clearRect...`
    // Line 906: `state.board.forEach...`
    // Line 908: `drawHexBackground...`
    // I am confused. If `drawHexBackground` draws at `axialToPixel`, and that is centered around 0,0, half the board should be off screen (negative coordinates).
    // UNLESS `ctx` tracks transform?
    // Maybe `game.js` has a global `ctx.translate` at init?
    // Let's assume there is a translation I need to replicate or preserve.
    // Actually, looking at `js/graphics.js` draft...
    // I should provide `drawFlowArrow` exactly as it was.
    // It accepts `canvasWidth`, `canvasHeight` to translate itself.

    ctx.rotate(rotation * Math.PI / 180);

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;

    const startX = from.x + ux * 25;
    const startY = from.y + uy * 25;
    const endX = to.x - ux * 25;
    const endY = to.y - uy * 25;

    ctx.globalAlpha = alpha;
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

    // Punta de flecha
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

export function spawnConfetti() {
    const rect = document.getElementById('gameCanvas').getBoundingClientRect();
    const centerX = rect.width / 2;
    // const centerY = rect.height / 2; // unused for rain effect

    const activeColors = COLORS.slice(0, state.numColors);

    for (let i = 0; i < 600; i++) {
        // Lluvia desde arriba (flujo continuo/cascada inicial)
        // Posición X aleatoria en todo el ancho

        const spawnX = Math.random() * rect.width;
        const spawnY = Math.random() * -rect.height - 50; // Empezar arriba, fuera de pantalla

        const color = activeColors[Math.floor(Math.random() * activeColors.length)];
        state.particles.push(new Particle(spawnX, spawnY, color));
    }
}
