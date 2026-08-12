Markdown
# 🎓 Saber+ Business — Sistema de Gestão de T&D e Gamificação

> Plataforma completa de Treinamento & Desenvolvimento (T&D) e Gamificação corporativa focada na gestão de certificados, monitoramento de horas de capacitação e engajamento contínuo de colaboradores do Sistema FIEAC.

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=flat-square&logo=vercel)](https://vercel.com/)

---

## 📌 Sobre o Projeto

O **Saber+ Business** nasceu da necessidade de otimizar a aprovação de horas complementares e certificados de capacitação dos colaboradores da rede. A plataforma substitui fluxos manuais por uma experiência gamificada e intuitiva, permitindo que a liderança monitore o desenvolvimento profissional das equipes em tempo real.

### ✨ Principais Funcionalidades

* 👥 **Gestão Múltipla de Perfis (RBAC):** Níveis de permissão distintos para **Colaboradores**, **Gestores** e **Administradores (Master)**.
* 📜 **Envio e Validação de Certificados:** Submissão simples de comprovantes com fluxo de aprovação e reprovação justificável.
* 📊 **Indicadores e Metas:** Painéis dinâmicos com contagem de horas acumuladas versus metas corporativas estabelecidas.
* 🏆 **Gamificação (Rankings & Badges):** Sistema de conquistas automáticas por níveis de desenvolvimento atingidos e leaderboard entre filiais/setores.
* 🔐 **Segurança e Isolamento:** Autenticação via Supabase Auth integrada com políticas rígidas de acesso a dados (RLS).

---

## 🏗️ Arquitetura e Tecnologias

* **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI / Radix UI, Lucide Icons.
* **Build Tool:** Vite.
* **Backend & Banco de Dados (BaaS):** Supabase (PostgreSQL, Auth e Storage).
* **Deploy e Hosting:** Vercel.

---

## 📂 Estrutura do Projeto

```text
saber-mais-sfieac/
├── public/                 # Recursos estáticos (Logos, Favicons, Imagens)
├── src/
│   ├── components/         # Componentes reutilizáveis de UI (Botões, Modais, Cards)
│   ├── context/            # Provadores de Estado Global (ex: AuthContext)
│   ├── hooks/              # Custom React Hooks
│   ├── integrations/       # Configuração e cliente do Supabase
│   ├── lib/                # Utilitários e helpers
│   ├── pages/              # Páginas da aplicação (Dashboard, Admin, Certificados, Login)
│   └── types/              # Definições de Tipos TypeScript
├── supabase/
│   └── migrations/         # Arquivos SQL de estruturação do banco de dados (Schema e RLS)
├── .env.example            # Exemplo das variáveis de ambiente necessárias
├── package.json            # Dependências e scripts do projeto
└── vite.config.ts          # Configurações do compilador Vite
🚀 Como Executar o Projeto Localmente
Pré-requisitos
Antes de começar, certifique-se de ter instalado no seu computador:

Node.js (versão 18.x ou superior)

npm ou yarn

Uma conta ativa no Supabase

Passo a Passo
Clonar o Repositório:

Bash
git clone [https://github.com/jovix10/saber-mais-sfieac.git](https://github.com/jovix10/saber-mais-sfieac.git)
cd saber-mais-sfieac
Instalar as Dependências:

Bash
npm install
Configurar as Variáveis de Ambiente:
Crie um arquivo .env na raiz do projeto baseado no arquivo de exemplo e preencha com as suas chaves do Supabase:

Snippet de código
SUPABASE_URL="[https://seu-projeto.supabase.co](https://seu-projeto.supabase.co)"
SUPABASE_PUBLISHABLE_KEY="sua-chave-anon-publica"
VITE_SUPABASE_URL="[https://seu-projeto.supabase.co](https://seu-projeto.supabase.co)"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-chave-anon-publica"
VITE_SUPABASE_PROJECT_ID="seu-id-de-projeto"
Configurar o Banco de Dados (Supabase):

Abra o painel do Supabase no projeto de sua escolha.

Vá em SQL Editor (>_).

Execute na ordem cronológica os arquivos contidos na pasta ./supabase/migrations/ para gerar a estrutura de tabelas (profiles, user_roles, certificates, etc.).

Iniciar o Servidor de Desenvolvimento:

Bash
npm run dev
Acesse a aplicação no seu navegador através do endereço http://localhost:5173.

👑 Configurando o Primeiro Usuário Administrador (Master)
Como o banco de dados inicia sem registros padrão:

Registre um novo usuário através da interface gráfica ou na aba Authentication > Users do Supabase.

Copie o User UID gerado.

No Table Editor do Supabase:

Insira um perfil correspondente na tabela profiles associado ao seu UID.

Vá na tabela user_roles, crie uma linha vinculando o seu user_id e defina a coluna role como admin.

Faça logout e entre novamente na aplicação para liberar o menu administrativo completo.

🛠️ Scripts Disponíveis
No diretório do projeto, você pode executar:

npm run dev: Inicia o servidor local de desenvolvimento com Hot Reload.

npm run build: Compila e otimiza a aplicação em código de produção na pasta dist/.

npm run preview: Visualiza localmente a versão compilada de produção.

npm run lint: Executa a verificação estática do código para identificar erros de sintaxe e estilo.

☁️ Deploy na Vercel
O projeto está configurado para Deploy Contínuo (CI/CD) via Vercel:

Importe o repositório do GitHub no painel da Vercel.

Defina as Variáveis de Ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY) nas configurações do projeto.

Toda alteração enviada para a branch main via git push disparará um novo build automático.

📝 Licença
Este projeto foi desenvolvido por João Vitor Ferreira no âmbito de projetos corporativos e acadêmicos voltados à modernização de processos do Sistema FIEAC. Todos os direitos reservados.

Developed with 💙 by João Vitor (jovix10)
