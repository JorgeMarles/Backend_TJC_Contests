import { Request, Response } from 'express';
import { ContestService } from '../services/contest.service';

export class ContestController {
    constructor(private contestService: ContestService) { }

    async getAllContests(req: Request, res: Response): Promise<Response> {
        try {
            const contests = await this.contestService.getAll();
            return res.json(contests);
        } catch (error) {
            console.error("Error getting contests:", error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async searchContests(req: Request, res: Response): Promise<Response> {
        try {
            const query = req.query.q?.toString() || '';
            const contests = await this.contestService.search(query);
            return res.json(contests);
        } catch (error) {
            console.error("Error searching contests:", error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getContestById(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid contest ID' });
            }

            const contest = await this.contestService.getById(id);
            if (!contest) {
                return res.status(404).json({ message: 'Contest not found' });
            }

            return res.json(contest);
        } catch (error) {
            console.error("Error getting contest by ID:", error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async createContest(req: Request, res: Response): Promise<Response> {
        try {
            const { name, description, start, duration, problems } = req.body;

            const startDate = new Date(start);
            const now = new Date();

            if (startDate < now) {
                return res.status(400).json({ message: "La fecha de inicio no puede ser anterior a la actual" });
            }

            const createdContest = await this.contestService.create({
                name,
                description,
                start_time: startDate,
                duration,
                problems
            });

            return res.status(201).json({
                message: "Creado Correctamente",
                id: createdContest.id
            });

        } catch (error) {
            console.error("Error creating contest:", error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async updateContest(req: Request, res: Response): Promise<Response> {
        try {
            const { id, name, description, start, duration, problems } = req.body;
    
            const existingContest = await this.contestService.getById(id);
            if (!existingContest) {
                return res.status(404).json({ message: "Contest not found" });
            }
    
            const now = new Date();
            if (existingContest.start_time <= now) {
                return res.status(400).json({ message: "No se puede editar una competencia ya iniciada" });
            }
    
            const updatedContest = await this.contestService.update({
                id,
                name,
                description,
                start_time: new Date(start),
                duration,
                problems
            });
    
            return res.json({
                message: "actualizado ok",
                id: updatedContest.id
            });
    
        } catch (error) {
            console.error("Error updating contest:", error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

}