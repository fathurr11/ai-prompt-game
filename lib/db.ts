import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: 'localhost',
  user: 'root', // Default Laragon
  password: '', // Default Laragon kosong
  database: 'minigame_ai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});