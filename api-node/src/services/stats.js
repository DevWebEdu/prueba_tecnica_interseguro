'use strict';

/**
 * Calcula estadisticas descriptivas y verifica si la matriz es diagonal.
 * @param {number[][]} matriz
 * @returns {{ max: number, min: number, average: number, sum: number, is_diagonal: boolean }}
 */
function calculateMatrixStats(matriz) {
  const todosLosValores = matriz.flat();

  // si no hay valores devolvemos todo en cero
  if (todosLosValores.length === 0) {
    return { max: 0, min: 0, average: 0, sum: 0, is_diagonal: false };
  }

  const max         = Math.max(...todosLosValores);
  const min         = Math.min(...todosLosValores);
  const sum         = todosLosValores.reduce((acumulador, valor) => acumulador + valor, 0);
  const average     = sum / todosLosValores.length;
  const is_diagonal = esDiagonal(matriz);

  return {
    max: redondear(max),
    min: redondear(min),
    average: redondear(average),
    sum: redondear(sum),
    is_diagonal,
  };
}

/**
 * Determina si una matriz es diagonal.
 * Una matriz es diagonal si es cuadrada y todos sus elementos fuera
 * de la diagonal principal son practicamente cero.
 * @param {number[][]} matriz
 * @returns {boolean}
 */
function esDiagonal(matriz) {
  const numFilas = matriz.length;
  if (numFilas === 0) return false;

  const numColumnas = matriz[0].length;
  // tiene que ser cuadrada si o si
  if (numFilas !== numColumnas) return false;

  const MARGEN_ERROR = 1e-9;
  for (let i = 0; i < numFilas; i++) {
    for (let j = 0; j < numColumnas; j++) {
      // si algun elemento fuera de la diagonal no es cero, no es diagonal
      if (i !== j && Math.abs(matriz[i][j]) > MARGEN_ERROR) return false;
    }
  }
  return true;
}

/**
 * Calcula estadisticas sobre todas las matrices juntas.
 * @param {number[][][]} listaDematrices
 * @returns {{ max: number, min: number, average: number, sum: number }}
 */
function calculateCombinedStats(listaDematrices) {
  // aplanamos todas las matrices en un solo array
  const valoresCombinados = listaDematrices.flat(2);

  if (valoresCombinados.length === 0) {
    return { max: 0, min: 0, average: 0, sum: 0 };
  }

  const max     = Math.max(...valoresCombinados);
  const min     = Math.min(...valoresCombinados);
  const sum     = valoresCombinados.reduce((acumulador, valor) => acumulador + valor, 0);
  const average = sum / valoresCombinados.length;

  return {
    max: redondear(max),
    min: redondear(min),
    average: redondear(average),
    sum: redondear(sum),
  };
}

// redondeamos a 10 decimales para evitar el ruido de punto flotante
function redondear(numero) {
  return Math.round(numero * 1e10) / 1e10;
}

// exportamos tambien isDiagonal con el nombre original para que los tests no se rompan
module.exports = { calculateMatrixStats, calculateCombinedStats, isDiagonal: esDiagonal };
