-- name: GetAllUsers :many
SELECT * FROM users;

-- name: CreateUser :one
INSERT INTO users (
  email, password_hash
) VALUES ($1, $2) RETURNING *;

-- name: FindByEmail :one
SELECT EXISTS (
  SELECT 1 FROM users 
  WHERE email = $1
);

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1;

-- name: AddTrackedStock :one
WITH s AS (
  INSERT INTO stock (symbol) VALUES (upper(trim(sqlc.arg(symbol)::text)))
  ON CONFLICT (symbol) DO UPDATE SET symbol = EXCLUDED.symbol
  RETURNING id, symbol
)
,
tracked AS (
  INSERT INTO tracked_stock (stock_id, user_id)
  SELECT s.id, sqlc.arg(user_id)::uuid
  FROM s
  ON CONFLICT (user_id, stock_id) DO UPDATE SET stock_id = EXCLUDED.stock_id
  RETURNING id, stock_id, user_id, created_at
)
SELECT tracked.id, stock.symbol
FROM tracked
JOIN stock ON stock.id = tracked.stock_id;

-- name: ListTrackedStocksByUser :many
SELECT tracked_stock.id, stock.symbol
FROM tracked_stock
JOIN stock ON stock.id = tracked_stock.stock_id
WHERE tracked_stock.user_id = sqlc.arg(user_id)::uuid
ORDER BY stock.symbol ASC;

-- name: RemoveTrackedStockBySymbol :one
WITH deleted_alerts AS (
  DELETE FROM stock_alert
  USING stock
  WHERE stock_alert.user_id = sqlc.arg(user_id)::uuid
    AND stock_alert.stock_id = stock.id
    AND stock.symbol = upper(trim(sqlc.arg(symbol)::text))
),
removed AS (
  DELETE FROM tracked_stock
  USING stock
  WHERE tracked_stock.user_id = sqlc.arg(user_id)::uuid
    AND tracked_stock.stock_id = stock.id
    AND stock.symbol = upper(trim(sqlc.arg(symbol)::text))
  RETURNING tracked_stock.id, tracked_stock.stock_id
)
SELECT removed.id, stock.symbol
FROM removed
JOIN stock ON stock.id = removed.stock_id;

-- name: CreateStockAlert :one
WITH s AS (
  INSERT INTO stock (symbol) VALUES (upper(trim(sqlc.arg(symbol)::text)))
  ON CONFLICT (symbol) DO UPDATE SET symbol = EXCLUDED.symbol
  RETURNING id
),
tracked AS (
  INSERT INTO tracked_stock (stock_id, user_id)
  SELECT s.id, sqlc.arg(user_id)::uuid
  FROM s
  ON CONFLICT (user_id, stock_id) DO NOTHINpG
)
,
alert AS (
  INSERT INTO stock_alert (stock_id, user_id, condition, target_price)
  SELECT s.id, sqlc.arg(user_id)::uuid, lower(trim(sqlc.arg(condition)::text)), sqlc.arg(target_price)::float8
  FROM s
  ON CONFLICT (user_id, stock_id, condition, target_price) DO UPDATE
  SET target_price = EXCLUDED.target_price
  RETURNING id, stock_id, user_id, condition, target_price, created_at
)
SELECT alert.id, stock.symbol, alert.condition, alert.target_price, alert.created_at
FROM alert
JOIN stock ON stock.id = alert.stock_id;

-- name: ListStockAlertsByUser :many
SELECT stock_alert.id, stock.symbol, stock_alert.condition, stock_alert.target_price, stock_alert.created_at
FROM stock_alert
JOIN stock ON stock.id = stock_alert.stock_id
WHERE stock_alert.user_id = sqlc.arg(user_id)::uuid
ORDER BY stock_alert.created_at DESC, stock_alert.id DESC;

-- name: DeleteStockAlertByID :one
DELETE FROM stock_alert
WHERE id = sqlc.arg(id)
  AND user_id = sqlc.arg(user_id)::uuid
RETURNING id;
