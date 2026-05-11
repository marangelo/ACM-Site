import mysql from 'mysql2/promise';

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const DB_CONFIG = {
  host: metaEnv.DB_HOST || process.env.DB_HOST || 'db',
  port: parseInt(metaEnv.DB_PORT || process.env.DB_PORT || '3306'),
  user: metaEnv.DB_USER || process.env.DB_USER || 'usr_acm',
  password: metaEnv.DB_PASSWORD || process.env.DB_PASSWORD || 'pwd_acm',
  database: metaEnv.DB_NAME || process.env.DB_NAME || 'db_acm',
  waitForConnections: true,
  connectionLimit: 10,
};

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
  }
  return pool;
}

export async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

export async function getConnection() {
  return getPool().getConnection();
}
