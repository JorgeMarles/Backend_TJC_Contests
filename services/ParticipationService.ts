import { Request, Response } from 'express';
import { ContestRepository } from '../repositories/ContestRepository';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../database/entity/User';
import { ParticipationRepository } from '../repositories/ParticipationRepository';
import { Contest } from '../database/entity/Contest';
import { Participation } from '../database/entity/Participation';
import { CustomRequest } from './UserService';


export const enroll = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.params.id) {
            throw Error("Id of the contest is required.");
        }
        if (!req.user) {
            throw Error("User not found.");
        }
        const contestId = parseInt(req.params.id);
        const contest: unknown = await ContestRepository.findOne({ where: { id: contestId, disable: false }, relations: { participations: true } });
        if (!(contest instanceof Contest)) {
            throw Error("Contest not found.");
        }
        if (contest.start.getTime() < Date.now()) {
            throw Error("Contest already started.");
        }
        const user: unknown = await UserRepository.findOneBy({ id: req.user.id });
        if (!(user instanceof User)) {
            throw Error("User not found.");
        }
        const participation: unknown = await ParticipationRepository.findOneBy({ user: user, contest: contest });
        if (participation instanceof Participation) {
            throw Error("User already enrolled in this contest.");
        }
        const newParticipation = new Participation();
        newParticipation.user = user;
        newParticipation.contest = contest;

        const participationCreated: unknown = await ParticipationRepository.save(newParticipation);
        if (!(participationCreated instanceof Participation)) {
            throw Error("Error enrolling in contest.");
        }

        return res.status(201).send({ isCreated: true, message: "User enrolled successfully" });
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

export const unenroll = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.params.id) {
            throw Error("Id of the contest is required.");
        }
        if (!req.user) {
            throw Error("User not found.");
        }
        const contestId = parseInt(req.params.id);
        const contest: unknown = await ContestRepository.findOne({ where: { id: contestId, disable: false }, relations: { participations: true } });
        if (!(contest instanceof Contest)) {
            throw Error("Contest not found.");
        }
        if (contest.start.getTime() < Date.now()) {
            throw Error("Contest already started.");
        }
        const user: unknown = await UserRepository.findOneBy({ id: req.user.id });
        if (!(user instanceof User)) {
            throw Error("User not found.");
        }
        const participation: unknown = await ParticipationRepository.findOneBy({ user: user, contest: contest });
        if (!(participation instanceof Participation)) {
            throw Error("User was not enrolled in this contest.");
        }
        await ParticipationRepository.remove(participation);

        return res.status(201).send({ isCreated: true, message: "User unenrolled successfully" });
    } catch (error: unknown) {
        console.error(error)
        if (error instanceof Error) {
            return res.status(400).send({ isCreated: false, message: error.message });
        }
        else {
            return res.status(400).send({ isCreated: false, message: "Something went wrong" });
        }
    }
}