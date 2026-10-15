import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  // Trata verificação prévia do navegador (CORS Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "A chave SUPABASE_SERVICE_ROLE_KEY não está configurada nos Secrets do Supabase." }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const body = await req.json()
    const action = body.action || 'create_single'

    // ==========================================
    // 1. CRIAR USUÁRIO INDIVIDUAL
    // ==========================================
    if (action === 'create_single') {
      const email = body.email
      const password = body.password
      const name = body.name || body.full_name || ''
      const unit = body.unit || 'FIEAC'
      const area = body.area || body.department || ''
      const role = body.role || 'user'
      const manager_id = body.manager_id || null

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "E-mail e senha são obrigatórios." }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, unit, area }
      })

      if (authError) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const userId = authData.user.id

      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        name: name,
        email: email,
        unit: unit,
        area: area,
        total_hours: 0,
        manager_id: manager_id,
        visible_in_ranking: true,
      })

      // Se for gestor ou admin salva em user_roles
      if (role && role !== 'user') {
        await supabaseAdmin.from('user_roles').upsert({
          user_id: userId,
          role: role
        })
      }

      return new Response(
        JSON.stringify({ message: "Usuário cadastrado com sucesso!", user: authData.user }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ==========================================
    // 2. ALTERAR CARGO (Permite rebaixar para Colaborador)
    // ==========================================
    if (action === 'change_role') {
      const { user_id, new_role } = body
      if (!user_id || !new_role) {
        return new Response(
          JSON.stringify({ error: "user_id e new_role são obrigatórios." }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (new_role === 'user') {
        // Se voltar para colaborador comum, remove qualquer registro especial de user_roles
        await supabaseAdmin.from('user_roles').delete().eq('user_id', user_id)
      } else {
        // Se for promovido para gestor ou admin, atualiza ou insere
        const { error: roleErr } = await supabaseAdmin
          .from('user_roles')
          .upsert({ user_id, role: new_role }, { onConflict: 'user_id' })

        if (roleErr) {
          // Fallback caso a constraint seja composta
          await supabaseAdmin.from('user_roles').delete().eq('user_id', user_id)
          await supabaseAdmin.from('user_roles').insert({ user_id, role: new_role })
        }
      }

      return new Response(
        JSON.stringify({ message: "Cargo atualizado com sucesso!" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ==========================================
    // 3. EXCLUIR USUÁRIO INDIVIDUAL
    // ==========================================
    if (action === 'delete_single') {
      const { user_id } = body
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id é obrigatório para exclusão." }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Protege contra exclusão acidental do admin principal
      const { data: userTarget } = await supabaseAdmin.auth.admin.getUserById(user_id)
      if (userTarget?.user?.email === 'joao.ferreira@fieac.org.br') {
        return new Response(
          JSON.stringify({ error: "Não é permitido excluir a conta do administrador principal." }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 1. Remove papéis e referências
      await supabaseAdmin.from('user_roles').delete().eq('user_id', user_id)
      // Se era gestor de outros colaboradores, desvincula os liderados
      await supabaseAdmin.from('profiles').update({ manager_id: null }).eq('manager_id', user_id)
      // 2. Remove da tabela pública de perfis
      await supabaseAdmin.from('profiles').delete().eq('id', user_id)
      // 3. Exclui a conta do Supabase Auth
      const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(user_id)

      if (delAuthErr) {
        return new Response(
          JSON.stringify({ error: `Erro ao excluir do Auth: ${delAuthErr.message}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: "Colaborador excluído com sucesso!" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ==========================================
    // 4. CADASTRO EM MASSA (BULK_CREATE)
    // ==========================================
    if (action === 'bulk_create') {
      const users = body.users || []
      let success = 0
      let errors = 0
      let skipped = 0
      const errorDetails: string[] = []

      for (const u of users) {
        try {
          const { data: created, error: crtErr } = await supabaseAdmin.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { name: u.name, unit: u.unit, area: u.area }
          })

          if (crtErr) {
            if (crtErr.message.includes("already registered") || crtErr.message.includes("unique")) {
              skipped++
            } else {
              errors++
              errorDetails.push(`${u.email}: ${crtErr.message}`)
            }
            continue
          }

          const uid = created.user.id
          await supabaseAdmin.from('profiles').upsert({
            id: uid,
            name: u.name,
            email: u.email,
            unit: u.unit || 'FIEAC',
            area: u.area || '',
            total_hours: 0,
            visible_in_ranking: true
          })

          if (u.role && u.role !== 'user') {
            await supabaseAdmin.from('user_roles').upsert({
              user_id: uid,
              role: u.role
            })
          }

          success++
        } catch (e: any) {
          errors++
          errorDetails.push(`${u.email}: ${e.message}`)
        }
      }

      return new Response(
        JSON.stringify({ success, errors, skipped, errorDetails }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ==========================================
    // 5. LIMPAR TODOS OS USUÁRIOS (CLEAR_ALL)
    // ==========================================
    if (action === 'clear_all') {
      const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      let deleted = 0
      if (allUsers?.users) {
        for (const u of allUsers.users) {
          if (u.email === 'joao.ferreira@fieac.org.br') continue
          await supabaseAdmin.auth.admin.deleteUser(u.id)
          deleted++
        }
      }
      return new Response(
        JSON.stringify({ message: "Usuários removidos com sucesso.", deleted }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ==========================================
    // 6. ENTRAR NA CONTA DO USUÁRIO (IMPERSONATE)
    // ==========================================
    if (action === 'impersonate_user') {
      const { user_id } = body
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id é obrigatório." }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id)

      if (getUserError || !userData?.user?.email) {
        return new Response(
          JSON.stringify({ error: "Usuário não encontrado na base de dados do Auth." }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const origin = req.headers.get('origin') || 'http://54.232.189.113:8080'
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.user.email,
        options: {
          redirectTo: `${origin}/`
        }
      })

      if (linkError) {
        return new Response(
          JSON.stringify({ error: `Erro no Auth Supabase: ${linkError.message}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          message: "Link gerado com sucesso!", 
          url: linkData?.properties?.action_link 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: `Ação "${action}" desconhecida.` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno no servidor' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})