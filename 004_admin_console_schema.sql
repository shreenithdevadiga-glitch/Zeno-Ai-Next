-- Migration 004: Enterprise SaaS Admin Console Data Model
-- Roles, Granular Permissions, Security Events, Login/Registration Audits, SaaS Plans, Feature Flags, and Admin Notifications

-- 1. Granular RBAC: Roles and Permissions
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    is_system INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    module VARCHAR(64) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(64) NOT NULL,
    permission_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(64) NOT NULL,
    role_id VARCHAR(64) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(64),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 2. Authentication & Login Auditing
CREATE TABLE IF NOT EXISTS login_events (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    email_attempted VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    reason VARCHAR(255),
    ip_address VARCHAR(64),
    user_agent TEXT,
    device VARCHAR(64),
    browser VARCHAR(64),
    os VARCHAR(64),
    session_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registration_events (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    email VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    method VARCHAR(32) DEFAULT 'password',
    ip_address VARCHAR(64),
    user_agent TEXT,
    source VARCHAR(64) DEFAULT 'web',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_security_events (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    ip_address VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Security Incident Center
CREATE TABLE IF NOT EXISTS security_events (
    id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    user_id VARCHAR(64),
    ip_address VARCHAR(64),
    user_agent TEXT,
    endpoint VARCHAR(255),
    details_json TEXT DEFAULT '{}',
    is_resolved INTEGER DEFAULT 0,
    resolved_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. SaaS Plans and Feature Flags
CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    monthly_price_usd REAL DEFAULT 0.0,
    monthly_tokens INTEGER DEFAULT 500000,
    max_requests_per_day INTEGER DEFAULT 200,
    max_storage_mb INTEGER DEFAULT 100,
    max_file_size_mb INTEGER DEFAULT 15,
    max_concurrent_jobs INTEGER DEFAULT 1,
    features_json TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feature_flags (
    id VARCHAR(64) PRIMARY KEY,
    key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    is_enabled INTEGER DEFAULT 1,
    rollout_percentage INTEGER DEFAULT 100,
    allowed_roles_json TEXT DEFAULT '[]',
    allowed_plans_json TEXT DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(16) DEFAULT 'info',
    target_plan VARCHAR(32) DEFAULT 'all',
    is_active INTEGER DEFAULT 1,
    starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_notifications (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(16) DEFAULT 'info',
    module VARCHAR(64) DEFAULT 'system',
    is_read INTEGER DEFAULT 0,
    metadata_json TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    scopes_json TEXT DEFAULT '["chat","research"]',
    status VARCHAR(32) DEFAULT 'active',
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_login_events_user ON login_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_status ON login_events(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_ip ON login_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_reg_events_created ON registration_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_type ON security_events(event_type, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_unresolved ON security_events(is_resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pass_events_user ON password_security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id, status);
