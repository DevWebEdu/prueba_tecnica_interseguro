FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy everything and let go mod tidy resolve dependencies
COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 3000
CMD ["./main"]
