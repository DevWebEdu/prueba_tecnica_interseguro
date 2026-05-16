// Package services tiene la implementacion del algoritmo de descomposicion QR
// usando el proceso de ortonormalizacion de Gram-Schmidt.
//
// Dada una matriz A (m×n, con m>=n) la descomposicion produce:
//   - Q  — matriz m×n con columnas ortonormales
//   - R  — matriz n×n triangular superior
//
// de modo que A = Q·R
package services

import (
	"fmt"
	"math"
)

// QRDecompose hace la descomposicion QR delgada (economy) de la matriz A.
// Devuelve Q y R, o un error si la matriz no es valida.
func QRDecompose(A [][]float64) (Q, R [][]float64, err error) {
	numFilas := len(A)
	if numFilas == 0 {
		return nil, nil, fmt.Errorf("la matriz debe tener al menos una fila")
	}
	numColumnas := len(A[0])
	if numColumnas == 0 {
		return nil, nil, fmt.Errorf("la matriz debe tener al menos una columna")
	}
	if numFilas < numColumnas {
		return nil, nil, fmt.Errorf("la matriz debe cumplir m >= n (recibimos %d×%d)", numFilas, numColumnas)
	}

	// extraemos las columnas de A para trabajar con ellas
	columnasA := make([][]float64, numColumnas)
	for j := 0; j < numColumnas; j++ {
		columnasA[j] = make([]float64, numFilas)
		for i := 0; i < numFilas; i++ {
			columnasA[j][i] = A[i][j]
		}
	}

	// reservamos espacio para Q (m×n) y R (n×n)
	Q = make([][]float64, numFilas)
	for i := range Q {
		Q[i] = make([]float64, numColumnas)
	}
	R = make([][]float64, numColumnas)
	for i := range R {
		R[i] = make([]float64, numColumnas)
	}

	// columnasQ guarda las columnas ortonormales de Q que vamos calculando
	columnasQ := make([][]float64, numColumnas)

	for j := 0; j < numColumnas; j++ {
		// empezamos con una copia de la columna j de A
		vectorActual := make([]float64, numFilas)
		copy(vectorActual, columnasA[j])

		// le restamos la proyeccion sobre cada columna q ya calculada
		for i := 0; i < j; i++ {
			R[i][j] = productoPunto(columnasQ[i], columnasA[j])
			for k := 0; k < numFilas; k++ {
				vectorActual[k] -= R[i][j] * columnasQ[i][k]
			}
		}

		norma := math.Sqrt(productoPunto(vectorActual, vectorActual))
		R[j][j] = redondear(norma, 10)

		columnasQ[j] = make([]float64, numFilas)
		// si la norma es casi cero las columnas son linealmente dependientes, lo ignoramos
		if norma > 1e-10 {
			for k := 0; k < numFilas; k++ {
				columnasQ[j][k] = vectorActual[k] / norma
			}
		}

		// redondeamos R para eliminar ruido de punto flotante
		for i := 0; i < j; i++ {
			R[i][j] = redondear(R[i][j], 10)
		}
	}

	// llenamos Q con las columnas que calculamos
	for i := 0; i < numFilas; i++ {
		for j := 0; j < numColumnas; j++ {
			Q[i][j] = redondear(columnasQ[j][i], 10)
		}
	}

	return Q, R, nil
}

// productoPunto calcula el producto punto de dos vectores de igual longitud
func productoPunto(vectorA, vectorB []float64) float64 {
	suma := 0.0
	for i := range vectorA {
		suma += vectorA[i] * vectorB[i]
	}
	return suma
}

// redondear redondea x a la cantidad de decimales indicada
func redondear(x float64, decimales int) float64 {
	escala := math.Pow(10, float64(decimales))
	return math.Round(x*escala) / escala
}
