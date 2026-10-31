import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { runMigrations } from './migrations/runner.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = path.resolve(__dirname, '../../data');
export const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, process.env.NODE_ENV === 'test' ? 'zeno_test.db' : 'zeno_next.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
}

/**
 * SQLite Adapter (Default in local dev, WAL mode)
 */
class SqliteAdapter {
    constructor() {
        this.type = 'sqlite';
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        this.db = new DatabaseSync(DB_PATH);
        this.db.exec('PRAGMA journal_mode = WAL;');
        this.db.exec('PRAGMA synchronous = NORMAL;');
        this.db.exec('PRAGMA foreign_keys = ON;');
        this.db.exec('PRAGMA busy_timeout = 5000;');

        if (fs.existsSync(SCHEMA_PATH)) {
            const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
            this.db.exec(schema);
        }
    }

    query(sql, params = []) {
        return this.db.prepare(sql).all(...params);
    }

    get(sql, params = []) {
        return this.db.prepare(sql).get(...params) || null;
    }

    run(sql, params = []) {
        return this.db.prepare(sql).run(...params);
    }

    async queryAsync(sql, params = []) {
        return this.query(sql, params);
    }

    async getAsync(sql, params = []) {
        return this.get(sql, params);
    }

    async runAsync(sql, params = []) {
        return this.run(sql, params);
    }

    transaction(fn) {
        this.db.exec('BEGIN TRANSACTION;');
        try {
            const res = fn(this.db);
            this.db.exec('COMMIT;');
            return res;
        } catch (err) {
            this.db.exec('ROLLBACK;');
            throw err;
        }
    }

    async healthCheck() {
        try {
            const res = this.get('SELECT 1 as alive');
            return { ok: res?.alive === 1, type: 'sqlite', latencyMs: 0 };
        } catch (err) {
            return { ok: false, type: 'sqlite', error: err.message };
        }
    }

    close() {
        try { this.db.close(); } catch {}
    }
}

/**
 * PostgreSQL Adapter (Production, Connection-pooled, pgvector capable)
 */
class PostgresAdapter {
    constructor(connectionString) {
        this.type = 'postgres';
        this.pool = new Pool({
            connectionString: connectionString || process.env.DATABASE_URL,
            max: parseInt(process.env.DB_POOL_MAX || '20', 10),
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        });

        this.pool.on('error', (err) => {
            console.error('[PostgreSQL Pool Unexpected Error]', err.message);
        });
    }

    toPg(sql) {
        let i = 1;
        return sql.replace(/\?/g, () => `$${i++}`);
    }

    async queryAsync(sql, params = []) {
        const client = await this.pool.connect();
        try {
            const res = await client.query(this.toPg(sql), params);
            return res.rows;
        } finally {
            client.release();
        }
    }

    async getAsync(sql, params = []) {
        const rows = await this.queryAsync(sql, params);
        return rows[0] || null;
    }

    async runAsync(sql, params = []) {
        const client = await this.pool.connect();
        try {
            const res = await client.query(this.toPg(sql), params);
            return { changes: res.rowCount };
        } finally {
            client.release();
        }
    }

    query(sql, params = []) {
        // Synchronous bridge when sync queries called against PG
        // Returns empty or logs notice during transition
        console.warn('[PostgresAdapter Sync Call Warning] Call queryAsync instead for high-throughput Postgres.');
        return [];
    }

    get(sql, params = []) {
        console.warn('[PostgresAdapter Sync Call Warning] Call getAsync instead for high-throughput Postgres.');
        return null;
    }

    run(sql, params = []) {
        console.warn('[PostgresAdapter Sync Call Warning] Call runAsync instead for high-throughput Postgres.');
        return { changes: 0 };
    }

    async transactionAsync(fn) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const res = await fn(client);
            await client.query('COMMIT');
            return res;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async healthCheck() {
        const start = Date.now();
        try {
            const res = await this.pool.query('SELECT 1 as alive');
            return {
                ok: res.rows[0]?.alive === 1,
                type: 'postgres',
                latencyMs: Date.now() - start,
                totalCount: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount
            };
        } catch (err) {
            return { ok: false, type: 'postgres', error: err.message };
        }
    }

    async close() {
        await this.pool.end();
    }
}

// Active singleton adapter
let activeAdapter = null;

export function getDatabaseAdapter() {
    if (activeAdapter) return activeAdapter;

    const isPostgresConfigured = Boolean(
        process.env.DATABASE_URL || 
        process.env.DB_TYPE === 'postgres' || 
        process.env.PGHOST
    );

    if (isPostgresConfigured) {
        try {
            console.log('✦ Connecting to production PostgreSQL engine...');
            activeAdapter = new PostgresAdapter(process.env.DATABASE_URL);
        } catch (pgErr) {
            console.warn('[DB] Postgres init failed, falling back to SQLite WAL:', pgErr.message);
            activeAdapter = new SqliteAdapter();
        }
    } else {
        activeAdapter = new SqliteAdapter();
    }

    // Seed default admin user if not present
    seedInitialData(activeAdapter);

    // Apply incremental schema migrations
    runMigrations(activeAdapter).catch(err => {
        console.warn('[DB Migration Warning]:', err.message);
    });

    return activeAdapter;
}

export function getDatabase() {
    const adapter = getDatabaseAdapter();
    return adapter.db || adapter;
}

export function query(sql, params = []) {
    const adapter = getDatabaseAdapter();
    return adapter.query(sql, params);
}

export function get(sql, params = []) {
    const adapter = getDatabaseAdapter();
    return adapter.get(sql, params);
}

export function run(sql, params = []) {
    const adapter = getDatabaseAdapter();
    return adapter.run(sql, params);
}

export function transaction(fn) {
    const adapter = getDatabaseAdapter();
    return adapter.transaction(fn);
}

export async function queryAsync(sql, params = []) {
    const adapter = getDatabaseAdapter();
    return adapter.queryAsync(sql, params);
}

export async function getAsync(sql, params = []) {
    const adapter = getDatabaseAdapter();
    return adapter.getAsync(sql, params);
}

export async function runAsync(sql, params = []) {
    const adapter = getDatabaseAdapter();
    return adapter.runAsync(sql, params);
}

export async function healthCheckDb() {
    const adapter = getDatabaseAdapter();
    return adapter.healthCheck();
}

export function seedInitialData(adapter) {
    try {
        const userCount = adapter.get('SELECT count(*) as c FROM users')?.c || 0;
        if (userCount === 0) {
            const adminId = 'usr-admin-shreenith';
            const adminEmail = process.env.ADMIN_EMAIL || 'shreenithdevadiga@gmail.com';
            const salt = crypto.randomBytes(16).toString('hex');
            const initialSecret = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@123';
            const hash = hashPassword(initialSecret, salt);

            adapter.run(`
                INSERT INTO users (id, name, email, role, plan, password_hash, password_salt, status, email_verified)
                VALUES (?, ?, ?, 'super-admin', 'enterprise', ?, ?, 'active', 1)
            `, [adminId, 'Shreenith Devadiga', adminEmail, hash, salt]);

            adapter.run(`
                INSERT INTO user_profiles (user_id, display_name, bio, rgb_preset, rgb_mode, rgb_intensity, rgb_speed, is_rgb_on, accent_color)
                VALUES (?, ?, ?, 'aurora', 'dynamic', 0.85, 1.0, 1, '#06b6d4')
            `, [adminId, 'Shreenith Devadiga', 'Founder & Creator of ZENO AI NEXT']);
        }
    } catch (seedErr) {
        // Non-blocking seed notice
    }
}
