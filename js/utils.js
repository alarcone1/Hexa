import { HEX_SIZE } from './constants.js';

export function axialToPixel(q, r) {
    const x = HEX_SIZE * (3 / 2 * q);
    const y = HEX_SIZE * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
    return { x, y };
}

export function pixelToAxial(x, y) {
    const q = (2 / 3 * x) / HEX_SIZE;
    const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / HEX_SIZE;
    return roundHex(q, r);
}

export function roundHex(q, r) {
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

export function getNeighbors(q, r) {
    const dirs = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    return dirs.map(d => ({ q: q + d.q, r: r + d.r }));
}

export function adjustColor(hex, amt) {
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
    return "#" + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

export function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}
