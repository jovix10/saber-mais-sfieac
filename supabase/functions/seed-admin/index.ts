import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const email = "joao.ferreira@fieac.org.br";
  const password = "João@4514232";

  // Check if user exists
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const existing = users?.find(u => u.email === email);

  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "João Ferreira", unit: "FIEAC", area: "Diretoria" },
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    userId = data.user.id;
  }

  // Ensure admin role
  const { error: roleError } = await supabaseAdmin.from("user_roles").upsert(
    { user_id: userId, role: "admin" },
    { onConflict: "user_id,role" }
  );

  return new Response(
    JSON.stringify({ success: true, userId, message: "Super-admin configured" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
