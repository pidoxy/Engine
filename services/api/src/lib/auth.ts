import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const signToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || "";
  const expiresIn = process.env.JWT_EXPIRES_IN || "90d";
  return jwt.sign({ id }, secret, { expiresIn } as any);
};

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, 12);

export const verifyPassword = (
  candidate: string,
  hash: string
): Promise<boolean> => bcrypt.compare(candidate, hash);

export const passwordChangedAfter = (
  passwordChangedAt: Date | null,
  jwtIssuedAt: number
): boolean => {
  if (!passwordChangedAt) return false;
  return passwordChangedAt.getTime() / 1000 > jwtIssuedAt;
};
