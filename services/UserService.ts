import { Request, Response } from "express";
import { User } from "../database/entity/User";
import { UserRepository } from "../repositories/UserRepository";
import { ContestRepository } from "../repositories/ContestRepository";
import { Contest } from "../database/entity/Contest";
import { Submission } from "../database/entity/Submission";
import { SubmissionRepository } from "../repositories/SubmissionRepository";
import axios from "axios";
import { URL_BACKEND_USERS } from "../config";

export const createUser = async (req: Request, res: Response) => {
    try {        
        if(!req.body.id) {
            throw Error("Id of the user is required.");
        }
        const user: User = req.body;
        await UserRepository.save(user);
        return res.status(201).send({ isCreated: true, message: "User created successfully" });
    }
    catch (error: unknown) {
        console.log(error)
        if (error instanceof Error) {
            return res.status(400).send({ isCreated: false, message: error.message });
        }
        else {
            return res.status(400).send({ isCreated: false, message: "Something went wrong"});
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

export const findUser = async (id: number) => {
    try {        
        const user = await UserRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error("Problem " +id+ " doesn't exist.");
        }
        const result = await axios.get(`${URL_BACKEND_USERS}/findOne?id=${id}`);
        if (result.status !== 200) {
            throw new Error("Error fetching user "+ id +" data from backend.");
        }
        const userData: UserView = result.data;
        return userData;
    }
    catch (error: unknown) {
        console.log(error)
        throw error;
    }
}