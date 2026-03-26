package ws

import (
	"fmt"
	"time"
	"twitocode/chronoflow/internal/service"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

type FinnhubStreamer struct {
	hub *Hub
	ss  *service.StockService
}

func NewFinnhubStreamer(hub *Hub, ss *service.StockService) *FinnhubStreamer {
	return &FinnhubStreamer{hub, ss}
}

func (fs *FinnhubStreamer) Connect() {
	if fs.ss.ApiKey == "" {
		fs.ss.Logger.Warn("FINNHUB_KEY is empty; skipping Finnhub WebSocket (set env in production)")
		return
	}

	url := fmt.Sprintf("wss://ws.finnhub.io?token=%s", fs.ss.ApiKey)

	for {
		fs.ss.Logger.Info("connecting to finnhub wss...")
		conn, _, err := websocket.DefaultDialer.Dial(url, nil)
		if err != nil {
			fs.ss.Logger.Error("failed to connect to finnhub wss", zap.Error(err))
			time.Sleep(5 * time.Second)
			continue
		}

		symbols := []string{
			"NVDA", "AAPL", "GOOG", "MSFT", "AMZN", "AVGO", "META", "TSLA", "BRK-B", "WMT",
			"LLY", "JPM", "XOM", "V", "JNJ", "MU", "MA", "COST", "ORCL", "CVX",
			"NFLX", "PLTR", "ABBV", "BAC", "CAT", "AMD", "PG", "HD", "KO", "CSCO",
			"GE", "AMAT", "MRK", "MS", "RTX", "GS", "UNH", "GEV", "WFC", "TMUS",
			"IBM", "INTC", "MCD", "VZ", "AXP", "PEP", "T", "TXN", "CRM", "DIS",
		}
		for _, sym := range symbols {
			msg := map[string]string{
				"type":   "subscribe",
				"symbol": sym,
			}
			conn.WriteJSON(msg)
		}

		fs.listen(conn)
		fs.ss.Logger.Info("connection lost, reconnecting in 5 seconds...")
		time.Sleep(5 * time.Second)
	}
}

func (fs *FinnhubStreamer) listen(conn *websocket.Conn) {
	defer conn.Close()
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			fs.ss.Logger.Error("read error from finnhub wss", zap.Error(err))
			return
		}

		// Push the raw message to the hub's broadcast channel
		select {
		case fs.hub.Broadcast() <- message:
		default:
			// Hub is busy
		}
	}
}
