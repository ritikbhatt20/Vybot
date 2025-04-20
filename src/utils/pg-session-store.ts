import { Pool } from 'pg';
import { AsyncSessionStore, SessionStore } from 'telegraf/typings/session';

export interface PgSessionStoreOptions {
    host?: string;
    port?: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    table?: string;
    keyColumn?: string;
    valueColumn?: string;
}

export class PgSessionStore<T> implements AsyncSessionStore<T> {
    private pool: Pool;
    private table: string;
    private keyColumn: string;
    private valueColumn: string;
    private initialized: boolean = false;

    constructor(options: PgSessionStoreOptions) {
        this.pool = new Pool({
            host: options.host || 'localhost',
            port: options.port || 5432,
            database: options.database,
            user: options.user,
            password: options.password,
            ssl: options.ssl ? { rejectUnauthorized: false } : undefined,
        });

        this.table = options.table || 'telegraf_sessions';
        this.keyColumn = options.keyColumn || 'session_id';
        this.valueColumn = options.valueColumn || 'session_data';
    }

    async init(): Promise<void> {
        if (this.initialized) return;

        // Create table if not exists
        await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.table} (
        ${this.keyColumn} TEXT PRIMARY KEY,
        ${this.valueColumn} JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

        // Create index on key column
        await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_${this.table}_${this.keyColumn} ON ${this.table} (${this.keyColumn})
    `);

        this.initialized = true;
    }

    async get(key: string): Promise<T | undefined> {
        await this.init();

        const result = await this.pool.query(
            `SELECT ${this.valueColumn} FROM ${this.table} WHERE ${this.keyColumn} = $1`,
            [key]
        );

        if (result.rows.length === 0) {
            return undefined;
        }

        return result.rows[0][this.valueColumn];
    }

    async set(key: string, value: T): Promise<void> {
        await this.init();

        await this.pool.query(
            `
      INSERT INTO ${this.table} (${this.keyColumn}, ${this.valueColumn}, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (${this.keyColumn})
      DO UPDATE SET ${this.valueColumn} = $2, updated_at = NOW()
      `,
            [key, value]
        );
    }

    async delete(key: string): Promise<void> {
        await this.init();

        await this.pool.query(
            `DELETE FROM ${this.table} WHERE ${this.keyColumn} = $1`,
            [key]
        );
    }
}

export function PostgresSessionStore<T>(options: PgSessionStoreOptions): SessionStore<T> {
    return new PgSessionStore<T>(options);
}
