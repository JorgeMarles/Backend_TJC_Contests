import { Request, Response } from "express";
import { Contest } from "../database/entity/Contest";
import { ContestRepository, ContestView } from "../repositories/ContestRepository";
import { ProblemRepository } from "../repositories/ProblemRepository";
import { AsignationRepository } from "../repositories/AsignationRepository";
import { AppDataSource } from '../database';
import { findProblem } from "./ProblemService";

export const createContest = async (req: Request, res: Response) => {
    try {
        const contest: Contest = req.body;
        if (contest.duration <= 0) {
            throw Error("Duration of the contest must be greater than 0.");
        }
        if (contest.start_time.getTime() < Date.now()) {
            throw Error("Start time of the contest must be greater than current time.");
        }
        if (contest.asignations.length === 0) {
            throw Error("Contest must have at least one problem.");
        }
        for (const x of contest.asignations) {
            const problem = await findProblem(x.problem.id);
            if (problem.disable) {
                throw Error("Problem " + x.problem.id + " is disabled.");
            }
            x.problem;
        }
        await AsignationRepository.save(contest.asignations);
        const contestCreated: Contest = await ContestRepository.save(contest);
        if (!contestCreated) {
            throw Error("Contest not created.");
        }
        return res.status(201).send({ isCreated: true, message: "Contest created successfully" });
    }
    catch (error: unknown) {
        console.log(error)
        if (error instanceof Error) {
            return res.status(400).send({ isCreated: false, message: error.message });
        }
        else {
            return res.status(400).send({ isCreated: false, message: "Something went wrong" });
        }
    }
}

export const updateContest = async (req: Request, res: Response) => {
    try {
        const contest: Contest = req.body;
        if (!contest.id) {
            throw Error("Id of the contest is required.");
        }
        const contestToUpdate: unknown = await ContestRepository.findOne({ 
            where: { id: contest.id }, 
            relations: { asignations: true } 
        });
        if (!(contestToUpdate instanceof Contest)) {
            throw Error("Contest " + contest.id + " doesn't exist.");
        }

        if(contestToUpdate.start_time.getTime() < Date.now()) { 
            throw Error("Contest " + contest.id + " has already started.");
        }

        if (contest.duration <= 0) {
            throw Error("Duration of the contest must be greater than 0.");
        }
        if (contest.start_time.getTime() < Date.now()) {
            throw Error("Start time of the contest must be greater than current time.");
        }
        if (contest.asignations.length === 0) {
            throw Error("Contest must have at least one problem.");
        }
        
        for (const x of contest.asignations) {
            const problem = await findProblem(x.problem.id);
            if (!problem) {
                throw Error("Problem " + x.problem.id + " doesn't exist.");
            }
            if (problem.disable) {
                throw Error("Problem " + x.problem.id + " is disabled.");
            }
            x.problem;
        }

        contestToUpdate.name = contest.name;
        contestToUpdate.start_time = contest.start_time;
        contestToUpdate.duration = contest.duration;
        contestToUpdate.description = contest.description;

        await AsignationRepository.remove(contestToUpdate.asignations);

        contestToUpdate.asignations = contest.asignations;

        await AsignationRepository.save(contestToUpdate.asignations);

        const contestCreated: Contest = await ContestRepository.save(contestToUpdate);

        if (!contestCreated) {
            throw Error("Contest not created.");
        }
        return res.status(200).send({ isUpdate: true, message: "Contest updated successfully" });
    }
    catch (error: unknown) {
        console.log(error)
        if (error instanceof Error) {
            return res.status(400).send({ isUpdate: false, message: error.message });
        }
        else {
            return res.status(400).send({ isUpdate: false, message: "Something went wrong" });
        }
    }
}

interface ProblemView {
    id: number;
    name: string;
    order: number;
}

interface ContestDetail extends ContestView {
    problems: ProblemView[];
}

export const listContests = async (req: Request, res: Response) => {
    try {
        let contests: ContestView[];
        if(req.query.q){
            const query = req.query.q.toString().toLowerCase();
            contests = await ContestRepository.findViewsBySearch(query);
        }else{
            contests = await ContestRepository.findViews();
        }
        return res.status(200).send({ contests });
    }catch (error: unknown) {
        console.log(error)
        if (error instanceof Error) {
            return res.status(400).send({ isUpdate: false, message: error.message });
        }
        else {
            return res.status(400).send({ isUpdate: false, message: "Something went wrong" });
        }
    }
}

export const getContest = async (req: Request, res: Response) => {
    try {
        const contestId = parseInt(req.params.id);
        const contest: unknown = await ContestRepository.findOne({
            where: { id: contestId }, relations: { asignations: true }
        });
        if(!(contest instanceof Contest)) {
            return res.status(404).send({ message: "Contest not found" });
        }
        const problems: ProblemView[] = [];
        for(const x of contest.asignations) {
            const problem = await findProblem(x.problem.id);
            
            const problemView: ProblemView = {
                id: x.problem.id,
                name: problem.name,
                order: x.order
            };

            problems.push(problemView);
        }
        const result: ContestDetail = {...contest, problems, num_problems: problems.length};
        return res.status(200).send({ result });
    }catch (error: unknown) {
        console.log(error)
        if (error instanceof Error) {
            return res.status(400).send({ isUpdate: false, message: error.message });
        }
        else {
            return res.status(400).send({ isUpdate: false, message: "Something went wrong" });
        }
    }
}