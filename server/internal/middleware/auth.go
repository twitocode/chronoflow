package middleware

import (
	"context"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserContextKey contextKey = "user"

type UserClaims struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

func JWTMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("token")
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}

			tokenString := cookie.Value
			claims := jwt.MapClaims{}
			token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
				return []byte(jwtSecret), nil
			})

			if err != nil || !token.Valid {
				next.ServeHTTP(w, r)
				return
			}

			// Get user ID from token (stored as string UUID)
			userID, ok := claims["sub"].(string)
			if !ok {
				next.ServeHTTP(w, r)
				return
			}
			email, ok := claims["email"].(string)
			if !ok {
				next.ServeHTTP(w, r)
				return
			}

			userClaims := &UserClaims{
				ID:    userID,
				Email: email,
			}

			ctx := context.WithValue(r.Context(), UserContextKey, userClaims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := r.Context().Value(UserContextKey)
		if user == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}
