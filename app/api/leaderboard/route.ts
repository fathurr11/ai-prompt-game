import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Path koneksi database TiDB Cloud / MySQL Anda

// 1. GET: Mengambil seluruh riwayat leaderboard diurutkan dari yang TERBARU
export async function GET() {
  try {
    const [rows] = await db.query(
      'SELECT id, player_name, game_mode, score, created_at FROM leaderboard ORDER BY id DESC'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error GET leaderboard:', error);
    return NextResponse.json({ error: 'Gagal mengambil data leaderboard' }, { status: 500 });
  }
}

// 2. POST: Menyimpan riwayat bermain baru sebagai log sesi (INSERT)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { playerName, gameMode, score } = body;

    if (!playerName || !gameMode) {
      return NextResponse.json(
        { error: 'Nama player dan mode game wajib diisi' },
        { status: 400 }
      );
    }

    // Selalu simpan sebagai baris riwayat baru (INSERT)
    const [result] = await db.query(
      'INSERT INTO leaderboard (player_name, game_mode, score, created_at) VALUES (?, ?, ?, NOW())',
      [playerName.trim(), gameMode, score]
    );

    return NextResponse.json({
      message: 'Skor dan riwayat sesi berhasil dicatat!',
      result
    });
  } catch (error) {
    console.error('Error POST leaderboard:', error);
    return NextResponse.json({ error: 'Gagal menyimpan skor ke database' }, { status: 500 });
  }
}

// 3. DELETE: Menghapus seluruh riwayat data leaderboard (Reset Leaderboard)
export async function DELETE() {
  try {
    await db.query('DELETE FROM leaderboard');
    
    return NextResponse.json({
      message: 'Seluruh riwayat leaderboard berhasil di-reset!'
    });
  } catch (error) {
    console.error('Error DELETE leaderboard:', error);
    return NextResponse.json({ error: 'Gagal menghapus data leaderboard' }, { status: 500 });
  }
}