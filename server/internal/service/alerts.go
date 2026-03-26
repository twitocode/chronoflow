package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"go.uber.org/zap"

	"twitocode/chronoflow/internal/db"
)

var (
	ErrInvalidUserID         = errors.New("invalid user id")
	ErrInvalidStockSymbol    = errors.New("invalid stock symbol")
	ErrInvalidAlertCondition = errors.New("invalid alert condition")
	ErrInvalidTargetPrice    = errors.New("invalid target price")
	ErrTrackedStockNotFound  = errors.New("tracked stock not found")
	ErrAlertNotFound         = errors.New("alert not found")
)

type TrackedStock struct {
	ID     int32  `json:"id"`
	Symbol string `json:"symbol"`
}

type StockAlert struct {
	ID          int32     `json:"id"`
	Symbol      string    `json:"symbol"`
	Condition   string    `json:"condition"`
	TargetPrice float64   `json:"target_price"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateStockAlertInput struct {
	Symbol      string  `json:"symbol"`
	Condition   string  `json:"condition"`
	TargetPrice float64 `json:"target_price"`
}

type alertsStore interface {
	AddTrackedStock(context.Context, db.AddTrackedStockParams) (db.AddTrackedStockRow, error)
	ListTrackedStocksByUser(context.Context, pgtype.UUID) ([]db.ListTrackedStocksByUserRow, error)
	RemoveTrackedStockBySymbol(context.Context, db.RemoveTrackedStockBySymbolParams) (db.RemoveTrackedStockBySymbolRow, error)
	CreateStockAlert(context.Context, db.CreateStockAlertParams) (db.CreateStockAlertRow, error)
	ListStockAlertsByUser(context.Context, pgtype.UUID) ([]db.ListStockAlertsByUserRow, error)
	DeleteStockAlertByID(context.Context, db.DeleteStockAlertByIDParams) (int32, error)
}

type AlertsService struct {
	store  alertsStore
	Logger *zap.Logger
}

func NewAlertsService(store alertsStore, logger *zap.Logger) *AlertsService {
	return &AlertsService{
		store:  store,
		Logger: logger,
	}
}

func (s *AlertsService) AddTrackedStock(ctx context.Context, userID, symbol string) (TrackedStock, error) {
	pgUserID, err := parseUserID(userID)
	if err != nil {
		return TrackedStock{}, err
	}

	normalizedSymbol, err := normalizeSymbol(symbol)
	if err != nil {
		return TrackedStock{}, err
	}

	row, err := s.store.AddTrackedStock(ctx, db.AddTrackedStockParams{
		Symbol: normalizedSymbol,
		UserID: pgUserID,
	})
	if err != nil {
		return TrackedStock{}, err
	}

	return TrackedStock{
		ID:     row.ID,
		Symbol: row.Symbol,
	}, nil
}

func (s *AlertsService) ListTrackedStocks(ctx context.Context, userID string) ([]TrackedStock, error) {
	pgUserID, err := parseUserID(userID)
	if err != nil {
		return nil, err
	}

	rows, err := s.store.ListTrackedStocksByUser(ctx, pgUserID)
	if err != nil {
		return nil, err
	}

	items := make([]TrackedStock, 0, len(rows))
	for _, row := range rows {
		items = append(items, TrackedStock{
			ID:     row.ID,
			Symbol: row.Symbol,
		})
	}

	return items, nil
}

func (s *AlertsService) RemoveTrackedStock(ctx context.Context, userID, symbol string) error {
	pgUserID, err := parseUserID(userID)
	if err != nil {
		return err
	}

	normalizedSymbol, err := normalizeSymbol(symbol)
	if err != nil {
		return err
	}

	_, err = s.store.RemoveTrackedStockBySymbol(ctx, db.RemoveTrackedStockBySymbolParams{
		UserID: pgUserID,
		Symbol: normalizedSymbol,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrTrackedStockNotFound
	}
	return err
}

func (s *AlertsService) CreateAlert(ctx context.Context, userID string, input CreateStockAlertInput) (StockAlert, error) {
	pgUserID, err := parseUserID(userID)
	if err != nil {
		return StockAlert{}, err
	}

	normalizedSymbol, err := normalizeSymbol(input.Symbol)
	if err != nil {
		return StockAlert{}, err
	}

	condition, err := normalizeCondition(input.Condition)
	if err != nil {
		return StockAlert{}, err
	}

	if input.TargetPrice <= 0 {
		return StockAlert{}, ErrInvalidTargetPrice
	}

	row, err := s.store.CreateStockAlert(ctx, db.CreateStockAlertParams{
		Symbol:      normalizedSymbol,
		UserID:      pgUserID,
		Condition:   condition,
		TargetPrice: input.TargetPrice,
	})
	if err != nil {
		return StockAlert{}, err
	}

	return mapStockAlertRow(row), nil
}

func (s *AlertsService) ListAlerts(ctx context.Context, userID string) ([]StockAlert, error) {
	pgUserID, err := parseUserID(userID)
	if err != nil {
		return nil, err
	}

	rows, err := s.store.ListStockAlertsByUser(ctx, pgUserID)
	if err != nil {
		return nil, err
	}

	items := make([]StockAlert, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapStockAlertFields(
			row.ID,
			row.Symbol,
			row.Condition,
			row.TargetPrice,
			row.CreatedAt.Time,
		))
	}

	return items, nil
}

func (s *AlertsService) DeleteAlert(ctx context.Context, userID string, alertID int32) error {
	pgUserID, err := parseUserID(userID)
	if err != nil {
		return err
	}

	_, err = s.store.DeleteStockAlertByID(ctx, db.DeleteStockAlertByIDParams{
		ID:     alertID,
		UserID: pgUserID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrAlertNotFound
	}
	return err
}

func parseUserID(userID string) (pgtype.UUID, error) {
	var parsed pgtype.UUID
	if err := parsed.Scan(strings.TrimSpace(userID)); err != nil {
		return pgtype.UUID{}, ErrInvalidUserID
	}
	return parsed, nil
}

func normalizeSymbol(symbol string) (string, error) {
	normalized := strings.ToUpper(strings.TrimSpace(symbol))
	if normalized == "" {
		return "", ErrInvalidStockSymbol
	}
	return normalized, nil
}

func normalizeCondition(condition string) (string, error) {
	normalized := strings.ToLower(strings.TrimSpace(condition))
	switch normalized {
	case "above", "below":
		return normalized, nil
	default:
		return "", ErrInvalidAlertCondition
	}
}

func mapStockAlertRow(row db.CreateStockAlertRow) StockAlert {
	return mapStockAlertFields(row.ID, row.Symbol, row.Condition, row.TargetPrice, row.CreatedAt.Time)
}

func mapStockAlertFields(id int32, symbol, condition string, targetPrice float64, createdAt time.Time) StockAlert {
	return StockAlert{
		ID:          id,
		Symbol:      symbol,
		Condition:   condition,
		TargetPrice: targetPrice,
		CreatedAt:   createdAt,
	}
}
