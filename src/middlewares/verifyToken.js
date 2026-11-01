import { jwtVerify } from 'jose';

const JWKS_URL = process.env.JWKS_URL;
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;

let jwksClient = null;

const getJwksClient = async () => {
  if (jwksClient) return jwksClient;
  const { createRemoteJwks } = await import('jose');
  jwksClient = createRemoteJwks(new URL(JWKS_URL));
  return jwksClient;
};

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    const client = await getJwksClient();

    const { payload } = await jwtVerify(token, client, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      clockTolerance: 30,
    });

    req.user = {
      id: payload.sub || payload.userId || payload.id,
      email: payload.email,
      name: payload.name,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};
