import { state, hexRadius, setHexRadius } from './state.js';
import { COLORS } from './constants.js';
import { getNeighbors } from './utils.js';
import { AnimatedChip, EliminationEffect, drawFlowArrow } from './graphics.js';
import { updateStat, updatePileUI, addActiveColor, gameWin, showGameOver } from './ui.js';

// --- INITIALIZATION ---
export function initBoard() {
    state.board.clear();
    const radius = state.difficulty;
    for (let q = -radius; q <= radius; q++) {
        let r1 = Math.max(-radius, -q - radius);
        let r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r++) {
            state.board.set(`${q},${r}`, { chips: [] });
        }
    }
    setHexRadius(radius);
}

export function generatePile() {
    const size = 2 + Math.floor(Math.random() * 3);
    const chips = [];
    for (let i = 0; i < size; i++) {
        chips.push(COLORS[Math.floor(Math.random() * state.numColors)]);
    }
    return chips;
}

export function refillPlayerPiles() {
    const allEmpty = state.playerPiles.every(p => p === null);
    if (allEmpty) {
        for (let i = 0; i < 3; i++) {
            state.playerPiles[i] = generatePile();
        }
    }
    updatePileUI();
}

export function mulligan() {
    if (state.mulligans > 0 && !state.isAnimating && !state.isHelpOpen) {
        state.mulligans--;
        state.playerPiles = [generatePile(), generatePile(), generatePile()];
        updatePileUI();
    }
}

// --- GAMEPLAY LOGIC ---

export async function processMove(startQ, startR) {
    if (state.isAnimating) return;
    state.isAnimating = true;

    // Asegurar enteros
    startQ = Math.round(startQ);
    startR = Math.round(startR);

    // console.log(`[ProcessMove] Strategic Logic at ${startQ},${startR}`);

    let queue = [`${startQ},${startR}`];
    let processedSteps = 0;
    const MAX_STEPS = 100; // Increased limit for cascade
    const ANIM_DURATION = 300;

    try {
        state.stats.currentCombo = 0;

        while (processedSteps < MAX_STEPS) {
            // Failsafe global scan if queue is dry
            if (queue.length === 0) {
                // 1. Check for pending eliminations (>= 10)
                const stuckKey = findPendingEliminationCell();
                if (stuckKey) {
                    // console.log("Failsafe: Found pending elimination at", stuckKey);
                    queue.push(stuckKey);
                } else {
                    // 2. Check for fragmented connections (Matching neighbors ignoring gravity)
                    const fragmentedKey = findFragmentedConnection();
                    if (fragmentedKey) {
                        // console.log("Failsafe: Found fragmented connection at", fragmentedKey);
                        queue.push(fragmentedKey);
                    } else {
                        break;
                    }
                }
            }

            processedSteps++;
            const currentKey = queue.shift();
            const [q, r] = currentKey.split(',').map(Number);
            const cell = state.board.get(currentKey);

            if (!cell || cell.chips.length === 0) continue;

            const topColor = cell.chips[cell.chips.length - 1];
            const mySize = countConsecutive(cell.chips, topColor);

            // 1. Scan Neighbors
            const neighbors = getNeighbors(q, r);
            const matchingNeighbors = [];

            for (const n of neighbors) {
                const nKey = `${n.q},${n.r}`;
                const nCell = state.board.get(nKey);
                // Strict Color Match Check
                if (nCell && nCell.chips.length > 0) {
                    const nTopColor = nCell.chips[nCell.chips.length - 1];
                    if (nTopColor === topColor) {
                        matchingNeighbors.push({
                            q: n.q, r: n.r, key: nKey, cell: nCell,
                            size: countConsecutive(nCell.chips, topColor)
                        });
                    }
                }
            }

            if (matchingNeighbors.length === 0) {
                // STATIONARY: Check elimination
                const eliminated = await checkEliminationAt(q, r);
                if (eliminated > 0) {
                    if (!queue.includes(currentKey)) queue.push(currentKey);
                    // Wake neighbors to check connectivity with new color
                    neighbors.forEach(n => {
                        const k = `${n.q},${n.r}`;
                        if (state.board.has(k) && !queue.includes(k)) queue.push(k);
                    });
                }
                continue;
            }

            // 2. STRATEGIC REVEAL LOGIC
            // Goal: Merge ALL matching piles into the "Best Destination" (Hub or Neighbor).
            // Criteria: 
            // A. Immediate Elimination (>= 10) is King.
            // B. If no elim, choose destination that reveals the most useful colors underneath.

            const candidates = [
                { key: currentKey, q: q, r: r, cell: cell, size: mySize, isCenter: true } // Me
            ];
            matchingNeighbors.forEach(n => {
                candidates.push({ key: n.key, q: n.q, r: n.r, cell: n.cell, size: n.size, isCenter: false });
            });

            let bestTarget = null;
            let maxScore = -Infinity;

            // SCORING LOOP
            for (const target of candidates) {
                let score = 0;

                // metric 1: Total Size (Elimination Potential)
                const totalChips = candidates.reduce((sum, c) => sum + c.size, 0);

                if (totalChips >= 10) {
                    score += 1000; // Priority 1: ELIMINATION
                } else {
                    // Tie-breaker: Size (Gravity Preference)
                    score += target.size;
                }

                // metric 2: Reveal Potential
                // If 'target' is destination, others are sources. Check beneath them.
                const sources = candidates.filter(c => c.key !== target.key);
                for (const source of sources) {
                    const revealedColor = peekUnderColor(source.cell, topColor);
                    if (revealedColor) {
                        const matches = countNeighborMatches(source.q, source.r, revealedColor);
                        if (matches > 0) {
                            score += (50 * matches); // Bonus for revealing connectable colors
                        }
                    }
                }

                if (score > maxScore) {
                    maxScore = score;
                    bestTarget = target;
                } else if (score === maxScore) {
                    // Tie-breaker: Prefer Center/Hub (Safety)
                    if (target.isCenter) bestTarget = target;
                }
            }

            // EXECUTION
            if (bestTarget) {
                if (bestTarget.isCenter) {
                    // Best is Center -> Gather everyone
                    await gatherNeighborsToCenter(q, r, matchingNeighbors, topColor, ANIM_DURATION);

                    if (!queue.includes(currentKey)) queue.push(currentKey);
                    matchingNeighbors.forEach(n => { if (!queue.includes(n.key)) queue.push(n.key); });

                } else {
                    // Best is Neighbor -> Pump & Dump
                    const others = matchingNeighbors.filter(n => n.key !== bestTarget.key);

                    // 1. Pump others to Me
                    if (others.length > 0) {
                        await gatherNeighborsToCenter(q, r, others, topColor, ANIM_DURATION);
                        others.forEach(n => { if (!queue.includes(n.key)) queue.push(n.key); });
                    }

                    // 2. Dump Me to Target
                    await distributeCenterToTarget(q, r, bestTarget, topColor, ANIM_DURATION);

                    if (!queue.includes(currentKey)) queue.push(currentKey);
                    if (!queue.includes(bestTarget.key)) queue.push(bestTarget.key);
                }

                await new Promise(r => setTimeout(r, 50));
                continue;
            }

            // EQUILIBRIUM / FALLBACK
            const eliminated = await checkEliminationAt(q, r);
            if (eliminated > 0) {
                if (!queue.includes(currentKey)) queue.push(currentKey);
            }
        }
    } catch (error) {
        console.error("Error CRÍTICO en processMove:", error);
    } finally {
        state.isAnimating = false;
        checkGameOver();
    }
}


