package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"api-go/models"
	"api-go/services"

	"github.com/gofiber/fiber/v2"
)

// QRDecomposition es el handler principal, hace todo el flujo:
//  1. valida la matriz que manda el cliente
//  2. calcula la descomposicion QR con Gram-Schmidt
//  3. le pasa Q y R a la api de node para las estadisticas
//  4. devuelve todo junto al cliente
//
// POST /api/matrix/qr
// Body: { "matrix": [[...], [...], ...] }
func QRDecomposition(c *fiber.Ctx) error {
	var peticion models.MatrixRequest
	if err := c.BodyParser(&peticion); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "el cuerpo de la peticion no es valido",
		})
	}

	if len(peticion.Matrix) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "la matriz no puede estar vacia",
		})
	}

	// verificamos que todas las filas tengan el mismo numero de columnas
	numColumnas := len(peticion.Matrix[0])
	for _, fila := range peticion.Matrix {
		if len(fila) != numColumnas {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "todas las filas deben tener la misma cantidad de columnas",
			})
		}
	}

	// la descomposicion QR solo funciona si m >= n
	if len(peticion.Matrix) < numColumnas {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("la matriz debe cumplir m >= n (recibimos %d filas y %d columnas)", len(peticion.Matrix), numColumnas),
		})
	}

	// calculamos la descomposicion
	Q, R, err := services.QRDecompose(peticion.Matrix)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "fallo la descomposicion QR: " + err.Error(),
		})
	}

	// pedimos las estadisticas a la api de node
	estadisticas, err := obtenerEstadisticas(Q, R)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "el servicio de estadisticas no esta disponible: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(models.QRResponse{
		OriginalMatrix: peticion.Matrix,
		Q:              Q,
		R:              R,
		Statistics:     *estadisticas,
	})
}

// obtenerEstadisticas llama a la api de node y le manda Q y R para que calcule las stats
func obtenerEstadisticas(Q, R [][]float64) (*models.StatsResponse, error) {
	urlApiNode := os.Getenv("NODE_API_URL")
	if urlApiNode == "" {
		urlApiNode = "http://api-node:4000"
	}

	// generamos un token de servicio de corta duracion para la comunicacion entre apis
	tokenServicio, err := generarToken("api-go-service", time.Minute)
	if err != nil {
		return nil, fmt.Errorf("no se pudo generar el token de servicio: %w", err)
	}

	datosSolicitud := models.StatsRequest{Q: Q, R: R}
	cuerpoJSON, err := json.Marshal(datosSolicitud)
	if err != nil {
		return nil, err
	}

	peticionHTTP, err := http.NewRequest(http.MethodPost, urlApiNode+"/api/stats", bytes.NewReader(cuerpoJSON))
	if err != nil {
		return nil, err
	}
	peticionHTTP.Header.Set("Content-Type", "application/json")
	peticionHTTP.Header.Set("Authorization", "Bearer "+tokenServicio)

	// timeout de 10 segundos para no quedarnos esperando demasiado
	clienteHTTP := &http.Client{Timeout: 10 * time.Second}
	respuestaHTTP, err := clienteHTTP.Do(peticionHTTP)
	if err != nil {
		return nil, err
	}
	defer respuestaHTTP.Body.Close()

	if respuestaHTTP.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("la api de estadisticas devolvio HTTP %d", respuestaHTTP.StatusCode)
	}

	var estadisticas models.StatsResponse
	if err := json.NewDecoder(respuestaHTTP.Body).Decode(&estadisticas); err != nil {
		return nil, err
	}

	return &estadisticas, nil
}
