package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

func SendError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{
		Error:   http.StatusText(status),
		Message: message,
	})
}

func SendErrorf(w http.ResponseWriter, status int, format string, args ...any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{
		Error: http.StatusText(status),
	})
}

func HandleServiceError(w http.ResponseWriter, logger interface{ Error(string, ...any) }, err error, defaultMsg string) {
	if errors.Is(err, ErrNotFound) {
		SendError(w, http.StatusNotFound, "Not found")
		return
	}
	logger.Error("service error", "error", err)
	SendError(w, http.StatusInternalServerError, defaultMsg)
}

var ErrNotFound = errors.New("not found")
