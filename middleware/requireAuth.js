const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication token is required"
        });
    }

    const token = authorization.slice("Bearer ".length);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        if (!payload.userId) {
            return res.status(401).json({
                message: "Invalid authentication token"
            });
        }

        req.auth = {
            userId: payload.userId,
            sessionId: payload.sessionId || null
        };

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired authentication token"
        });
    }
}

module.exports = requireAuth;