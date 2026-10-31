-- Migration 002: Token Telemetry, Usage Cost Tracking, and Sandbox Logs

CREATE TABLE IF NOT EXISTS token_usage_records (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    workspace_id VARCHAR(64),
    conversation_id VARCHAR(64),
    provider VARCHAR(64) NOT NULL,
    model VARCHAR(64) NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost_usd REAL DEFAULT 0.0,
    latency_ms INTEGER DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sandbox_executions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    language VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'completed',
    exit_code INTEGER DEFAULT 0,
    stdout TEXT DEFAULT '',
    stderr TEXT DEFAULT '',
    execution_time_ms INTEGER DEFAULT 0,
    memory_peak_mb REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_token_usage_user ON token_usage_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_model ON token_usage_records(model);
CREATE INDEX IF NOT EXISTS idx_sandbox_user ON sandbox_executions(user_id, created_at DESC);
