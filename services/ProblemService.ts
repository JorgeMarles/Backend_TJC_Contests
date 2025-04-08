import axios from "axios";
import { ProblemRepository } from "../repositories/ProblemRepository";
import { URL_BACKEND_PROBLEM } from "../config";

export interface ProblemView {
    id: number;
    name: string;
    statement: string;
    input: string;
    output: string;
    difficulty : string;
    example_input: string;
    example_output: string;
    disable: boolean;
}

export const findProblem = async (id: number) => {
    try {
        const problem = await ProblemRepository.findOne({ where: { id } });
        if (!problem) {
            throw new Error("Problem " +id+ " doesn't exist.");
        }

        const result = await axios.get(`${URL_BACKEND_PROBLEM}/problem?id=${id}`);
        if (result.status !== 200) {
            throw new Error("Error fetching problem "+ id +" data from backend.");
        }
        const problemData: ProblemView = result.data;
        return problemData;
    } catch (error) {
        console.error(error);
        throw error;
    }
}