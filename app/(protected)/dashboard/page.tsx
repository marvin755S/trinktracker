import { createClient } from "@/lib/supabase-server";
import CreateGroup from "./create-group";


export default async function Dashboard() {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();


  const { data: groups } = await supabase
    .from("group_members")
    .select(`
      role,
      groups!inner (
        id,
        name
      )
    `)
    .eq("user_id", user!.id);


  return (
    <main>

      <h1>Dashboard</h1>


      <h2>Deine Gruppen</h2>


      {groups?.map((item: any) => (
        <div key={item.groups.id}>
          {item.groups.name}
        </div>
      ))}


      <CreateGroup />

    </main>
  );
}