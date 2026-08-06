import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const groupId = body?.groupId;
    const userId = body?.userId;
    if (!groupId || !userId) return NextResponse.json({ error: 'missing groupId or userId' }, { status: 400 });

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

    if (String(group.owner_id) === String(userId)) {
      return NextResponse.json({ error: 'cannot remove owner' }, { status: 400 });
    }

    // remove event_members for events in the group for the removed user
    const { data: groupEvents } = await supabase.from('events').select('id').eq('group_id', groupId);
    const eventIds = (groupEvents ?? []).map((e: any) => e.id);
    if (eventIds.length) {
      await supabase.from('event_members').delete().in('event_id', eventIds).eq('user_id', userId);
    }

    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
