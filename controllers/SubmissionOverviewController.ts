import { getRanking, processSubmission } from '../services/SubmissionOverviewService';
import { Request, Response } from "express";


export const findRanking = async (req: Request, res: Response) => {
    try {
        await getRanking(req, res);
    } catch (error) {
        console.error("Error getting ranking of contest", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const saveSubmission = async (req: Request, res: Response) => {
    try {
        await processSubmission(req, res);
    } catch (error) {
        console.error("Error processing submission", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
