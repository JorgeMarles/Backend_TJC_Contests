import { createContest, updateContest } from './../services/ContestService';
import { Request, Response } from 'express';
import { getContest, listContests } from '../services/ContestService';

export const find = async (req: Request, res: Response) => {
    try {
        await listContests(req, res);
    } catch (error) {
        console.error("Error getting contests:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const findOne = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid contest ID' });
        }
        await getContest(req, res);
    } catch (error) {
        console.error("Error getting contest by ID:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const create = async (req: Request, res: Response) => {
    try {
        await createContest(req, res);
    } catch (error) {
        console.error("Error getting contest by ID:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const update = async (req: Request, res: Response) => {
    try {
        await updateContest(req, res);
    } catch (error) {
        console.error("Error updating contest:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
