/**
 * Dominio: escala de velocidades de lectura.
 * Sin dependencias del navegador — se puede testear en Node.
 */

export const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5];

export const DEFAULT_SPEED_INDEX = 3; // 1.0x

export function speedAt(index) {
  return SPEEDS[clampSpeedIndex(index)];
}

export function clampSpeedIndex(index) {
  const i = Number(index);
  if (!Number.isFinite(i)) return DEFAULT_SPEED_INDEX;
  return Math.min(SPEEDS.length - 1, Math.max(0, Math.round(i)));
}

export function formatSpeed(value) {
  return `${value % 1 === 0 ? value.toFixed(1) : String(value)}x`;
}
