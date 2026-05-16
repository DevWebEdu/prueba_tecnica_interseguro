'use strict';

const { calculateMatrixStats, calculateCombinedStats, isDiagonal } = require('../src/services/stats');

// ─── isDiagonal ──────────────────────────────────────────────────────────────

describe('isDiagonal', () => {
  test('la identidad 3×3 es diagonal', () => {
    expect(isDiagonal([[1, 0, 0], [0, 1, 0], [0, 0, 1]])).toBe(true);
  });

  test('una matriz no cuadrada no es diagonal', () => {
    expect(isDiagonal([[1, 0], [0, 1], [0, 0]])).toBe(false);
  });

  test('triangular superior con elementos fuera de la diagonal no es diagonal', () => {
    expect(isDiagonal([[1, 2, 3], [0, 4, 5], [0, 0, 6]])).toBe(false);
  });

  test('una matriz 1×1 siempre es diagonal', () => {
    expect(isDiagonal([[7]])).toBe(true);
  });

  test('elementos casi cero fuera de la diagonal se ignoran (ruido de punto flotante)', () => {
    expect(isDiagonal([[1, 1e-12], [1e-12, 2]])).toBe(true);
  });

  test('una matriz vacia no es diagonal', () => {
    expect(isDiagonal([])).toBe(false);
  });
});

// ─── calculateMatrixStats ────────────────────────────────────────────────────

describe('calculateMatrixStats', () => {
  test('calcula bien las stats de [[1,2],[3,4]]', () => {
    const stats = calculateMatrixStats([[1, 2], [3, 4]]);
    expect(stats.max).toBe(4);
    expect(stats.min).toBe(1);
    expect(stats.sum).toBe(10);
    expect(stats.average).toBe(2.5);
    expect(stats.is_diagonal).toBe(false);
  });

  test('detecta correctamente una matriz diagonal', () => {
    const stats = calculateMatrixStats([[5, 0, 0], [0, 3, 0], [0, 0, 8]]);
    expect(stats.is_diagonal).toBe(true);
    expect(stats.max).toBe(8);
    expect(stats.min).toBe(0);
  });

  test('maneja valores negativos sin problema', () => {
    const stats = calculateMatrixStats([[-3, -1], [-2, 0]]);
    expect(stats.max).toBe(0);
    expect(stats.min).toBe(-3);
    expect(stats.sum).toBe(-6);
  });

  test('matriz de un solo elemento', () => {
    const stats = calculateMatrixStats([[42]]);
    expect(stats.max).toBe(42);
    expect(stats.min).toBe(42);
    expect(stats.sum).toBe(42);
    expect(stats.average).toBe(42);
    expect(stats.is_diagonal).toBe(true);
  });
});

// ─── calculateCombinedStats ──────────────────────────────────────────────────

describe('calculateCombinedStats', () => {
  test('combina dos matrices correctamente', () => {
    const Q = [[1, 0], [0, 1]];
    const R = [[2, 3], [0, 4]];
    const stats = calculateCombinedStats([Q, R]);
    expect(stats.max).toBe(4);
    expect(stats.min).toBe(0);
    expect(stats.sum).toBe(11);
    expect(stats.average).toBeCloseTo(11 / 8, 8);
  });

  test('si no hay matrices devuelve todo en cero', () => {
    const stats = calculateCombinedStats([]);
    expect(stats.max).toBe(0);
    expect(stats.min).toBe(0);
    expect(stats.sum).toBe(0);
    expect(stats.average).toBe(0);
  });
});
