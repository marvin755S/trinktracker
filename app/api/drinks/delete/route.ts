import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body?.id);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });

    const { error } = await supabase.from('drinks').delete().eq('id', id).eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
