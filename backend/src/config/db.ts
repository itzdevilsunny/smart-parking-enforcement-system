import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'smart_parking',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = async (text: string, params?: any[]) => {
    // MOCK fallback if no Database URL is provided
    const USE_MOCK = !process.env.DATABASE_URL;

    if (USE_MOCK) {
        // console.warn('Using Mock Data for:', text);

        // Mock Users
        if (text.includes('SELECT * FROM users')) {
            return {
                rows: [{
                    id: 'mock-admin-id',
                    username: 'admin',
                    email: 'admin@mcd.gov.in',
                    password_hash: '$2b$10$EpIxNw...', // Mock hash
                    role: 'admin',
                    department: 'IT'
                }],
                rowCount: 1
            };
        }

        // Mock Dashboard/Zones
        if (text.includes('SELECT * FROM parking_zones')) {
            return { rows: [], rowCount: 0 };
        }

        return { rows: [], rowCount: 0 };
    }

    try {
        const start = Date.now();
        const res = await pool.query(text, params);
        return res;
    } catch (error) {
        console.error('Database Error:', error);
        return { rows: [], rowCount: 0 };
    }
};

export const getClient = async () => {
    const client = await pool.connect();
    return client;
};
