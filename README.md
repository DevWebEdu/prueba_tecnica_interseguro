# Interseguro — Factorización QR de Matrices

Sistema de descomposición QR implementado con una arquitectura de microservicios, compuesto por dos APIs independientes y un frontend web. Todo el entorno corre sobre Docker, por lo que no se requiere instalar dependencias manualmente.

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.

Nada más. No se necesita Go, Node.js ni ningún otro runtime instalado localmente.

---

## Levantar el proyecto

Desde la raíz del repositorio, ejecutar:

```bash
docker-compose up --build
```

Docker construirá las imágenes y levantará los tres servicios de forma automática. La primera vez puede tomar un par de minutos mientras descarga las dependencias.

Una vez que los contenedores estén corriendo, los servicios estarán disponibles en:

| Servicio | URL |
|---|---|
| Frontend | http://localhost:8080 |
| API Go (QR) | http://localhost:3000 |
| API Node.js (Estadísticas) | http://localhost:4000 |

Para detener el entorno:

```bash
docker-compose down
```

---

## Credenciales de acceso

```
Usuario:    admin
Contraseña: password123
```

---

## Arquitectura

```
┌─────────────────────────────────────────────┐
│                  Frontend                   │
│           Nginx · Puerto 8080               │
└────────────────────┬────────────────────────┘
                     │ HTTP + JWT
┌────────────────────▼────────────────────────┐
│               API Go (Go + Fiber)           │
│  · Autenticación JWT                        │
│  · Descomposición QR (Gram-Schmidt)         │
│                Puerto 3000                  │
└────────────────────┬────────────────────────┘
                     │ HTTP + JWT (inter-servicio)
┌────────────────────▼────────────────────────┐
│          API Node.js (Express)              │
│  · Estadísticas de matrices (max, min,      │
│    promedio, suma, diagonal)                │
│                Puerto 4000                  │
└─────────────────────────────────────────────┘
```

**Flujo de una petición:**

1. El usuario inicia sesión desde el frontend → la API Go valida las credenciales y emite un JWT.
2. El usuario ingresa una matriz y solicita la factorización → el frontend envía la matriz a la API Go con el token en el header.
3. La API Go ejecuta la descomposición QR usando el algoritmo de Gram-Schmidt y obtiene las matrices **Q** y **R**.
4. Internamente, la API Go llama a la API Node.js (con un token de servicio de corta duración) para calcular las estadísticas de ambas matrices.
5. La API Go consolida la respuesta y la devuelve al frontend, que presenta los resultados junto con las estadísticas.

---

## Estructura del proyecto

```
pruebatecnica_tai/
├── api-go/                  # API principal en Go
│   ├── handlers/            # Lógica de los endpoints
│   ├── middleware/          # Validación JWT
│   ├── models/              # Estructuras de datos
│   ├── services/            # Algoritmo de descomposición QR
│   └── Dockerfile
├── api-node/                # API de estadísticas en Node.js
│   ├── src/
│   │   ├── middleware/      # Validación JWT
│   │   ├── routes/          # Definición de rutas
│   │   └── services/        # Cálculo de estadísticas
│   ├── tests/               # Tests unitarios
│   └── Dockerfile
├── frontend/                # Interfaz web estática
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

---

## Ejecutar los tests

**API Go:**
```bash
docker-compose run --rm api-go go test ./...
```

**API Node.js:**
```bash
docker-compose run --rm api-node npm test
```
