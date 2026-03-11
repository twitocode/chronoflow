package ws

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev
	},
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client

	// symbolSubscribers maps a stock symbol to a set of clients interested in it
	symbolSubscribers map[string]map[*Client]bool
	mu                sync.RWMutex
}

type Client struct {
	Hub  *Hub
	Conn *websocket.Conn
	Send chan []byte
	// symbols this specific client is interested in
	symbols map[string]bool
}

func NewHub() *Hub {
	return &Hub{
		broadcast:         make(chan []byte),
		register:          make(chan *Client),
		unregister:        make(chan *Client),
		clients:           make(map[*Client]bool),
		symbolSubscribers: make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
				// Clean up symbol subscriptions for this client
				for symbol := range client.symbols {
					if subs, ok := h.symbolSubscribers[symbol]; ok {
						delete(subs, client)
						if len(subs) == 0 {
							delete(h.symbolSubscribers, symbol)
						}
					}
				}
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			var update struct {
				Type string `json:"type"`
				Data []struct {
					Symbol string  `json:"s"`
					Price  float64 `json:"p"`
					Time   int64   `json:"t"`
					Volume float64 `json:"v"`
				} `json:"data"`
			}

			if err := json.Unmarshal(message, &update); err != nil {
				continue
			}

			if update.Type != "trade" {
				continue
			}

			h.mu.RLock()
			// Relay only to interested clients
			for _, trade := range update.Data {
				if subs, ok := h.symbolSubscribers[trade.Symbol]; ok {
					data, _ := json.Marshal(map[string]interface{}{
						"type":   "trade",
						"symbol": trade.Symbol,
						"price":  trade.Price,
						"time":   trade.Time,
					})
					for client := range subs {
						select {
						case client.Send <- data:
						default:
							// Handle slow client
						}
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) AddSubscriber(w http.ResponseWriter, r *http.Request, symbol string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := &Client{
		Hub:     h,
		Conn:    conn,
		Send:    make(chan []byte, 256),
		symbols: make(map[string]bool),
	}

	h.register <- client

	if symbol != "" {
		h.mu.Lock()
		if h.symbolSubscribers[symbol] == nil {
			h.symbolSubscribers[symbol] = make(map[*Client]bool)
		}
		h.symbolSubscribers[symbol][client] = true
		client.symbols[symbol] = true
		h.mu.Unlock()
	}

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	for {
		_, _, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func (c *Client) writePump() {
	defer func() {
		c.Conn.Close()
	}()

	for message := range c.Send {
		w, err := c.Conn.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		w.Write(message)

		if err := w.Close(); err != nil {
			return
		}
	}
	// The channel was closed
	c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
}

func (h *Hub) Broadcast() chan []byte {
	return h.broadcast
}
