import { Request, Response } from "express";
import { createUser } from "../services/UserService";


export const create = async (req: Request, res: Response) => {
    try {
        await createUser(req, res);
    } catch (error) {
        console.error("Error creating user", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}