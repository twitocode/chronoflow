package handlers

import (
	"encoding/json"
	"net/http"

	"twitocode/chronoflow/internal/service"
	"twitocode/chronoflow/internal/ws"

	"go.uber.org/zap"
)

func HandleStockInfoAggregate(ss *service.StockService, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		symbol := r.URL.Query().Get("symbol")
		ss.Logger.Info("handling stock aggregate request")
		data, err := ss.Get(r.Context(), symbol)
		if err != nil {
			SendError(w, 500, "Failed to retrieve stock aggregate")
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}

func HandleStockWS(ss *service.StockService, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		symbol := r.URL.Query().Get("symbol")
		ss.Logger.Info("handling stock websocket upgrade", zap.String("symbol", symbol))
		hub.AddSubscriber(w, r, symbol)
	}
}
