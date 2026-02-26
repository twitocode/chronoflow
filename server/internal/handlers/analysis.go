package handlers

import (
	"encoding/json"
	"net/http"

	"twitocode/chronoflow/internal/service"
)

func HandleStockAnalysis(as *service.AnalysisService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		symbol := r.URL.Query().Get("symbol")
		as.Logger.Info("handling stock analysis request")
		res, err := as.Analyze(r.Context(), symbol)

		if err != nil {
			SendError(w, 500, "Failed to retrieve stock aggregate")
			return
		}

		var result map[string]interface{}
		err = json.Unmarshal([]byte(res), &result)
		if err != nil {
			http.Error(w, "AI returned invalid JSON", 500)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(result)
	}
}
