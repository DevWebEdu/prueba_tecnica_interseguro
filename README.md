# Interseguro — Factorización QR de Matrices

Sistema de descomposición QR implementado con una arquitectura de microservicios, compuesto por dos APIs independientes y un frontend web. Todo el entorno corre sobre Docker, por lo que no se requiere instalar dependencias manualmente.

---

## Requisitos previos

- Docker Desktop instalado y en ejecución.

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



**Flujo de una petición:**

1. El usuario inicia sesión desde el frontend → la API Go valida las credenciales y emite un JWT.
2. El usuario ingresa una matriz y solicita la factorización → el frontend envía la matriz a la API Go con el token en el header.
3. La API Go ejecuta la descomposición QR usando el algoritmo de Gram-Schmidt y obtiene las matrices **Q** y **R**.
4. Internamente, la API Go llama a la API Node.js (con un token de servicio de corta duración) para calcular las estadísticas de ambas matrices.
5. La API Go consolida la respuesta y la devuelve al frontend, que presenta los resultados junto con las estadísticas.

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
