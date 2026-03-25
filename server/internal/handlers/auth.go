package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	mw "twitocode/chronoflow/internal/middleware"
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

func setTokenCookie(w http.ResponseWriter, token string) {
	cookie := &http.Cookie{
		Name:     "token",
		Value:    token,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
		MaxAge:   86400,
	}
	w.Header().Add("Set-Cookie", cookie.String())
}

func clearTokenCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:     "token",
		Value:    "",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	}
	w.Header().Add("Set-Cookie", cookie.String())
}

func HandleCurrentUser() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userClaims, ok := r.Context().Value(mw.UserContextKey).(*mw.UserClaims)
		if !ok || userClaims == nil {
			SendError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{
			"data": userClaims,
		})
	}
}

func HandleLogout() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clearTokenCookie(w)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{
			"message": "Logout successful",
		})
	}
}

func HandleLogin(as *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		as.Logger.Info("handling login")

		var dto SignupDTO
		if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
			SendError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		user, err := as.GetUserByEmail(r.Context(), dto.Email)
		if err != nil {
			as.Logger.Error("failed to find user", zap.String("email", dto.Email), zap.Error(err))
			SendError(w, http.StatusUnauthorized, "Invalid credentials")
			return
		}

		if !as.CheckPasswordHash(dto.Password, user.PasswordHash) {
			SendError(w, http.StatusUnauthorized, "Invalid credentials")
			return
		}

		token, err := as.GenerateToken(user.ID, user.Email)
		if err != nil {
			as.Logger.Error("failed to generate token", zap.Error(err))
			SendError(w, http.StatusInternalServerError, "Failed to generate token")
			return
		}

		setTokenCookie(w, token)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]any{
			"message": "Login successful",
			"data": map[string]any{
				"id":    user.ID,
				"email": user.Email,
			},
		})
	}
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

		user, err := as.CreateUser(r.Context(), dto.Email, hashedPass)
		if err != nil {
			if errors.Is(err, service.ErrUserExists) {
				SendError(w, http.StatusConflict, "User already exists")
				return
			}
			as.Logger.Error("failed to create user", zap.Error(err))
			SendError(w, http.StatusInternalServerError, "Failed to create user")
			return
		}

		token, err := as.GenerateToken(user.ID, user.Email)
		if err != nil {
			as.Logger.Error("failed to generate token", zap.Error(err))
			SendError(w, http.StatusInternalServerError, "Failed to generate token")
			return
		}

		setTokenCookie(w, token)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]any{
			"message": "User created successfully",
			"data": map[string]any{
				"id":    user.ID,
				"email": user.Email,
			},
		})
	}
}
