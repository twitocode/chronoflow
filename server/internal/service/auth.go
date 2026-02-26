package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgconn"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"twitocode/chronoflow/internal/db"
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrUserExists   = errors.New("user already exists")
)

type AuthService struct {
	db     *db.Queries
	Logger *zap.Logger
}

func NewAuthService(db *db.Queries, logger *zap.Logger) *AuthService {
	return &AuthService{db, logger}
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

func (s *AuthService) CreateUser(ctx context.Context, email, hashedPass string) error {
	_, err := s.db.CreateUser(ctx, db.CreateUserParams{
		Email:        email,
		PasswordHash: hashedPass,
	})
	if err != nil {
		s.Logger.Error("create user error", zap.String("type", fmt.Sprintf("%T", err)), zap.String("error", err.Error()))
		if isUniqueViolation(err) {
			return ErrUserExists
		}
		return err
	}
	return nil
}

func (*AuthService) HashPassword(password string) (string, error) {
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