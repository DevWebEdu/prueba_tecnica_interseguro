package services

import (
	"math"
	"testing"
)

const tolerancia = 1e-6

// TestQRDecompose_3x3 prueba el ejemplo clasico de Golub & Van Loan
func TestQRDecompose_3x3(t *testing.T) {
	A := [][]float64{
		{12, -51, 4},
		{6, 167, -68},
		{-4, 24, -41},
	}
	Q, R, err := QRDecompose(A)
	if err != nil {
		t.Fatalf("error inesperado: %v", err)
	}
	verificarQR(t, A, Q, R)
	verificarOrtonormal(t, Q)
	verificarTriangularSuperior(t, R)
}

// TestQRDecompose_Identity verifica que al descomponer la identidad se obtiene Q=I y R=I
func TestQRDecompose_Identity(t *testing.T) {
	A := [][]float64{{1, 0, 0}, {0, 1, 0}, {0, 0, 1}}
	Q, R, err := QRDecompose(A)
	if err != nil {
		t.Fatalf("error inesperado: %v", err)
	}
	verificarQR(t, A, Q, R)
	verificarOrtonormal(t, Q)
	verificarTriangularSuperior(t, R)
}

// TestQRDecompose_Rectangular prueba una matriz rectangular de 4×3
func TestQRDecompose_Rectangular(t *testing.T) {
	A := [][]float64{
		{1, 2, 3},
		{4, 5, 6},
		{7, 8, 10},
		{10, 11, 13},
	}
	Q, R, err := QRDecompose(A)
	if err != nil {
		t.Fatalf("error inesperado: %v", err)
	}
	verificarQR(t, A, Q, R)
	verificarTriangularSuperior(t, R)
}

// TestQRDecompose_EmptyMatrix espera un error si la matriz esta vacia
func TestQRDecompose_EmptyMatrix(t *testing.T) {
	_, _, err := QRDecompose([][]float64{})
	if err == nil {
		t.Error("se esperaba un error para matriz vacia, pero no llego ninguno")
	}
}

// TestQRDecompose_TooFewRows espera un error cuando m < n
func TestQRDecompose_TooFewRows(t *testing.T) {
	A := [][]float64{{1, 2, 3}, {4, 5, 6}}
	_, _, err := QRDecompose(A)
	if err == nil {
		t.Error("se esperaba un error para m < n, pero no llego ninguno")
	}
}

// ─── helpers ────────────────────────────────────────────────────────────────

// verificarQR comprueba que Q·R sea aproximadamente igual a A
func verificarQR(t *testing.T, A, Q, R [][]float64) {
	t.Helper()
	numFilas, numColumnas := len(A), len(A[0])
	for i := 0; i < numFilas; i++ {
		for j := 0; j < numColumnas; j++ {
			productoAcumulado := 0.0
			for k := 0; k < numColumnas; k++ {
				productoAcumulado += Q[i][k] * R[k][j]
			}
			if math.Abs(productoAcumulado-A[i][j]) > tolerancia {
				t.Errorf("Q·R[%d][%d] = %.8f, esperabamos %.8f", i, j, productoAcumulado, A[i][j])
			}
		}
	}
}

// verificarOrtonormal comprueba que Qᵀ·Q sea aproximadamente la identidad
func verificarOrtonormal(t *testing.T, Q [][]float64) {
	t.Helper()
	numColumnas := len(Q[0])
	for i := 0; i < numColumnas; i++ {
		for j := 0; j < numColumnas; j++ {
			productoAcumulado := 0.0
			for k := 0; k < len(Q); k++ {
				productoAcumulado += Q[k][i] * Q[k][j]
			}
			valorEsperado := 0.0
			if i == j {
				valorEsperado = 1.0
			}
			if math.Abs(productoAcumulado-valorEsperado) > tolerancia {
				t.Errorf("Qᵀ·Q[%d][%d] = %.8f, esperabamos %.8f", i, j, productoAcumulado, valorEsperado)
			}
		}
	}
}

// verificarTriangularSuperior comprueba que todos los elementos bajo la diagonal de R sean cero
func verificarTriangularSuperior(t *testing.T, R [][]float64) {
	t.Helper()
	for i := 1; i < len(R); i++ {
		for j := 0; j < i && j < len(R[i]); j++ {
			if math.Abs(R[i][j]) > tolerancia {
				t.Errorf("R[%d][%d] = %.8f, esperabamos 0 (triangular superior)", i, j, R[i][j])
			}
		}
	}
}
