-- Dados de clientes armazenados apenas no D1 privado, nao no GitHub Pages.
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('saite','margot','espaco-piscina')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'novo' CHECK(status IN ('novo','lido','respondido','arquivado')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_requests_created ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS ix_requests_fingerprint ON requests(fingerprint,created_at DESC);
CREATE INDEX IF NOT EXISTS ix_requests_source_status ON requests(source,status,created_at DESC);
CREATE TABLE IF NOT EXISTS throttle (
  key TEXT PRIMARY KEY NOT NULL,
  hits INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_throttle_expiration ON throttle(reset_at);
