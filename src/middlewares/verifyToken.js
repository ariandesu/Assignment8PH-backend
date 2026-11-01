import { jwtVerify, createRemoteJWKSet } from 'jose';

// JWKS is published by Better Auth's JWT plugin on the Next.js app:
//   <frontend-url>/api/auth/jwks
const JWKS_URL = process.env.JWKS_URL;
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;

let jwks = null;

const getJwks = () => {
  if (!JWKS_URL) {
    throw new Error('JWKS_URL environment variable is not set');
  }
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwks;
};

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const options = { clockTolerance: 30 };
    if (JWT_ISSUER) options.issuer = JWT_ISSUER;
    if (JWT_AUDIENCE) options.audience = JWT_AUDIENCE;

    const { payload } = await jwtVerify(token, getJwks(), options);

    const id = payload.sub || payload.id;
    if (!id || !payload.email) {
      return res.status(401).json({ success: false, message: 'Invalid token payload.' });
    }

    req.user = {
      id: String(id),
      email: payload.email,
      name: payload.name,
      image: payload.image,
    };

    next();
  } catch (err) {
    const expired = err?.code === 'ERR_JWT_EXPIRED';
    if (!expired && process.env.NODE_ENV === 'development') {
      console.warn('JWT verification failed:', err?.code || err?.message);
    }
    return res.status(401).json({
      success: false,
      message: expired ? 'Session expired. Please log in again.' : 'Invalid or expired token.',
    });
  }
};
