import bcrypt from "bcrypt";
import { ServerError, UnauthorizedError } from "../types";
import jwt from "jsonwebtoken";

export class CryptographyService {
  jwtSecret: string;
  constructor() {
    if (!process.env.JWT_SECRET)
      throw new ServerError(
        new Error(
          "Please configure a JWT_SECRET env variable before starting the server"
        )
      );

    this.jwtSecret = process.env.JWT_SECRET;
  }

  async encryptPassword(password: string) {
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
  }

  async verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }

  createToken(userInfo: object) {
    return jwt.sign(userInfo, process.env.JWT_SECRET);
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET) as { email: string };
    } catch (e) {
      throw new UnauthorizedError(e.message);
    }
  }
}
