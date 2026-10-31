import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabaseAdapter } from '../database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations(adapter = null) {
    const activeAdapter = adapter || getDatabaseAdapter();
    try {
        // Ensure migration tracking table exists
        await activeAdapter.runAsync(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(64) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Read all .sql files in migrations dir sorted by name
        const migrationFiles = fs.readdirSync(__dirname)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of migrationFiles) {
            const version = file.split('_')[0];
            const alreadyApplied = await activeAdapter.getAsync(
                'SELECT version FROM schema_migrations WHERE version = ?',
                [version]
            );

            if (!alreadyApplied) {
                const filePath = path.join(__dirname, file);
                const rawSql = fs.readFileSync(filePath, 'utf-8');
                
                // Strip SQL comment lines
                const cleanSql = rawSql
                    .split('\n')
                    .map(line => line.trim().startsWith('--') ? '' : line)
                    .join('\n');

                // Execute individual statements split by semicolon
                const statements = cleanSql
                    .split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);

                for (const stmt of statements) {
                    try {
                        await activeAdapter.runAsync(stmt);
                    } catch (stmtErr) {
                        // Tolerate benign "duplicate column" or "already exists" errors during progressive upgrades
                        if (!stmtErr.message.includes('duplicate column') && !stmtErr.message.includes('already exists')) {
                            throw stmtErr;
                        }
                    }
                }

                await activeAdapter.runAsync(
                    'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
                    [version, file]
                );
                console.log(`[Migrations] Applied ${file}`);
            }
        }
    } catch (err) {
        console.warn('[Migrations Warning]', err.message);
    }
}
