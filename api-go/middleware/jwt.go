package middleware

import (
	"os"

	jwtware "github.com/gofiber/contrib/jwt"
	"github.com/gofiber/fiber/v2"
)

// JWTProtected devuelve un middleware de Fiber que valida tokens Bearer JWT
// firmados con el secreto HS256 que esta en la variable de entorno JWT_SECRET
func JWTProtected() fiber.Handler {
	secreto := os.Getenv("JWT_SECRET")
	if secreto == "" {
		secreto = "interseguro-secret-2024"
	}

	return jwtware.New(jwtware.Config{
		SigningKey: jwtware.SigningKey{Key: []byte(secreto)},
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "no autorizado: " + err.Error(),
			})
		},
	})
}
