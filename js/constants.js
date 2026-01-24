export const HEX_SIZE = 40;
export const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316'];
export const DIFFICULTY_NAMES = { 3: 'Pequeño', 4: 'Normal', 5: 'Grande' };
export const DIFFICULTY_ICONS = { 3: '○', 4: '◔', 5: '●' };

export const OBSTACLE_TYPES = {
    ROCK: { name: 'ROCA', desc: 'Bloqueo total. Inamovible y obstructiva.' },
    GRIETA: { name: 'GRIETA', desc: 'Absorbe 1 ficha de cada pila que pase por encima.' },
    IMAN: { name: 'IMÁN', desc: 'Atrae los saltos cercanos hacia ella.' },
    VENTILADOR: { name: 'VENTILADOR', desc: 'Empuja las fichas lejos de su posición.' },
    CRISTAL: { name: 'CRISTAL', desc: 'Se bloquea tras 3 saltos cercanos.' },
    VALVULA: { name: 'VÁLVULA', desc: 'Solo permite el paso de un color específico.' },
    AGUJERO: { name: 'AGUJERO', desc: 'Teletransporta fichas a su par conectado.' },
    PEAJE: { name: 'PEAJE', desc: 'Solo permite saltos de pilas con 5+ fichas.' },
    NIEBLA: { name: 'NIEBLA', desc: 'Oculta la información de las celdas vecinas.' },
    NUCLEO: { name: 'NÚCLEO', desc: 'Cambia de posición tras cada eliminación.' }
};
