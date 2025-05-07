import { Request, Response } from "express";
import { User } from "../database/entity/User";
import { UserRepository } from "../repositories/UserRepository";
import { apiUsers } from "../middleware/interceptor";
import { CustomRequestUser } from "../middleware/authenticateToken";
import { ParticipationRepository } from "../repositories/ParticipationRepository";
import { ContestRepository, ContestView } from "../repositories/ContestRepository";
import { Contest } from "../database/entity/Contest";
import { getRanking } from "./SubmissionOverviewService";
import { SubmissionOverview } from "../database/entity/SubmissionOverview";
import { AsignationRepository } from '../repositories/AsignationRepository';
import { Asignation } from '../database/entity/Asignation';
import { SubmissionOverviewRepository } from "../repositories/SubmissionOverviewRepository";
export interface UserInfo {
    email: string;
    type: string;
    id: number;
}

export interface CustomRequest extends Request {
    user?: UserInfo;
}

export const createUser = async (req: Request, res: Response) => {
    try {
        if (!req.body.id) {
            throw Error("Id of the user is required.");
        }
        const user: User = req.body;
        await UserRepository.save(user);
        return res.status(201).send({ isCreated: true, message: "User created successfully" });
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

export interface UserView {
    id: number;
    name: string;
    nickname: string;
    email: string;
    password: string;
    type: boolean;
    disable: boolean;
}

export const findUser = async (id: number): Promise<UserView> => {
    try {
        const user = await UserRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error("Problem " + id + " doesn't exist.");
        }
        const result = await apiUsers.get(`/user/findOne?id=${id}`);
        if (result.status !== 200) {
            throw new Error("Error fetching user " + id + " data from backend.");
        }
        const userData: any = result.data;

        return userData.user;
    }
    catch (error: unknown) {
        console.error(error)
        throw error;
    }
}

export const stats = async (req: CustomRequest, res: Response) => {
    try {
        let contests: Contest[];
        const userId = req.user?.id;

        contests = await ContestRepository.find({
            where: { disable: false },
            relations: { participations: { user: true } },
            order: { start: "DESC" },
        });

        const userContests = contests.filter((contest) =>
            contest.participations.some((participation) => participation.user.id === userId)
        );


        const firstFiveContests = userContests.slice(0, 5);
        const rankingInfo = [];


        for (const contest of firstFiveContests) {
            const ranking = await getRankingByContest(contest.id);

            const userRanking = ranking.findIndex((item) => item.user.id === userId);

            if (userRanking !== -1) {
                const totalParticipants = ranking.length;

                const percentile = ((userRanking + 1) / totalParticipants) * 100;

                rankingInfo.push({
                    id: contest.id,
                    position: userRanking + 1, 
                    percentile: percentile.toFixed(2),
                });
            }
        }

        return res.status(200).json({ rankingInfo });

    } catch (error) {
        console.error("Error getting stats:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



///ranking
interface RankingItem {
    user: {
        id: number;
        nickname: string;
    },
    problems_solved: number;
    penalty: number;
    submissions: SubmissionOverview[];
}

const TIME_PENALTY_MINUTES = 20;
export const getRankingByContest = async (contestId: number): Promise<RankingItem[]> => {
    const contest: Contest | null = await ContestRepository.findOne({
        where: { id: contestId },
        relations: { participations: { user: true } }
    });

    if (!contest) {
        throw new Error("Contest not found");
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

        const submissionsOverview: SubmissionOverview[] = await SubmissionOverviewRepository.find({
            where: { participation: participation },
            relations: { asignation: true }
        });

        for (const submissionOverview of submissionsOverview) {
            if (submissionOverview.solved) {
                problemsSolved++;
            }
            penalty += submissionOverview.solved ? TIME_PENALTY_MINUTES * (submissionOverview.attemps - 1) + submissionOverview.time : 0;
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

    // Ordenar el ranking
    ranking.sort((a, b) => {
        if (a.problems_solved !== b.problems_solved) {
            return b.problems_solved - a.problems_solved;
        }
        return a.penalty - b.penalty;
    });

    return ranking;
}