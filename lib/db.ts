import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT || 4000),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE || 'minigame_ai',

  ssl: {
    minVersion: 'TLSv1.2',
  },

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});