import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken";
import fs from 'fs';
import { URL_PUBLIC_KEY } from "../config";

const PUBLIC_KEY = fs.readFileSync(URL_PUBLIC_KEY, "utf8");

interface TokenPayload {
  email: string;
  type: string;
  exp: number;
  id: number;
}

export interface CustomRequestUser extends Request {
  user?: { email: string; type: string, id: number };
}

export const authenticate = (roles: string[]) => {
  return async (req: CustomRequestUser, res: Response, next: NextFunction) => {
    const header = req.header("Authorization");
    if (!header) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = header.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }

    try {
      const payload = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] }) as TokenPayload;      
      req.user = payload;
      if (!roles.includes(payload.type)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (error) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
  };
};