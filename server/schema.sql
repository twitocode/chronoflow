CREATE TABLE
  IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS tracked_stock (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER NOT NULL REFERENCES stock (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, stock_id)
  );

CREATE TABLE
  IF NOT EXISTS stock_alert (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER NOT NULL REFERENCES stock (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
    target_price DOUBLE PRECISION NOT NULL CHECK (target_price > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, stock_id, condition, target_price)
  );