package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	mw "twitocode/chronoflow/internal/middleware"
	"twitocode/chronoflow/internal/service"
)

type trackedStockRequest struct {
	Symbol string `json:"symbol"`
}

type createStockAlertRequest struct {
	Symbol      string  `json:"symbol"`
	Condition   string  `json:"condition"`
	TargetPrice float64 `json:"target_price"`
}

func HandleAddTrackedStock(as *service.AlertsService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authenticatedUserID(r)
		if !ok {
			SendError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		var req trackedStockRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			SendError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		item, err := as.AddTrackedStock(r.Context(), userID, req.Symbol)
		if err != nil {
			as.Logger.Error("failed to add tracked stock", zap.String("symbol", req.Symbol), zap.Error(err))
			handleAlertsError(w, err, "Failed to add tracked stock")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]any{"data": item})
	}
}

func HandleListTrackedStocks(as *service.AlertsService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authenticatedUserID(r)
		if !ok {
			SendError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		items, err := as.ListTrackedStocks(r.Context(), userID)
		if err != nil {
			as.Logger.Error("failed to list tracked stocks", zap.Error(err))
			handleAlertsError(w, err, "Failed to retrieve tracked stocks")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{"data": items})
	}
}

func HandleDeleteTrackedStock(as *service.AlertsService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authenticatedUserID(r)
		if !ok {
			SendError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		symbol := chi.URLParam(r, "symbol")
		if err := as.RemoveTrackedStock(r.Context(), userID, symbol); err != nil {
			as.Logger.Error("failed to remove tracked stock", zap.String("symbol", symbol), zap.Error(err))
			handleAlertsError(w, err, "Failed to remove tracked stock")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{"message": "Tracked stock removed"})
	}
}

func HandleCreateStockAlert(as *service.AlertsService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authenticatedUserID(r)
		if !ok {
			SendError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		var req createStockAlertRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			SendError(w, http.StatusBadRequest, "Invalid request body")
			return
		}
		if req.Symbol == "" || req.Condition == "" || req.TargetPrice <= 0 {
			SendError(w, http.StatusBadRequest, "Symbol, condition, and target_price are required")
			return
		}

		item, err := as.CreateAlert(r.Context(), userID, service.CreateStockAlertInput{
			Symbol:      req.Symbol,
			Condition:   req.Condition,
			TargetPrice: req.TargetPrice,
		})
		if err != nil {
			as.Logger.Error("failed to create stock alert",
				zap.String("symbol", req.Symbol),
				zap.String("condition", req.Condition),
				zap.Float64("target_price", req.TargetPrice),
				zap.Error(err),
			)
			handleAlertsError(w, err, "Failed to create stock alert")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]any{"data": item})
	}
}

func HandleListStockAlerts(as *service.AlertsService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authenticatedUserID(r)
		if !ok {
			SendError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		items, err := as.ListAlerts(r.Context(), userID)
		if err != nil {
			as.Logger.Error("failed to list stock alerts", zap.Error(err))
			handleAlertsError(w, err, "Failed to retrieve stock alerts")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{"data": items})
	}
}

func HandleDeleteStockAlert(as *service.AlertsService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authenticatedUserID(r)
		if !ok {
			SendError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		alertID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 32)
		if err != nil {
			SendError(w, http.StatusBadRequest, "Invalid alert id")
			return
		}

		if err := as.DeleteAlert(r.Context(), userID, int32(alertID)); err != nil {
			as.Logger.Error("failed to delete stock alert", zap.Int32("alert_id", int32(alertID)), zap.Error(err))
			handleAlertsError(w, err, "Failed to delete stock alert")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{"message": "Stock alert removed"})
	}
}

func authenticatedUserID(r *http.Request) (string, bool) {
	userClaims, ok := r.Context().Value(mw.UserContextKey).(*mw.UserClaims)
	if !ok || userClaims == nil || userClaims.ID == "" {
		return "", false
	}
	return userClaims.ID, true
}

func handleAlertsError(w http.ResponseWriter, err error, defaultMessage string) {
	switch {
	case errors.Is(err, service.ErrInvalidUserID):
		SendError(w, http.StatusUnauthorized, "Unauthorized")
	case errors.Is(err, service.ErrInvalidStockSymbol),
		errors.Is(err, service.ErrInvalidAlertCondition),
		errors.Is(err, service.ErrInvalidTargetPrice):
		SendError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, service.ErrTrackedStockNotFound),
		errors.Is(err, service.ErrAlertNotFound):
		SendError(w, http.StatusNotFound, err.Error())
	default:
		SendError(w, http.StatusInternalServerError, defaultMessage)
	}
}
