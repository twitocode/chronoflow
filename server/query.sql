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