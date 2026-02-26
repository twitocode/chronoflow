package handlers

import (
	"encoding/json"
	"net/http"

	"twitocode/chronoflow/internal/service"
)

func HandleStockNews(ns *service.NewsService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		symbol := r.URL.Query().Get("symbol")
		ns.Logger.Info("handling stock news request")
		news, err := ns.Get(r.Context(), symbol)
		if err != nil {
			SendError(w, 500, "Failed to retrieve stock news")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(news)
	}
}
