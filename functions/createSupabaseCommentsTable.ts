import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.email !== 'conectadoemconcursos@gmail.com') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sqlScript = `
-- Criar tabela de comentários
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_city TEXT,
    user_photo TEXT,
    likes_count INTEGER DEFAULT 0,
    is_reported BOOLEAN DEFAULT false,
    liked_by_users TEXT[] DEFAULT '{}',
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_comments_question_id ON comments(question_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_email ON comments(user_email);
CREATE INDEX IF NOT EXISTS idx_comments_created_date ON comments(created_date DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para todos
CREATE POLICY IF NOT EXISTS "Anyone can read comments" ON comments
    FOR SELECT USING (true);

-- Política para permitir inserção para usuários autenticados
CREATE POLICY IF NOT EXISTS "Users can insert comments" ON comments
    FOR INSERT WITH CHECK (true);

-- Política para permitir atualização apenas do próprio comentário
CREATE POLICY IF NOT EXISTS "Users can update own comments" ON comments
    FOR UPDATE USING (user_email = auth.jwt() ->> 'email');

-- Política para permitir exclusão apenas do próprio comentário
CREATE POLICY IF NOT EXISTS "Users can delete own comments" ON comments
    FOR DELETE USING (user_email = auth.jwt() ->> 'email');
        `;

        return Response.json({ 
            success: true, 
            message: "Execute este SQL no seu painel do Supabase",
            sql: sqlScript 
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});