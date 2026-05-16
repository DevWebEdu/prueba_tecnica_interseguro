package models

// MatrixRequest es lo que manda el cliente para pedir la descomposicion QR
type MatrixRequest struct {
	Matrix [][]float64 `json:"matrix"`
}

// StatsRequest es lo que le mandamos a la api de node con Q y R
type StatsRequest struct {
	Q [][]float64 `json:"Q"`
	R [][]float64 `json:"R"`
}

// MatrixStats tiene las estadisticas calculadas para una sola matriz
type MatrixStats struct {
	Max        float64 `json:"max"`
	Min        float64 `json:"min"`
	Average    float64 `json:"average"`
	Sum        float64 `json:"sum"`
	IsDiagonal bool    `json:"is_diagonal"`
}

// CombinedStats tiene las estadisticas de Q y R juntas
type CombinedStats struct {
	Max     float64 `json:"max"`
	Min     float64 `json:"min"`
	Average float64 `json:"average"`
	Sum     float64 `json:"sum"`
}

// StatsResponse es la respuesta que nos devuelve la api de node
type StatsResponse struct {
	QStats        MatrixStats   `json:"q_stats"`
	RStats        MatrixStats   `json:"r_stats"`
	CombinedStats CombinedStats `json:"combined_stats"`
}

// QRResponse es la respuesta final que le mandamos al cliente con todo
type QRResponse struct {
	OriginalMatrix [][]float64   `json:"original_matrix"`
	Q              [][]float64   `json:"Q"`
	R              [][]float64   `json:"R"`
	Statistics     StatsResponse `json:"statistics"`
}

// LoginRequest tiene las credenciales que manda el usuario
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse tiene el token JWT generado
type LoginResponse struct {
	Token   string `json:"token"`
	Message string `json:"message"`
}
