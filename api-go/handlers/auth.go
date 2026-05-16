package handlers

import (
	"os"
	"time"

	"api-go/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// credenciales de demo, en produccion esto estaria en una base de datos con las passwords hasheadas
var credencialesValidas = map[string]string{
	"admin": "password123",
}

// Login verifica las credenciales y devuelve un token JWT firmado
//
// POST /auth/login
// Body: { "username": "admin", "password": "password123" }
func Login(c *fiber.Ctx) error {
	var peticion models.LoginRequest
	if err := c.BodyParser(&peticion); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "el cuerpo de la peticion no es valido",
		})
	}

	// ambos campos son requeridos
	if peticion.Username == "" || peticion.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "el usuario y la contraseña son obligatorios",
		})
	}

	// verificamos que el usuario exista y la contraseña sea correcta
	passwordGuardado, existe := credencialesValidas[peticion.Username]
	if !existe || passwordGuardado != peticion.Password {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "credenciales incorrectas",
		})
	}

	// generamos el token con una duracion de 24 horas
	tokenJWT, err := generarToken(peticion.Username, 24*time.Hour)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "no se pudo generar el token",
		})
	}

	return c.JSON(models.LoginResponse{
		Token:   tokenJWT,
		Message: "Login successful",
	})
}

// generarToken crea un JWT firmado con HS256 para el usuario dado
func generarToken(nombreUsuario string, duracion time.Duration) (string, error) {
	secreto := os.Getenv("JWT_SECRET")
	if secreto == "" {
		secreto = "interseguro-secret-2024"
	}

	datosToken := jwt.MapClaims{
		"sub":      nombreUsuario,
		"username": nombreUsuario,
		"iat":      time.Now().Unix(),
		"exp":      time.Now().Add(duracion).Unix(),
	}

	tokenBuilder := jwt.NewWithClaims(jwt.SigningMethodHS256, datosToken)
	return tokenBuilder.SignedString([]byte(secreto))
}
