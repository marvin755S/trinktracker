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

    // ensure membership exists
    const { data: membership } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: 'not a member' }, { status: 400 });

    // remove event_members for events in the group for this user
    const { data: groupEvents } = await supabase.from('events').select('id').eq('group_id', groupId);
    const eventIds = (groupEvents ?? []).map((e: any) => e.id);
    if (eventIds.length) {
      await supabase.from('event_members').delete().in('event_id', eventIds).eq('user_id', user.id);
    }
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
