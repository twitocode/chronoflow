CREATE TABLE
  IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS tracked_stock (
    id SERIAL PRIMARY KEY,
    stock_id SERIAL,
    user_id UUID,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id)
  );

CREATE TABLE
  IF NOT EXISTS stock (id SERIAL PRIMARY KEY);

CREATE TABLE
  IF NOT EXISTS stock_tracked_stock (
    stock_id SERIAL,
    tracked_stock_id SERIAL,
    CONSTRAINT fk_stock FOREIGN KEY (stock_id) REFERENCES stock (id),
    CONSTRAINT fk_tracked_stock FOREIGN KEY (tracked_stock_id) REFERENCES tracked_stock (id)
  );