import User from "@/models/user.model";
import jwt from "jsonwebtoken";
import { promisify } from "util";

async function verifyToken(token: string): Promise<string | undefined> {
  const decoded = (await promisify<any>(jwt.verify as any)(
    token,
    process.env.JWT_SECRET as string
  )) as jwt.JwtPayload;

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return undefined;
  }

  if (decoded.iat && currentUser.changedPasswordAfter(decoded.iat)) {
    return undefined;
  }
  return currentUser._id?.toString();
}

export default verifyToken;
