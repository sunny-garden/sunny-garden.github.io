CREATE TABLE letter_locations (
  id TEXT PRIMARY KEY,
  client_timestamp TEXT NOT NULL,
  server_timestamp TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('granted', 'denied', 'unavailable', 'error')),
  latitude REAL,
  longitude REAL,
  accuracy REAL,
  error_message TEXT,
  user_agent TEXT NOT NULL
);

CREATE INDEX idx_letter_locations_server_timestamp
  ON letter_locations(server_timestamp);
