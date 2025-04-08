import { Request, Response } from "express";
import { User } from "../database/entity/User";
import { UserRepository } from "../repositories/UserRepository";

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