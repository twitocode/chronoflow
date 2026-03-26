package pricestore

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

const (
	keyPrefix  = "prices:"
	maxAge     = 1 * time.Hour
	pruneEvery = 500 // prune old entries every N appends per symbol
)

type Trade struct {
	Symbol string  `json:"symbol"`
	Price  float64 `json:"price"`
	Time   int64   `json:"time"` // milliseconds
}

type PriceStore struct {
	rdb    *redis.Client
	logger *zap.Logger
	counts map[string]int // per-symbol append counter for periodic pruning
}

// redisClientOptions builds go-redis options from either a URL (redis:// or rediss://)
// or a legacy host:port address (e.g. localhost:6379).
func redisClientOptions(addr string) (*redis.Options, error) {
	addr = strings.TrimSpace(addr)
	if strings.HasPrefix(addr, "redis://") || strings.HasPrefix(addr, "rediss://") {
		return redis.ParseURL(addr)
	}
	return &redis.Options{Addr: addr}, nil
}

func New(addr string, logger *zap.Logger) (*PriceStore, error) {
	opts, err := redisClientOptions(addr)
	if err != nil {
		return nil, fmt.Errorf("redis options: %w", err)
	}
	rdb := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ping failed: %w", err)
	}

	logger.Info("price store connected to redis", zap.String("addr", opts.Addr))

	return &PriceStore{
		rdb:    rdb,
		logger: logger,
		counts: make(map[string]int),
	}, nil
}

func (ps *PriceStore) Close() error {
	return ps.rdb.Close()
}

func (ps *PriceStore) Append(ctx context.Context, t Trade) {
	key := keyPrefix + t.Symbol

	payload, err := json.Marshal(t)
	if err != nil {
		return
	}

	ps.rdb.ZAdd(ctx, key, redis.Z{
		Score:  float64(t.Time),
		Member: string(payload),
	})

	ps.counts[t.Symbol]++
	if ps.counts[t.Symbol]%pruneEvery == 0 {
		cutoff := float64(time.Now().UnixMilli()) - float64(maxAge.Milliseconds())
		ps.rdb.ZRemRangeByScore(ctx, key, "-inf", fmt.Sprintf("%f", cutoff))
	}
}

func (ps *PriceStore) GetHistory(ctx context.Context, symbol string) ([]Trade, error) {
	key := keyPrefix + symbol
	cutoff := float64(time.Now().UnixMilli()) - float64(maxAge.Milliseconds())

	results, err := ps.rdb.ZRangeByScore(ctx, key, &redis.ZRangeBy{
		Min: fmt.Sprintf("%f", cutoff),
		Max: "+inf",
	}).Result()
	if err != nil {
		return nil, fmt.Errorf("redis zrangebyscore: %w", err)
	}

	trades := make([]Trade, 0, len(results))
	for _, raw := range results {
		var t Trade
		if err := json.Unmarshal([]byte(raw), &t); err != nil {
			continue
		}
		trades = append(trades, t)
	}

	return trades, nil
}
