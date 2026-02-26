package handlers

import (
	"encoding/json"
	"net/http"

	"twitocode/chronoflow/internal/service"
)

func HandleStockInfoAggregate(ss *service.StockService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		symbol := r.URL.Query().Get("symbol")
		ss.Logger.Info("handling stock aggregate request")
		news, err := ss.Get(r.Context(), symbol)

		if err != nil {
			SendError(w, 500, "Failed to retrieve stock aggregate")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(news)
	}
}
