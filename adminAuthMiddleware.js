import { AuthService } from '../services/authService.js';
import { query, get } from '../db/database.js';
import { SecurityEventService } from '../services/securityEventService.js';

export const ADMIN_ROLES = new Set([
    'super-admin',
    'admin',
    'security-admin',
    'support-admin',
    'billing-admin',
    'analyst'
]);

/**
 * Fetch all granular permissions for a given user
 */
export function getUserPermissions(userId, role) {
    if (role === 'super-admin') {
        return new Set(['*']);
    }

    const permissions = new Set();

    // 1. Get role from user_roles or fallback to users.role
    const userRoleRows = query(`
        SELECT r.name as role_name, p.name as permission_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ?
    `, [userId]);

    for (const row of userRoleRows) {
        permissions.add(row.permission_name);
    }

    // Also map based on direct role string in users table
    if (role) {
        const directRolePerms = query(`
            SELECT p.name as permission_name
            FROM roles r
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE r.name = ?
        `, [role]);

        for (const row of directRolePerms) {
            permissions.add(row.permission_name);
        }
    }

    return permissions;
}

/**
 * Middleware ensuring caller has an administrative role
 */
export function requireAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
    } else if (req.headers.cookie) {
        const match = req.headers.cookie.match(/zeno_session=([^;]+)/);
        if (match) token = match[1];
    }

    if (!token) {
        return res.status(401).json({
            error: {
                code: 'AUTHENTICATION_ERROR',
                message: 'Administrator authentication required.',
                requestId: req.id || req.headers['x-request-id']
            }
        });
    }

    const user = AuthService.validateSession(token);
    if (!user) {
        return res.status(401).json({
            error: {
                code: 'AUTHENTICATION_ERROR',
                message: 'Invalid or expired administrative session.',
                requestId: req.id || req.headers['x-request-id']
            }
        });
    }

    // Check if user has an authorized administrative role
    if (!ADMIN_ROLES.has(user.role)) {
        SecurityEventService.recordSecurityEvent({
            eventType: 'unauthorized_admin_portal_access',
            severity: 'medium',
            userId: user.id,
            req,
            details: { role: user.role, email: user.email }
        });

        return res.status(403).json({
            error: {
                code: 'FORBIDDEN_ERROR',
                message: 'Access restricted. Administrator privileges required.',
                requestId: req.id || req.headers['x-request-id']
            }
        });
    }

    const permissions = getUserPermissions(user.id, user.role);

    req.user = user;
    req.token = token;
    req.admin = {
        role: user.role,
        permissions,
        isSuperAdmin: user.role === 'super-admin' || permissions.has('*')
    };

    next();
}

/**
 * Middleware requiring a specific granular permission
 */
export function requirePermission(permissionName) {
    return (req, res, next) => {
        requireAdmin(req, res, () => {
            const { permissions, isSuperAdmin } = req.admin;

            if (isSuperAdmin || permissions.has('*') || permissions.has(permissionName)) {
                return next();
            }

            SecurityEventService.recordSecurityEvent({
                eventType: 'privilege_escalation_attempt',
                severity: 'high',
                userId: req.user.id,
                req,
                details: {
                    attemptedPermission: permissionName,
                    userRole: req.admin.role
                }
            });

            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN_ERROR',
                    message: `Permission denied: '${permissionName}' required.`,
                    requestId: req.id || req.headers['x-request-id']
                }
            });
        });
    };
}
