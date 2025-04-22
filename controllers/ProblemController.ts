import { Request, Response } from "express";
import { createProblem } from "../services/ProblemService";


export const create = async (req: Request, res: Response) => {
    try {
        await createProblem(req, res);
    } catch (error) {
        console.error("Error creating problem", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}