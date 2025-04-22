import { Request, Response } from "express";
import { Contest } from "../database/entity/Contest";
import { ContestRepository, ContestView } from "../repositories/ContestRepository";
import { ProblemRepository } from "../repositories/ProblemRepository";
import { AsignationRepository } from "../repositories/AsignationRepository";
import { AppDataSource } from '../database';
import { findProblem } from "./ProblemService";
import { CustomRequestUser } from "../middleware/authenticateToken";

export const transformContestInput = (input: any): Contest => {
    return {
        ...input,
        start: new Date(input.start),
        asignations: input.problems.map((problem: any) => ({
            problem: {
                id: problem.id,
                name: problem.name,
            },
        })),
    };
};

export const createContest = async (req: Request, res: Response) => {
    try {
        const contest: Contest = transformContestInput(req.body);
        if (contest.duration <= 0) {
            throw Error("Duration of the contest must be greater than 0.");
        }
        if (contest.start.getTime() < Date.now()) {
            throw Error("Start time of the contest must be greater than current time.");
        }
        if (contest.asignations.length === 0) {
            throw Error("Contest must have at least one problem.");
        }
        let i = 1;
        for (const x of contest.asignations) {
            const problem = await findProblem(x.problem.id);
            if (problem.disable) {
                throw Error("Problem " + x.problem.id + " is disabled.");
            }
            x.order = i++;
        }
        await AsignationRepository.save(contest.asignations);
        const contestCreated: Contest = await ContestRepository.save(contest);
        if (!contestCreated) {
            throw Error("Contest not created.");
        }
        return res.status(201).send({ isCreated: true, message: "Contest created successfully" });
    }
    catch (error: unknown) {
        console.error(error)
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
        const contest: Contest = transformContestInput(req.body);
        if (!contest.id) {
            throw Error("Id of the contest is required.");
        }
        const contestToUpdate: unknown = await ContestRepository.findOne({
            where: { id: contest.id, disable: false },
            relations: { asignations: true }
        });
        if (!(contestToUpdate instanceof Contest)) {
            throw Error("Contest " + contest.id + " doesn't exist.");
        }

        if (contestToUpdate.start.getTime() < Date.now()) {
            throw Error("Contest " + contest.id + " has already started.");
        }

        if (contest.duration <= 0) {
            throw Error("Duration of the contest must be greater than 0.");
        }
        if (contest.start.getTime() < Date.now()) {
            throw Error("Start time of the contest must be greater than current time.");
        }
        if (contest.asignations.length === 0) {
            throw Error("Contest must have at least one problem.");
        }
        let i = 1;
        for (const x of contest.asignations) {
            const problem = await findProblem(x.problem.id);
            if (!problem) {
                throw Error("Problem " + x.problem.id + " doesn't exist.");
            }
            if (problem.disable) {
                throw Error("Problem " + x.problem.id + " is disabled.");
            }
            x.order = i++;
        }

        contestToUpdate.name = contest.name;
        contestToUpdate.start = contest.start;
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
        console.error(error)
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

export const transformContestOutput = (input: Contest): any => {
    return {
        ...input,
    };
}
export interface Contest2 {
    id?: number;
    name: string;
    description: string;
    start: Date;
    duration: number;
    enroll: boolean;
}

export interface ContestDetails extends Contest {
    problems: {
        id: number;
        name: string;
    }[];
}

export const listContests = async (req: CustomRequestUser, res: Response) => {
    try {
        let contests: Contest[];
        if (req.query.q) {
            const query = req.query.q.toString().toLowerCase();
            contests = await ContestRepository.findViewsBySearch(query);
        } else {
            contests = await ContestRepository.find({ where: { disable: false }, relations: { participations: { user: true } } });
        }
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).send({ message: "User not authenticated" });
        }
        const result = contests.map((contest) => {
            return {
                ...contest,
                enroll: contest.participations.some((participation) => participation.user.id === userId),
            };
        })
        return res.status(200).send(result);
    } catch (error: unknown) {
        console.error(error)
        if (error instanceof Error) {
            return res.status(400).send({ isUpdate: false, message: error.message });
        }
        else {
            return res.status(400).send({ isUpdate: false, message: "Something went wrong" });
        }
    }
}

export const getContest = async (req: CustomRequestUser, res: Response) => {
    try {
        const contestId = parseInt(req.params.id);
        const contest: unknown = await ContestRepository.findOne({
            where: { id: contestId, disable: false }, relations: { asignations: { problem: true } }
        });
        if (!(contest instanceof Contest)) {
            return res.status(404).send({ message: "Contest not found" });
        }
        const problems: ProblemView[] = [];
        if (contest.start.getTime() < Date.now() || req.user?.type === "admin") {
            for (const x of contest.asignations) {
                const problem = await findProblem(x.problem.id);

                const problemView: ProblemView = {
                    id: x.problem.id,
                    name: problem.name,
                    order: x.order
                };

                problems.push(problemView);
            }
            problems.sort((a, b) => a.order - b.order);
        }


        const result: ContestDetail = { ...contest, problems, num_problems: problems.length };
        delete (result as any).asignations;
        return res.status(200).send({ ...result });
    } catch (error: unknown) {
        console.error(error)
        if (error instanceof Error) {
            return res.status(400).send({ isUpdate: false, message: error.message });
        }
        else {
            return res.status(400).send({ isUpdate: false, message: "Something went wrong" });
        }
    }
}

export const switchContest = async (req: Request, res: Response) => {
    try {
        const contestId = parseInt(req.params.id);

        const contest: unknown = await ContestRepository.findOne({
            where: { id: contestId }
        });
        if (!(contest instanceof Contest)) {
            return res.status(404).send({ message: "Contest not found" });
        }

        contest.disable = !contest.disable;
        const contestUpdated: unknown = await ContestRepository.save(contest);

        if (!(contestUpdated instanceof Contest)) {
            return res.status(400).send({ message: "Contest not updated" });
        }

        return res.status(204).send({ isUpdate: true, message: `Contest ${contest.disable ? 'disabled' : 'enabled'} successfully` });
    } catch (error: unknown) {
        console.error(error)
        if (error instanceof Error) {
            return res.status(400).send({ isUpdate: false, message: error.message });
        }
        else {
            return res.status(400).send({ isUpdate: false, message: "Something went wrong" });
        }
    }
}