import { Request, Response } from "express";
import { ContestRepository } from "../repositories/ContestRepository";
import { Contest } from "../database/entity/Contest";
import { Submission } from "../database/entity/Submission";
import { SubmissionRepository } from "../repositories/SubmissionRepository";
import { findUser } from './UserService';
import { AsignationRepository } from '../repositories/AsignationRepository';
import { Asignation } from '../database/entity/Asignation';


interface RankingItem {
    user: {
        id: number;
        nickname: string;
    },
    problems_solved: number;
    penalty: number;
    submissions: SubmissionsOverview[];
}

interface SubmissionsOverview {
    attemps: number;
    solved: boolean;
    time: number;
    order: number;
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

        const submissions: Submission[] = await SubmissionRepository.find({ where: { participation: {contest: contest} }, relations: { participation: true } });
        const submissionsMap: Map<number, Map<number, Submission[]>> = new Map<number, Map<number, Submission[]>>();

        for(const submission of submissions){
            let submissionMap = submissionsMap.get(submission.participation.id);
            if(!submissionMap){
                submissionMap = new Map<number, Submission[]>();
                submissionsMap.set(submission.participation.id, submissionMap);
            }
            let submissionList = submissionMap.get(submission.problem.id);
            if(!submissionList){
                submissionList = [];
                submissionMap.set(submission.problem.id, submissionList);
            }
            submissionList.push(submission);
        }
        
        const ranking: RankingItem[] = [];
        const participations = contest.participations;
        for(const participation of participations){
            const user = await findUser(participation.user.id);
            let problemsSolved = 0;
            let penalty = 0;
            const submissionsOverview: SubmissionsOverview[] = [];
            const submissionMap = submissionsMap.get(participation.id);
            if(!submissionMap){
                ranking.push({
                    user: {
                        id: user.id,
                        nickname: user.nickname
                    },
                    problems_solved: 0,
                    penalty: 0,
                    submissions: []
                });
                continue;
            }
            for(const [problemId, submissionList] of submissionMap){
                let attemps = 0;
                let solved = false;
                let time = 0;
                submissionList.sort((a, b) => a.time_judge.getTime() - b.time_judge.getTime());
                for(const submission of submissionList){
                    attemps++;
                    if(submission.veredict === "Accepted"){
                        solved = true;
                        problemsSolved++;
                        time = submission.time_judge.getTime() - contest.start_time.getTime();
                        time = Math.floor(time / (1000 * 60)); // convert to minutes
                        penalty += TIME_PENALTY_MINUTES * (attemps - 1) + time;
                        break;
                    }
                }
                submissionsOverview.push({ attemps, solved, time, order: problemsMap.get(problemId)! });
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
