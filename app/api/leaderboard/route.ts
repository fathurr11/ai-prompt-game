import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { db } from '@/lib/db';

const dbPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'minigame_ai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function ensureTableExists() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id INT AUTO_INCREMENT PRIMARY KEY,
        player_name VARCHAR(100) NOT NULL,
        avatar VARCHAR(20) DEFAULT '🤖',
        game_mode VARCHAR(100) NOT NULL,
        score INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Tambah kolom avatar jika belum ada di tabel lama
    const [cols]: any = await db.query(`SHOW COLUMNS FROM leaderboard LIKE 'avatar'`);
    if (cols.length === 0) {
      await db.query(`ALTER TABLE leaderboard ADD COLUMN avatar VARCHAR(20) DEFAULT '🤖' AFTER player_name`);
    }
  } catch (err) {
    console.error('Error saat memastikan tabel:', err);
  }
}

export async function GET() {
  try {
    await ensureTableExists();
    const [rows]: any = await db.query(
      'SELECT player_name, avatar, game_mode, score FROM leaderboard ORDER BY score DESC'
    );
    return NextResponse.json(rows || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTableExists();
    const { playerName, avatar, gameMode, score } = await req.json();

    if (!playerName || !gameMode) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const cleanName = playerName.trim();
    const playerAvatar = avatar || '🤖';
    const numericScore = Number(score) || 0;

    const [existing]: any = await db.query(
      'SELECT id, score FROM leaderboard WHERE LOWER(player_name) = LOWER(?) AND game_mode = ?',
      [cleanName, gameMode]
    );

    if (existing && existing.length > 0) {
      if (numericScore > existing[0].score) {
        await db.query(
          'UPDATE leaderboard SET score = ?, avatar = ? WHERE id = ?',
          [numericScore, playerAvatar, existing[0].id]
        );
      }
    } else {
      await db.query(
        'INSERT INTO leaderboard (player_name, avatar, game_mode, score) VALUES (?, ?, ?, ?)',
        [cleanName, playerAvatar, gameMode, numericScore]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}