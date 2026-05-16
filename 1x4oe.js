async function checkAuth() {
    const token = localStorage.getItem('session_token');
    if (!token) return null;

    const { data: session, error } = await supabase
        .from('sessions')
        .select('*, accounts(*)')
        .eq('token', token)
        .single();

    if (error || !session || new Date(session.expires_at) < new Date()) {
        localStorage.removeItem('session_token');
        return null;
    }

    if (session.accounts.banned) {
        localStorage.removeItem('session_token');
        window.location.href = '/login.html?banned=1';
        return null;
    }

    return session.accounts;
}

async function requireAuth() {
    const user = await checkAuth();
    if (!user) {
        window.location.href = '/login.html';
        return null;
    }
    return user;
}

async function requireAdmin() {
    const user = await requireAuth();
    if (!user) return null;
    if (user.role !== 'admin' && user.role !== 'owner') {
        window.location.href = '/index.html';
        return null;
    }
    return user;
}

function checkBanStatus(user) {
    if (!user) return false;
    if (user.banned) {
        localStorage.removeItem('session_token');
        window.location.reload();
        return true;
    }
    return false;
}

async function getIP() {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
}

function getHWID() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillText('hwid', 10, 10);
    const dataURL = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataURL.length; i++) {
        const char = dataURL.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
}

function canChangeUsername(lastChange) {
    if (!lastChange) return true;
    const week = 7 * 24 * 60 * 60 * 1000;
    return new Date() - new Date(lastChange) > week;
}

function canChangePassword(lastChange) {
    if (!lastChange) return true;
    const day = 24 * 60 * 60 * 1000;
    return new Date() - new Date(lastChange) > day;
}

function validateUsername(username) {
    if (username.length < 4 || username.length > 15) return false;
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
    return true;
}
