import { ProblemRepository } from "../repositories/ProblemRepository";
import { apiProblems } from "../middleware/interceptor";
import { Request, Response } from "express";
import { Problem } from "../database/entity/Problem";

export interface ProblemView {
    id: number;
    name: string;
    statement: string;
    input: string;
    output: string;
    difficulty: string;
    example_input: string;
    example_output: string;
    disable: boolean;
}

export const findProblem = async (id: number) => {
    try {
        const problem = await ProblemRepository.findOne({ where: { id } });
        if (!problem) {
            throw new Error("Problem " + id + " doesn't exist.");
        }
        const result = await apiProblems.get(`/problem?id=${id}`);
        if (result.status !== 200) {
            throw new Error("Error fetching problem " + id + " data from backend.");
        }
        const problemData: ProblemView = result.data.problem;
        return problemData;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const createProblem = async (req: Request, res: Response) => {
    try {
        const problem = new Problem();
        Object.assign(problem, req.body);

        const created: Problem = await ProblemRepository.save(problem);
        
        if (!(created instanceof Problem)) {
            return res.status(400).json({ message: "Problem not created" });
        }
        return res.status(201).json({ message: "Problem created successfully", problem });
    } catch (error) {
        console.error("Error creating problem:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}