async function createForum(authorId, title, content, imageUrls = [], tags = []) {
    if (title.length > 50) throw new Error('Тема не может превышать 50 символов');
    if (content.length > 2000) throw new Error('Текст не может превышать 2000 символов');

    const { data, error } = await supabase
        .from('forums')
        .insert({
            author_id: authorId,
            title,
            content,
            image_urls: imageUrls,
            tags
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function getForums(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
        .from('forums')
        .select('*, accounts(username, role)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw error;
    return { forums: data, total: count };
}

async function getRecentForums(limit = 5) {
    const { data, error } = await supabase
        .from('forums')
        .select('*, accounts(username, role)')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

async function getForumById(id) {
    const { data, error } = await supabase
        .from('forums')
        .select('*, accounts(username, role)')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

async function searchForums(query) {
    const { data, error } = await supabase
        .from('forums')
        .select('*, accounts(username, role)')
        .or(`title.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

async function deleteForum(forumId) {
    const { error } = await supabase
        .from('forums')
        .delete()
        .eq('id', forumId);

    if (error) throw error;
}

async function createComment(forumId, authorId, content) {
    const { data, error } = await supabase
        .from('comments')
        .insert({
            forum_id: forumId,
            author_id: authorId,
            content
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function getComments(forumId) {
    const { data, error } = await supabase
        .from('comments')
        .select('*, accounts(username, role)')
        .eq('forum_id', forumId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
}

async function deleteComment(commentId) {
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

    if (error) throw error;
}

async function likeForum(forumId, accountId) {
    const { data: existing } = await supabase
        .from('likes')
        .select()
        .eq('forum_id', forumId)
        .eq('account_id', accountId)
        .single();

    if (existing) {
        await supabase
            .from('likes')
            .delete()
            .eq('forum_id', forumId)
            .eq('account_id', accountId);
        return false;
    } else {
        await supabase
            .from('likes')
            .insert({ forum_id: forumId, account_id: accountId });
        return true;
    }
}

async function getLikesCount(forumId) {
    const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('forum_id', forumId);

    if (error) throw error;
    return count;
}

async function getAccountCount() {
    const { count, error } = await supabase
        .from('accounts')
        .select('*', { count: 'exact' });

    if (error) throw error;
    return count;
}

async function getProfile(userId) {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
}

async function getForumsByUser(userId) {
    const { data, error } = await supabase
        .from('forums')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
