import { Repository } from 'typeorm';
import { Contest } from '../database/entity/Contest';


export interface ContestView {
    id: number;
    name: string;
    start_time: Date;
    duration: number;
    description: string;
    num_problems: number;
}

export class ContestRepository extends Repository<Contest> {
    async findBySearch(query: string): Promise<ContestView[]> {
        return this.createQueryBuilder("contest")
            .select("contest.id", "id")
            .addSelect("contest.name", "name")
            .addSelect("contest.description", "description")
            .addSelect("contest.start_time", "start_time")
            .addSelect("contest.duration", "duration")
            .addSelect("COUNT(asignation.id)", "num_problems")
            .where("LOWER(contest.name) LIKE :query OR LOWER(contest.description) LIKE :query", { query: `%${query}%` })
            .innerJoin("contest.asignations", "asignation")
            .groupBy("contest.id")
            .getRawMany(); // Devuelve los resultados como objetos planos
    }
}