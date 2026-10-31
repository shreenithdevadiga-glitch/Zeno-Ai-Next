-- Migration 005: Admin Password Recovery, OTP Verification, and Account Lockout Schema
-- Adds recovery metadata, lockout counters, and cryptographic OTP records

-- 1. Upgrade users table with recovery and security lockout columns
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN mfa_enabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN last_password_change TIMESTAMP;

-- 2. Cryptographic Admin OTP records table
CREATE TABLE IF NOT EXISTS admin_otps (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    channel VARCHAR(16) NOT NULL DEFAULT 'email',
    destination VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(128) NOT NULL,
    otp_salt VARCHAR(64) NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at TIMESTAMP NOT NULL,
    resend_allowed_at TIMESTAMP NOT NULL,
    is_used INTEGER DEFAULT 0,
    used_at TIMESTAMP DEFAULT NULL,
    ip_address VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Indexes for rapid lookups and expiration enforcement
CREATE INDEX IF NOT EXISTS idx_admin_otps_user ON admin_otps(user_id, is_used, expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_otps_created ON admin_otps(created_at);
