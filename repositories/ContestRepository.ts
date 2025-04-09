import { Repository } from 'typeorm';
import { Contest } from '../database/entity/Contest';
import { AppDataSource } from '../database';
import {sumMinutes} from '../util/dateCalculations';

export interface ContestView {
    id: number;
    name: string;
    start: Date;
    duration: number;
    description: string;
    num_problems: number;
}

export const ContestRepository = AppDataSource.getRepository(Contest).extend({
    async findViewsBySearch(query: string): Promise<ContestView[]> {
        return this.createQueryBuilder("contest")
            .select("contest.id", "id")
            .addSelect("contest.name", "name")
            .addSelect("contest.description", "description")
            .addSelect("contest.start", "start")
            .addSelect("contest.duration", "duration")
            .addSelect("COUNT(asignation.id)", "num_problems")
            .where("LOWER(contest.name) LIKE :query OR LOWER(contest.description) LIKE :query", { query: `%${query}%` })
            .innerJoin("contest.asignations", "asignation")
            .groupBy("contest.id")
            .orderBy("contest.start", "DESC")
            .getRawMany(); // Devuelve los resultados como objetos planos
    },
    async findViews(): Promise<ContestView[]> {
        return this.createQueryBuilder("contest")
            .select("contest.id", "id")
            .addSelect("contest.name", "name")
            .addSelect("contest.description", "description")
            .addSelect("contest.start", "start")
            .addSelect("contest.duration", "duration")
            .addSelect("COUNT(asignation.id)", "num_problems")
            .innerJoin("contest.asignations", "asignation")
            .groupBy("contest.id")
            .orderBy("contest.start", "DESC")
            .getRawMany(); // Devuelve los resultados como objetos planos
    },
    async findByProblemId(problemId: number): Promise<Contest[]> {
        const contests = await this.createQueryBuilder("contest")
            .innerJoinAndSelect("contest.asignations", "asignation")
            .innerJoinAndSelect("asignation.problem", "problem")
            .innerJoinAndSelect("contest.participations", "participation") // Asegúrate de tener la relación con participations
            .where("problem.id = :problemId", { problemId }) // Filtra por el problem.id
            .getMany(); // Devuelve los resultados como objetos de tipo Contest
        contests.filter(contest => contest.start.getTime() > Date.now() && sumMinutes(contest.start, contest.duration).getTime() > Date.now()); 
        return contests;
    }
});

