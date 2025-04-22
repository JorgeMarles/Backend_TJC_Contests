import { Request, Response } from "express";
import { enroll, unenroll } from "../services/ParticipationService";


export const enrollContest = async (req: Request, res: Response) => {
    try {
        await enroll(req, res);
    } catch (error) {
        console.error("Error enrolling:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const unenrollContest = async (req: Request, res: Response) => {
    try {
        await unenroll(req, res);
    } catch (error) {
        console.error("Error enrolling:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}