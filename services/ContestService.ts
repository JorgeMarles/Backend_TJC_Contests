import { Request, Response } from "express";
import { Between } from "typeorm";
import { Contest } from "../database/entity/Contest";
import { CustomRequestUser } from "../middleware/authenticateToken";
import { AsignationRepository } from "../repositories/AsignationRepository";
import { ContestRepository, ContestView } from "../repositories/ContestRepository";
import { findProblem } from "./ProblemService";
import { Asignation } from "../database/entity/Asignation";
import { SubmissionOverview } from "../database/entity/SubmissionOverview";
import { SubmissionOverviewRepository } from "../repositories/SubmissionOverviewRepository";
import { findUser } from "./UserService";
import { scheduleContestEnd, sendParticipationMessage, sendRegisterContestMessage } from "./RabbitMQ";
import { TIME_PENALTY_MINUTES } from "./SubmissionOverviewService";
import { ParticipationRepository } from "../repositories/ParticipationRepository";
import { Participation } from "../database/entity/Participation";

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
        const contestCreated: Contest = Object.assign(new Contest(), await ContestRepository.save(contest));
        if (!contestCreated) {
            throw Error("Contest not created.");
        }        
        scheduleContestEnd(contestCreated.id, contestCreated.getEndTime());
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
        scheduleContestEnd(contestCreated.id, contestCreated.getEndTime());
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
    difficulty: number;
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
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).send({ message: "User not authenticated" });
        }
        let contests: Contest[];
        const minDif: number = parseFloat(req.query.minDifficulty?.toString() ?? "-1");
        const maxDif: number = parseFloat(req.query.maxDifficulty?.toString() ?? "2");
        if (req.query.q) {
            const query = req.query.q.toString().toLowerCase();
            contests = await ContestRepository.findViewsBySearch(query);
        } else {
            contests = await ContestRepository.find({ where: { disable: false }, relations: { participations: { user: true } }, order: { start: "DESC" } });
        }

        let result: Contest2[] = await Promise.all(contests.map(async contest => {
            return {
                ...contest,
                enroll: contest.participations.some((participation) => participation.user.id === userId),
            };
        }));

        result = result.filter(c => c.difficulty >= minDif && c.difficulty <= maxDif);

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

export const endContest = async (contestId: number) => {
    const contest: unknown = await ContestRepository.findOne({
        where: { id: contestId },
        relations: { participations: { user: true } }
    });
    if (!(contest instanceof Contest)) {
        throw new Error("Contest not found");
    }
    const partic: {
        contestId: number,
        userId: number,
        position: number,
        problemsSolved: number,
        numAttempts: number,
        penalty: number,
    }[] = [];

    const asignations: Asignation[] = await AsignationRepository.find({ where: { contest: contest }, relations: { problem: true } });
    const problemsMap: Map<number, number> = new Map<number, number>();
    for (const asignation of asignations) {
        problemsMap.set(asignation.problem.id, asignation.order);
    }

    const participations = contest.participations;

    let enviosOk: number = 0;
    let enviosTotal: number = 0;

    let participationsBlank: number = 0;
    let participationsTotal: number = participations.length;

    let problemsTotal: number = asignations.length * participationsTotal;

    for (const participation of participations) {
        let problemsSolvedUser = 0;
        let isBlank: boolean = true;
        const submissionsOverview: SubmissionOverview[] = await SubmissionOverviewRepository.find({ where: { participation: participation }, relations: { asignation: true } });
        let penalty = 0;
        for (const submissionOverview of submissionsOverview) {
            if (submissionOverview.solved) {
                problemsSolvedUser++;
                isBlank = false;
            }
            enviosTotal += submissionOverview.attemps;
            penalty += submissionOverview.solved ? TIME_PENALTY_MINUTES * (submissionOverview.attemps - 1) + submissionOverview.time : 0;
        }
        participationsBlank += isBlank ? 1 : 0;
        enviosOk += problemsSolvedUser;
        partic.push({
            contestId: contestId,
            userId: participation.user.id,
            position: 0,
            problemsSolved: problemsSolvedUser,
            numAttempts: enviosTotal,
            penalty: penalty,
        })
    }

    partic.sort((a, b) => {
        if (a.problemsSolved !== b.problemsSolved) {
            return b.problemsSolved - a.problemsSolved;
        }
        return a.penalty - b.penalty;
    });

    let position = 1;
    for (const u of partic) {
        u.position = position++;
    }

    const participationsSaved = await Promise.all(partic.map(async (el) => {
        const user = await findUser(el.userId);
        const contest = await ContestRepository.findOneBy({ id: el.contestId });
        
        if (!user || !contest) {
            throw new Error(`User ${el.userId} or Contest ${el.contestId} not found`);
        }
        
        return {
            user: user,
            contest: contest,
            penalty: el.penalty,
            position: el.position,
        };
    }));
    
    await ParticipationRepository.save(participationsSaved);

    const x: number = (1 - (enviosOk / enviosTotal));
    const y: number = (1 - (enviosOk / problemsTotal));
    const z: number = participationsBlank / participationsTotal;
    let d: number = x * .3 + y * .4 + z * .3;
    d = Number.isFinite(d) && !Number.isNaN(d) ? d : 0;

    ContestRepository.update(contestId, { difficulty: d, ended: true });

    await sendRegisterContestMessage(contestId, contest.getEndTime(), asignations.length, d);

    for (const p of partic) {
        const percentile = ((p.position + 1) / partic.length) * 100;
        sendParticipationMessage(p.contestId, p.userId, p.position, p.problemsSolved, p.numAttempts, p.penalty, percentile);
    }    
}

export const isEnded = async (contestId: number): Promise<boolean> => {
    const contest: unknown = await ContestRepository.findOne({
        where: { id: contestId }
    });
    if (!(contest instanceof Contest)) {
        throw new Error("Contest not found");
    }
    return contest.ended;
}