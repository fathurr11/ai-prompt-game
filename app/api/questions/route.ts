import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Ambil soal
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get('game_type');

    let query = 'SELECT * FROM questions ORDER BY id DESC';
    let params: any[] = [];

    if (gameType) {
      query = 'SELECT * FROM questions WHERE game_type = ? ORDER BY id ASC';
      params = [gameType];
    }

    const [rows] = await db.query(query, params);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Tambah soal baru (CRUD Admin)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      game_type,
      title,
      material,
      scenario,
      image_url,
      option_a,
      option_b,
      option_c,
      correct_option,
      explanation,
      default_prompt_to_test,
      timer_seconds,
    } = body;

    const query = `
      INSERT INTO questions 
      (game_type, title, material, scenario, image_url, option_a, option_b, option_c, correct_option, explanation, default_prompt_to_test, timer_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result]: any = await db.query(query, [
      game_type,
      title,
      material || '',
      scenario,
      image_url || '',
      option_a,
      option_b,
      option_c,
      correct_option,
      explanation,
      default_prompt_to_test || '',
      timer_seconds || 20,
    ]);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update soal (CRUD Admin)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      game_type,
      title,
      material,
      scenario,
      image_url,
      option_a,
      option_b,
      option_c,
      correct_option,
      explanation,
      default_prompt_to_test,
      timer_seconds,
    } = body;

    const query = `
      UPDATE questions 
      SET game_type=?, title=?, material=?, scenario=?, image_url=?, option_a=?, option_b=?, option_c=?, correct_option=?, explanation=?, default_prompt_to_test=?, timer_seconds=?
      WHERE id=?
    `;

    await db.query(query, [
      game_type,
      title,
      material,
      scenario,
      image_url,
      option_a,
      option_b,
      option_c,
      correct_option,
      explanation,
      default_prompt_to_test,
      timer_seconds,
      id,
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus soal (CRUD Admin)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await db.query('DELETE FROM questions WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}