import { AuthService } from '../services/authService.js';

export function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
    } else if (req.query && req.query.token) {
        token = req.query.token;
    } else if (req.headers.cookie) {
        const match = req.headers.cookie.match(/zeno_session=([^;]+)/);
        if (match) token = match[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const user = AuthService.validateSession(token);
    if (!user) {
        return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    req.user = user;
    req.token = token;
    next();
}

export function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
    } else if (req.query && req.query.token) {
        token = req.query.token;
    } else if (req.headers.cookie) {
        const match = req.headers.cookie.match(/zeno_session=([^;]+)/);
        if (match) token = match[1];
    }

    if (token) {
        const user = AuthService.validateSession(token);
        if (user) {
            req.user = user;
            req.token = token;
        }
    }

    next();
}
