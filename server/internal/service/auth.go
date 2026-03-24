package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"twitocode/chronoflow/internal/db"
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrUserExists   = errors.New("user already exists")
)

type AuthService struct {
	db        *db.Queries
	Logger    *zap.Logger
	JWTSecret string
}

func NewAuthService(db *db.Queries, logger *zap.Logger, jwtSecret string) *AuthService {
	return &AuthService{db, logger, jwtSecret}
}

func (s *AuthService) FindByEmail(ctx context.Context, email string) (bool, error) {
	exists, err := s.db.FindByEmail(ctx, email)
	if err != nil {
		return false, err
	}
	if !exists {
		return false, ErrUserNotFound
	}
	return true, nil
}

func (s *AuthService) GetUserByEmail(ctx context.Context, email string) (db.User, error) {
	user, err := s.db.GetUserByEmail(ctx, email)
	if err != nil {
		return db.User{}, err
	}
	return user, nil
}

func (s *AuthService) CreateUser(ctx context.Context, email, hashedPass string) (db.User, error) {
	user, err := s.db.CreateUser(ctx, db.CreateUserParams{
		Email:        email,
		PasswordHash: hashedPass,
	})
	if err != nil {
		s.Logger.Error("create user error", zap.String("type", fmt.Sprintf("%T", err)), zap.String("error", err.Error()))
		if isUniqueViolation(err) {
			return db.User{}, ErrUserExists
		}
		return db.User{}, err
	}
	return user, nil
}

func (s *AuthService) GenerateToken(userID pgtype.UUID, email string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":   userID.String(),
		"email": email,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	})

	return token.SignedString([]byte(s.JWTSecret))
}

func (s *AuthService) HashPassword(password string) (string, error) {

	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func (*AuthService) CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}