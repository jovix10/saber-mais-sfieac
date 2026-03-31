import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: { user: caller } } = await supabase.auth.getUser(authHeader);
    if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const { user_id } = await req.json();
    if (!user_id) return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: corsHeaders });

    // Generate a magic link / get user info for impersonation
    // We'll generate a one-time link the admin can open in a new tab
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: "",
      options: {},
    });

    // Alternative: just get user email and use signInWithPassword isn't possible
    // Instead, let's get the user details and create a sign-in link
    const { data: targetUser, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !targetUser?.user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.user.email!,
    });

    if (linkError || !linkData) {
      return new Response(JSON.stringify({ error: linkError?.message || "Failed to generate link" }), { status: 500, headers: corsHeaders });
    }

    // The hashed_token can be used to construct the verification URL
    const redirectUrl = `${supabaseUrl}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=magiclink&redirect_to=${req.headers.get("origin") || supabaseUrl}`;

    return new Response(JSON.stringify({ url: redirectUrl, email: targetUser.user.email }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
