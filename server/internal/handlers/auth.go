package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"twitocode/chronoflow/internal/service"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

func HandleCheckEmail(as *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		as.Logger.Info("handling email check")

		email := chi.URLParam(r, "email")
		if email == "" {
			email = r.URL.Query().Get("email")
		}

		result, err := as.FindByEmail(r.Context(), email)
		if err != nil {
			if errors.Is(err, service.ErrUserNotFound) {
				SendError(w, http.StatusNotFound, "User not found")
				return
			}
			as.Logger.Error("failed to find email", zap.String("email", email), zap.Error(err))
			SendError(w, http.StatusInternalServerError, "Failed to process request")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		json.NewEncoder(w).Encode(map[string]interface{}{
			"data": result,
		})
	}
}

type SignupDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func HandleSignup(as *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		as.Logger.Info("handling signup")

		var dto SignupDTO
		if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
			SendError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		if dto.Email == "" || dto.Password == "" {
			SendError(w, http.StatusBadRequest, "Email and password required")
			return
		}

		exists, _ := as.FindByEmail(r.Context(), dto.Email)
		if exists {
			SendError(w, http.StatusConflict, "User already exists")
			return
		}

		hashedPass, err := as.HashPassword(dto.Password)
		if err != nil {
			as.Logger.Error("failed to hash password", zap.Error(err))
			SendError(w, http.StatusInternalServerError, "Failed to process password")
			return
		}

		err = as.CreateUser(r.Context(), dto.Email, hashedPass)
		if err != nil {
			if errors.Is(err, service.ErrUserExists) {
				SendError(w, http.StatusConflict, "User already exists")
				return
			}
			as.Logger.Error("failed to create user", zap.Error(err))
			SendError(w, http.StatusInternalServerError, "Failed to create user")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]any{
			"message": "User created successfully",
		})
	}
}
