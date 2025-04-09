import { Request, Response } from "express";
import { ContestRepository } from "../repositories/ContestRepository";
import { Contest } from "../database/entity/Contest";
import { SubmissionOverview } from "../database/entity/SubmissionOverview";
import { SubmissionOverviewRepository } from "../repositories/SubmissionOverviewRepository";
import { findUser } from './UserService';
import { AsignationRepository } from '../repositories/AsignationRepository';
import { Asignation } from '../database/entity/Asignation';
import axios from "axios";
import { URL_BACKEND_PROBLEM } from "../config";


interface RankingItem {
    user: {
        id: number;
        nickname: string;
    },
    problems_solved: number;
    penalty: number;
    submissions: SubmissionOverview[];
}

const TIME_PENALTY_MINUTES = 20; // 20 minutes penalty for each wrong submission

export const getRanking = async (req: Request, res: Response) => {
    try {
        if (!req.params.id) {
            throw Error("Id of the contest is required.");
        }

        const contestId = parseInt(req.params.id);

        const contest: unknown = await ContestRepository.findOne({ where: { id: contestId }, relations: { participations: true } });
        if (!(contest instanceof Contest)) {
            throw Error("Contest not found.");
        }
        if (contest.start_time.getTime() > Date.now()) {
            throw Error("Contest not started yet.");
        }

        const asignations: Asignation[] = await AsignationRepository.find({ where: { contest: contest }, relations: { problem: true } });
        const problemsMap: Map<number, number> = new Map<number, number>();
        for (const asignation of asignations) {
            problemsMap.set(asignation.problem.id, asignation.order);
        }

        const ranking: RankingItem[] = [];
        const participations = contest.participations;
        for (const participation of participations) {
            const user = await findUser(participation.user.id);
            let problemsSolved = 0;
            let penalty = 0;

            const submissionsOverview: SubmissionOverview[] = await SubmissionOverviewRepository.find({ where: { participation: participation }, relations: { asignation: true } });
            for(const submissionOverview of submissionsOverview) {
                if(submissionOverview.solved) {
                    problemsSolved++;
                }
                penalty += TIME_PENALTY_MINUTES * (submissionOverview.attemps - 1) + submissionOverview.time;
            }
            ranking.push({
                user: {
                    id: user.id,
                    nickname: user.nickname
                },
                problems_solved: problemsSolved,
                penalty: penalty,
                submissions: submissionsOverview
            });
        }
        ranking.sort((a, b) => {
            if (a.problems_solved !== b.problems_solved) {
                return b.problems_solved - a.problems_solved;
            }
            return a.penalty - b.penalty;
        });
        return res.status(200).send({ ranking });
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

interface SubmissionView {
    id: string;
    veredict: string;
    executionDate: Date;
    userId: number;
    problemId: number;
    problemName: string;
    code_string: string | undefined;
};

const processSubmission = async (req: Request, res: Response) => {
    try {
        const submissionId = req.body.id;
        const submission: SubmissionView = await getSubmissionInfo(submissionId);
        if (!submission) {
            throw Error("Submission not found.");
        }
        const problemId = submission.problemId;
        const userId = submission.userId;
        const contests: Contest[] = await ContestRepository.findByProblemId(problemId);
        for(const contest of contests){
            const participation = contest.participations.find(p => p.user.id === userId);
            const asignation = contest.asignations.find(a => a.problem.id === problemId);
            if(!participation || !asignation) {
                continue;
            }
            const submissionOverview = await SubmissionOverviewRepository.findOne({ where: { participation: participation, asignation: asignation } });
            if(!submissionOverview){
                const newSubmissionOverview = new SubmissionOverview();
                newSubmissionOverview.participation = participation;
                newSubmissionOverview.asignation = asignation;
                newSubmissionOverview.time = Math.floor((submission.executionDate.getTime() - contest.start_time.getTime()) / 1000 / 60); // time in minutes
                newSubmissionOverview.solved = submission.veredict === "Accepted";
                newSubmissionOverview.attemps = 1;

                participation.penalty += submission.veredict === "Accepted" ? newSubmissionOverview.time : 0; // add penalty if accepted

                await SubmissionOverviewRepository.save(newSubmissionOverview);
            }else{
                if(submissionOverview.solved) {
                    continue; // already solved, no need to update
                }
                submissionOverview.time = Math.floor((submission.executionDate.getTime() - contest.start_time.getTime()) / 1000 / 60); // time in minutes
                submissionOverview.solved = submission.veredict === "Accepted";
                participation.penalty += submission.veredict === "Accepted" ? submissionOverview.time + (submissionOverview.attemps * TIME_PENALTY_MINUTES): 0; // add penalty if accepted
                submissionOverview.attemps += 1;
                await SubmissionOverviewRepository.save(submissionOverview);
            }
        }
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

const getSubmissionInfo = async (submissionId: string) => {
    
    const result = await axios.get(`${URL_BACKEND_PROBLEM}/submission/findOne?submission_id=${submissionId}`);
    
    if (result.status !== 200) {
        throw Error("Error getting submission info.");
    }
    return result.data;
}