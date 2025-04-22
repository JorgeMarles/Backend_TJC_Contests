import { Request, Response } from "express";
import { User } from "../database/entity/User";
import { UserRepository } from "../repositories/UserRepository";
import { apiUsers } from "../middleware/interceptor";


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