function peekUnderColor(cell, topColor) {
    if (!cell || cell.chips.length === 0) return null;
    // Find index of first NON-topColor chip from top
    for (let i = cell.chips.length - 1; i >= 0; i--) {
        if (cell.chips[i] !== topColor) {
            return cell.chips[i];
        }
    }
    return null; // Empty or all same color
}

function countNeighborMatches(q, r, color) {
    const neighbors = getNeighbors(q, r);
    let count = 0;
    for (const n of neighbors) {
        const nKey = `${n.q},${n.r}`;
        const nCell = state.board.get(nKey);
        if (nCell && nCell.chips.length > 0) {
            const nTop = nCell.chips[nCell.chips.length - 1];
            if (nTop === color) count++;
        }
    }
    return count;
}

function countConsecutive(chips, color) {
    let c = 0;
    for (let i = chips.length - 1; i >= 0; i--) {
        if (chips[i] === color) c++;
        else break;
    }
    return c;
}

async function gatherNeighborsToCenter(centerQ, centerR, neighbors, color, duration) {
    const centerKey = `${centerQ},${centerR}`;
    const centerCell = state.board.get(centerKey);
    const totalMovedChips = [];

    for (const n of neighbors) {
        const chipsToMove = [];
        while (n.cell.chips.length > 0 && n.cell.chips[n.cell.chips.length - 1] === color) {
            chipsToMove.push(n.cell.chips.pop());
        }
        if (chipsToMove.length > 0) {
            for (let i = 0; i < chipsToMove.length; i++) {
                const anim = new AnimatedChip(n.q, n.r, centerQ, centerR, chipsToMove[i], duration);
                anim.startTime = performance.now() + (i * 20);
                state.animatedChips.push(anim);
            }
            totalMovedChips.push(chipsToMove);
        }
    }

    if (totalMovedChips.length === 0) return;

    await new Promise(r => setTimeout(r, duration + 200));

    for (const batch of totalMovedChips) {
        for (let i = batch.length - 1; i >= 0; i--) {
            centerCell.chips.push(batch[i]);
        }
    }
}

