import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Retorna o perfil público de um usuário
 * Contorna RLS para permitir visualização de perfis públicos
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await req.json();
    
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Use service role to bypass RLS and get the user's public profile
    const users = await base44.asServiceRole.entities.User.filter({ email });
    
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const profileUser = users[0];

    // Return only public profile info
    return Response.json({
      id: profileUser.id,
      full_name: profileUser.full_name,
      email: profileUser.email,
      profile_photo_url: profileUser.profile_photo_url || "",
      profession: profileUser.profession || "",
      city: profileUser.city || "",
      state: profileUser.state || "",
      target_position: profileUser.target_position || "",
      preferred_subjects: profileUser.preferred_subjects || [],
      created_date: profileUser.created_date
    });

  } catch (error) {
    console.error('getUserProfile error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
});