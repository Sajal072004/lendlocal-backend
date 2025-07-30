import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * Generates a JSON Web Token.
 * @param userId - The user or admin ID to include in the token payload.
 * @param type - The type of token, either 'user' or 'admin'.
 * @returns The generated JWT string.
 */
export const generateToken = (userId: string, type: 'user' | 'admin' = 'user'): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server configuration error: JWT secret is missing.');
  }

  const payload = {
    id: userId,
    type: type // Include the type in the payload
  };

  return jwt.sign(payload, secret, {
    expiresIn: Number(process.env.JWT_EXPIRES_IN) || 86400 // 24 hours
  });
};