async function distributeCenterToTarget(centerQ, centerR, target, color, duration) {
    const centerKey = `${centerQ},${centerR}`;
    const centerCell = state.board.get(centerKey);

    const chipsToMove = [];
    while (centerCell.chips.length > 0 && centerCell.chips[centerCell.chips.length - 1] === color) {
        chipsToMove.push(centerCell.chips.pop());
    }

    if (chipsToMove.length === 0) return;

    for (let i = 0; i < chipsToMove.length; i++) {
        const anim = new AnimatedChip(centerQ, centerR, target.q, target.r, chipsToMove[i], duration);
        anim.startTime = performance.now() + (i * 30);
        state.animatedChips.push(anim);
    }

    await new Promise(r => setTimeout(r, duration + (chipsToMove.length * 30)));

    const targetCell = state.board.get(target.key || `${target.q},${target.r}`);
    if (targetCell) {
        for (let i = chipsToMove.length - 1; i >= 0; i--) {
            targetCell.chips.push(chipsToMove[i]);
        }
    }
}

export async function checkEliminationAt(q, r, isCenter = false) {
    const key = `${q},${r}`;
    const cell = state.board.get(key);
    if (!cell || cell.chips.length === 0) return 0;

    const topColor = cell.chips[cell.chips.length - 1];
    const { count } = countTopColorChips(cell, topColor);

    // console.log(`Checking elim at ${q},${r}: count=${count} color=${topColor}`); // Debug

    if (count >= 10) {
        const elim = eliminateTopColor(cell, topColor);
        processScore(elim, isCenter);
        state.effects.push(new EliminationEffect(q, r, topColor));
        await new Promise(r => setTimeout(r, 300));
        return elim;
    }
    return 0;
}

function findPendingEliminationCell() {
    for (const [key, cell] of state.board.entries()) {
        if (!cell || cell.chips.length < 10) continue;

        const topColor = cell.chips[cell.chips.length - 1];
        const { count } = countTopColorChips(cell, topColor);
        if (count >= 10) {
            return key;
        }
    }
    return null;
}

function findFragmentedConnection() {
    // Scans board for any cell that has a neighbor of the same color
    // but wasn't processed (stuck isolation).
    for (const [key, cell] of state.board.entries()) {
        if (!cell || cell.chips.length === 0) continue;
        const topColor = cell.chips[cell.chips.length - 1];
        const [q, r] = key.split(',').map(Number);
        const neighbors = getNeighbors(q, r);

        for (const n of neighbors) {
            const nKey = `${n.q},${n.r}`;
            const nCell = state.board.get(nKey);
            if (nCell && nCell.chips.length > 0) {
                const nTop = nCell.chips[nCell.chips.length - 1];
                if (nTop === topColor) {
                    return key; // Found a match that needs processing
                }
            }
        }
    }
    return null;
}

function countTopColorChips(cell, color) {
    let count = 0;
    if (!cell || !cell.chips) return { count: 0 };
    for (let i = cell.chips.length - 1; i >= 0; i--) {
        if (cell.chips[i] === color) count++;
        else break;
    }
    return { count };
}

function eliminateTopColor(cell, color) {
    let removed = 0;
    while (cell.chips.length > 0 && cell.chips[cell.chips.length - 1] === color) {
        cell.chips.pop();
        removed++;
    }
    return removed;
}

function processScore(count, isCenterSuperavit) {
    state.stats.totalEliminated += count;
    state.stats.currentCombo++;
    if (state.stats.currentCombo > state.stats.bestCombo) {
        state.stats.bestCombo = state.stats.currentCombo;
    }

    let points = count;
    if (isCenterSuperavit) points += 5;
    if (state.stats.currentCombo > 1) points += (state.stats.currentCombo * 2);

    state.score += points;

    updateStat('score', state.score);

    if (state.score >= state.goal) {
        gameWin();
    }
}

export function checkGameOver() {
    let emptyCells = 0;
    state.board.forEach(cell => {
        if (cell.chips.length === 0) emptyCells++;
    });

    if (emptyCells === 0) {
        showGameOver();
    }
}

// Helper for flow indicators (used in render via main, but logic is here)
export function findFlowTarget(q, r, topColor, boardState) {
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
