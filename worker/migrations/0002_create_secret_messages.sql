CREATE TABLE secret_messages (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 1000),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_secret_messages_created_at
  ON secret_messages(created_at);
