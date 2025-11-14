import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createClient } from 'npm:@supabase/supabase-js@2.38.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_KEY");
        
        if (!supabaseUrl || !supabaseKey) {
            return Response.json({ error: 'Supabase configuration missing' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { method } = req;
        
        // Parse body for POST/PUT/DELETE, query params for GET
        let requestData = {};
        if (method === 'GET') {
            const url = new URL(req.url);
            requestData.question_id = url.searchParams.get('question_id');
        } else {
            const body = await req.json().catch(() => ({}));
            requestData = body;
        }

        switch (method) {
            case 'GET': {
                const { question_id } = requestData;
                
                if (!question_id) {
                    return Response.json({ error: 'question_id is required' }, { status: 400 });
                }

                const { data, error } = await supabase
                    .from('comments')
                    .select('*')
                    .eq('question_id', question_id)
                    .order('created_date', { ascending: false });

                if (error) {
                    console.error('Supabase error:', error);
                    throw error;
                }

                return Response.json({ success: true, comments: data || [] });
            }

            case 'POST': {
                const { question_id, comment_text } = requestData;
                
                if (!question_id || !comment_text) {
                    return Response.json({ error: 'question_id and comment_text are required' }, { status: 400 });
                }

                const newComment = {
                    question_id,
                    comment_text,
                    user_name: user.full_name || user.email,
                    user_email: user.email,
                    user_city: user.city || null,
                    user_photo: user.profile_photo_url || null
                };

                const { data, error } = await supabase
                    .from('comments')
                    .insert([newComment])
                    .select()
                    .single();

                if (error) {
                    console.error('Supabase insert error:', error);
                    throw error;
                }

                return Response.json({ success: true, comment: data });
            }

            case 'PUT': {
                const { comment_id, action, comment_text } = requestData;
                
                if (!comment_id) {
                    return Response.json({ error: 'comment_id is required' }, { status: 400 });
                }

                if (action === 'like') {
                    // Buscar comentário atual
                    const { data: comment, error: fetchError } = await supabase
                        .from('comments')
                        .select('liked_by_users, likes_count')
                        .eq('id', comment_id)
                        .single();

                    if (fetchError) {
                        console.error('Fetch comment error:', fetchError);
                        throw fetchError;
                    }

                    const likedUsers = comment.liked_by_users || [];
                    const userHasLiked = likedUsers.includes(user.email);

                    let updatedLikedUsers, updatedLikesCount;

                    if (userHasLiked) {
                        updatedLikedUsers = likedUsers.filter(email => email !== user.email);
                        updatedLikesCount = Math.max(0, (comment.likes_count || 0) - 1);
                    } else {
                        updatedLikedUsers = [...likedUsers, user.email];
                        updatedLikesCount = (comment.likes_count || 0) + 1;
                    }

                    const { data, error } = await supabase
                        .from('comments')
                        .update({
                            liked_by_users: updatedLikedUsers,
                            likes_count: updatedLikesCount
                        })
                        .eq('id', comment_id)
                        .select()
                        .single();

                    if (error) {
                        console.error('Update like error:', error);
                        throw error;
                    }
                    
                    return Response.json({ success: true, comment: data });

                } else if (action === 'edit') {
                    if (!comment_text) {
                        return Response.json({ error: 'comment_text is required for edit' }, { status: 400 });
                    }

                    const { data, error } = await supabase
                        .from('comments')
                        .update({ 
                            comment_text, 
                            updated_date: new Date().toISOString() 
                        })
                        .eq('id', comment_id)
                        .eq('user_email', user.email)
                        .select()
                        .single();

                    if (error) {
                        console.error('Update comment error:', error);
                        throw error;
                    }
                    
                    return Response.json({ success: true, comment: data });

                } else if (action === 'report') {
                    const { data, error } = await supabase
                        .from('comments')
                        .update({ is_reported: true })
                        .eq('id', comment_id)
                        .select()
                        .single();

                    if (error) {
                        console.error('Report comment error:', error);
                        throw error;
                    }
                    
                    return Response.json({ success: true, comment: data });
                }

                return Response.json({ error: 'Invalid action' }, { status: 400 });
            }

            case 'DELETE': {
                const { comment_id } = requestData;
                
                if (!comment_id) {
                    return Response.json({ error: 'comment_id is required' }, { status: 400 });
                }

                const { error } = await supabase
                    .from('comments')
                    .delete()
                    .eq('id', comment_id)
                    .eq('user_email', user.email);

                if (error) {
                    console.error('Delete comment error:', error);
                    throw error;
                }
                
                return Response.json({ success: true });
            }

            default:
                return Response.json({ error: 'Method not allowed' }, { status: 405 });
        }
    } catch (error) {
        console.error('Supabase comments error:', error);
        return Response.json({ 
            error: error.message || 'Internal server error',
            details: error.details || null
        }, { status: 500 });
    }
});