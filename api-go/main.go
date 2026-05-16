package main

import (
	"log"
	"os"

	"api-go/handlers"
	"api-go/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	app := fiber.New(fiber.Config{
		AppName: "Interseguro Matrix QR API v1.0",
	})

	// middleware de logs y cors para que el frontend pueda llamar a la api
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, OPTIONS",
	}))

	// ruta publica para verificar que el servicio esta vivo
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "api-go"})
	})

	// ruta publica de autenticacion, no requiere token
	app.Post("/auth/login", handlers.Login)

	// rutas protegidas, todas necesitan un JWT valido en el header
	api := app.Group("/api", middleware.JWTProtected())
	api.Post("/matrix/qr", handlers.QRDecomposition)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("Starting Interseguro Go API on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
