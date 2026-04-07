import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    
    // Verify caller is admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader! } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: corsHeaders });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin");
    if (!roles?.length) return new Response(JSON.stringify({ error: "Sem permissão" }), { status: 403, headers: corsHeaders });

    const body = await req.json();
    const { action } = body;

    if (action === "create_single") {
      const { email, password, name, unit, area, role, manager_id } = body;
      if (!email || !password || !name) {
        return new Response(JSON.stringify({ error: "Dados incompletos" }), { status: 400, headers: corsHeaders });
      }
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, unit: unit || "FIEAC", area: area || "" },
      });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
      
      // Set must_change_password to false as requested
      await adminClient.from("profiles").update({ must_change_password: false }).eq("id", data.user.id);
      
      if (role === "gestor" || role === "admin") {
        await adminClient.from("user_roles").insert({ user_id: data.user.id, role });
      }
      if (manager_id) {
        await adminClient.from("profiles").update({ manager_id }).eq("id", data.user.id);
      }
      return new Response(JSON.stringify({ success: true, user_id: data.user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "bulk_create") {
      const { users } = body as { users: Array<{ name: string; email: string; password: string; unit?: string; area?: string; role?: string; manager_email?: string }> };
      if (!users?.length) return new Response(JSON.stringify({ error: "Lista vazia" }), { status: 400, headers: corsHeaders });

      const { data: existingProfiles } = await adminClient.from("profiles").select("id, email");
      const emailToId = new Map<string, string>();
      existingProfiles?.forEach((p: any) => emailToId.set(p.email.toLowerCase(), p.id));

      let success = 0, errors = 0;
      const errorDetails: string[] = [];

      // Process in larger batches for efficiency
      for (let i = 0; i < users.length; i += 50) {
        const batch = users.slice(i, i + 50);
        const results = await Promise.allSettled(
          batch.map(async (u) => {
            try {
              const { data, error } = await adminClient.auth.admin.createUser({
                email: u.email,
                password: u.password,
                email_confirm: true,
                user_metadata: { name: u.name, unit: u.unit || "FIEAC", area: u.area || "" },
              });
              if (error) throw new Error(`${u.email}: ${error.message}`);
              
              await adminClient.from("profiles").update({ must_change_password: false }).eq("id", data.user.id);

              if (u.role === "gestor") {
                await adminClient.from("user_roles").insert({ user_id: data.user.id, role: "gestor" });
              }
              if (u.manager_email) {
                const managerId = emailToId.get(u.manager_email.toLowerCase());
                if (managerId) {
                  await adminClient.from("profiles").update({ manager_id: managerId }).eq("id", data.user.id);
                }
              }
              emailToId.set(u.email.toLowerCase(), data.user.id);
              return true;
            } catch (e: any) {
              throw e;
            }
          })
        );
        for (const r of results) {
          if (r.status === "fulfilled") success++;
          else { errors++; errorDetails.push(r.reason?.message || "Erro desconhecido"); }
        }
      }

      return new Response(JSON.stringify({ success, errors, errorDetails: errorDetails.slice(0, 20) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "clear_all") {
      const protectedEmail = "joao.ferreira@fieac.org.br";
      
      const { data: allUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const toDelete = allUsers?.users?.filter((u: any) => u.email?.toLowerCase() !== protectedEmail) || [];
      
      let deleted = 0, errors = 0;
      for (let i = 0; i < toDelete.length; i += 10) {
        const batch = toDelete.slice(i, i + 10);
        const results = await Promise.allSettled(
          batch.map((u: any) => adminClient.auth.admin.deleteUser(u.id))
        );
        for (const r of results) {
          if (r.status === "fulfilled") deleted++;
          else errors++;
        }
      }

      return new Response(JSON.stringify({ success: true, deleted, errors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "change_role") {
      const { user_id, new_role } = body;
      if (!user_id || !new_role) return new Response(JSON.stringify({ error: "Dados incompletos" }), { status: 400, headers: corsHeaders });
      
      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      
      if (new_role !== "user") {
        await adminClient.from("user_roles").insert({ user_id, role: new_role });
      }
      
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
