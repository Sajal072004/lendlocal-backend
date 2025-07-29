import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * Generates a JSON Web Token.
 * @param userId - The user ID to include in the token payload.
 * @returns The generated JWT string.
 * @throws Will throw an error if JWT_SECRET is not defined.
 */
export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = Number(process.env.JWT_EXPIRES_IN) || 86400; // Default to 24 hours if not set in .env

  // Best practice: Always validate that your secret exists before using it.
  if (!secret) {
    console.error('JWT_SECRET is not defined in .env file');
    throw new Error('Server configuration error: JWT secret is missing.');
  }

  // Build the options object cleanly and conditionally.
  const options: SignOptions = {};
  if (expiresIn) {
    options.expiresIn = expiresIn ;
  }

  // Sign and return the token.
  return jwt.sign({ id: userId }, secret, options);
};