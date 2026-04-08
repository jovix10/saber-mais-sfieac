import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Não autenticado" }, 401);

    // Extract token - handle both "Bearer <token>" and raw token
    const token = authHeader.replace("Bearer ", "");

    // Verify caller is admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser(token);
    console.log("Auth check:", { hasToken: !!token, caller: caller?.email, authError: authError?.message });
    if (!caller) return jsonResponse({ error: "Não autenticado" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin");
    if (!roles?.length) return jsonResponse({ error: "Sem permissão" }, 403);

    const body = await req.json();
    const { action } = body;

    if (action === "create_single") {
      const { email, password, name, unit, area, role, manager_id } = body;
      if (!email || !password || !name) {
        return jsonResponse({ error: "Dados incompletos" }, 400);
      }
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, unit: unit || "FIEAC", area: area || "" },
      });
      if (error) return jsonResponse({ error: error.message }, 400);

      // Wait for trigger to create profile, then update
      await new Promise(r => setTimeout(r, 500));
      await adminClient.from("profiles").update({ must_change_password: true }).eq("id", data.user.id);

      if (role === "gestor" || role === "admin") {
        await adminClient.from("user_roles").insert({ user_id: data.user.id, role });
      }
      if (manager_id) {
        await adminClient.from("profiles").update({ manager_id }).eq("id", data.user.id);
      }
      return jsonResponse({ success: true, user_id: data.user.id });
    }

    if (action === "bulk_create") {
      const { users } = body as { users: Array<{ name: string; email: string; password: string; unit?: string; area?: string; role?: string; manager_email?: string }> };
      if (!users?.length) return jsonResponse({ error: "Lista vazia" }, 400);

      // Get existing profiles for manager mapping AND duplicate detection
      const { data: existingProfiles } = await adminClient.from("profiles").select("id, email");
      const emailToId = new Map<string, string>();
      const existingEmails = new Set<string>();
      existingProfiles?.forEach((p: any) => {
        if (p.email) {
          const lower = p.email.toLowerCase().trim();
          emailToId.set(lower, p.id);
          existingEmails.add(lower);
        }
      });

      let success = 0, errors = 0, skipped = 0;
      const errorDetails: string[] = [];

      // Process sequentially in small batches to avoid rate limits
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        try {
          if (!u.email || !u.name || !u.password) {
            errors++;
            errorDetails.push(`Linha ${i + 1}: dados incompletos`);
            continue;
          }

          // Skip already registered emails
          if (existingEmails.has(u.email.toLowerCase().trim())) {
            skipped++;
            continue;
          }

          const { data, error } = await adminClient.auth.admin.createUser({
            email: u.email.trim(),
            password: u.password.trim(),
            email_confirm: true,
            user_metadata: { name: u.name.trim(), unit: u.unit?.trim() || "FIEAC", area: u.area?.trim() || "" },
          });

          if (error) {
            errors++;
            errorDetails.push(`${u.email}: ${error.message}`);
            continue;
          }

          // Small delay to let trigger fire
          await new Promise(r => setTimeout(r, 200));
          await adminClient.from("profiles").update({ must_change_password: true }).eq("id", data.user.id);

          if (u.role === "gestor") {
            await adminClient.from("user_roles").insert({ user_id: data.user.id, role: "gestor" });
          }
          if (u.manager_email) {
            const managerId = emailToId.get(u.manager_email.toLowerCase().trim());
            if (managerId) {
              await adminClient.from("profiles").update({ manager_id: managerId }).eq("id", data.user.id);
            }
          }
          emailToId.set(u.email.toLowerCase().trim(), data.user.id);
          success++;
        } catch (e: any) {
          errors++;
          errorDetails.push(`${u.email}: ${e.message || "Erro desconhecido"}`);
        }
      }

      return jsonResponse({ success, errors, errorDetails: errorDetails.slice(0, 30) });
    }

    if (action === "clear_all") {
      const protectedEmail = "joao.ferreira@fieac.org.br";

      let allUsers: any[] = [];
      let page = 1;
      while (true) {
        const { data } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
        if (!data?.users?.length) break;
        allUsers = allUsers.concat(data.users);
        if (data.users.length < 1000) break;
        page++;
      }

      const toDelete = allUsers.filter((u: any) => u.email?.toLowerCase() !== protectedEmail);

      let deleted = 0, delErrors = 0;
      for (const u of toDelete) {
        try {
          const { error } = await adminClient.auth.admin.deleteUser(u.id);
          if (error) delErrors++;
          else deleted++;
        } catch {
          delErrors++;
        }
      }

      return jsonResponse({ success: true, deleted, errors: delErrors });
    }

    if (action === "change_role") {
      const { user_id, new_role } = body;
      if (!user_id || !new_role) return jsonResponse({ error: "Dados incompletos" }, 400);

      await adminClient.from("user_roles").delete().eq("user_id", user_id);

      if (new_role !== "user") {
        await adminClient.from("user_roles").insert({ user_id, role: new_role });
      }

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Ação inválida" }, 400);
  } catch (err: any) {
    console.error("admin-create-user error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
