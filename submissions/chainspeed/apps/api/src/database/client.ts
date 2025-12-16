// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - DATABASE CLIENT
//                    PostgreSQL + Redis connection management
// ═══════════════════════════════════════════════════════════════════════════

import { Pool, PoolClient } from 'pg';
import Redis from 'ioredis';

// PostgreSQL connection pool
let pool: Pool | null = null;

// Redis client
let redis: Redis | null = null;

/**
 * Initialize PostgreSQL connection pool
 */
export function initDatabase(): Pool {
    if (pool) return pool;

    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        console.warn('[Database] DATABASE_URL not set, using in-memory storage only');
        return null as any;
    }

    pool = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
        console.error('[Database] Unexpected error on idle client', err);
    });

    pool.on('connect', () => {
        console.log('[Database] New client connected to PostgreSQL');
    });

    return pool;
}

/**
 * Get the database pool
 */
export function getDatabase(): Pool | null {
    return pool;
}

/**
 * Initialize Redis client
 */
export function initRedis(): Redis {
    if (redis) return redis;

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
            if (times > 3) {
                console.error('[Redis] Max retries reached, giving up');
                return null;
            }
            return Math.min(times * 100, 3000);
        },
    });

    redis.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
    });

    redis.on('connect', () => {
        console.log('[Redis] Connected successfully');
    });

    return redis;
}

/**
 * Get the Redis client
 */
export function getRedis(): Redis | null {
    return redis;
}

/**
 * Execute a query with automatic client management
 */
export async function query<T = any>(
    text: string,
    params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
    if (!pool) {
        throw new Error('Database not initialized');
    }
    const result = await pool.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount || 0 };
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
    if (!pool) {
        throw new Error('Database not initialized');
    }
    return pool.connect();
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Close all database connections
 */
export async function closeDatabase(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('[Database] PostgreSQL pool closed');
    }

    if (redis) {
        await redis.quit();
        redis = null;
        console.log('[Redis] Connection closed');
    }
}

/**
 * Health check for database connections
 */
export async function healthCheck(): Promise<{
    postgres: boolean;
    redis: boolean;
}> {
    let postgresOk = false;
    let redisOk = false;

    try {
        if (pool) {
            await pool.query('SELECT 1');
            postgresOk = true;
        }
    } catch (error) {
        console.error('[Database] PostgreSQL health check failed:', error);
    }

    try {
        if (redis) {
            await redis.ping();
            redisOk = true;
        }
    } catch (error) {
        console.error('[Database] Redis health check failed:', error);
    }

    return { postgres: postgresOk, redis: redisOk };
}
