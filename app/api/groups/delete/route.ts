import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const groupId = body?.groupId;
    if (!groupId) return NextResponse.json({ error: 'missing groupId' }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

    // verify ownership
    const { data: group, error: gErr } = await supabase.from('groups').select('id, owner_id').eq('id', groupId).single();
    if (gErr || !group) return NextResponse.json({ error: 'group not found' }, { status: 404 });

    if (String(group.owner_id) !== String(user.id)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
