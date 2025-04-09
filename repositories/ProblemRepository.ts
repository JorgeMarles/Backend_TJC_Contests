import { AppDataSource } from '../database';
import { Problem } from '../database/entity/Problem';


export const ProblemRepository = AppDataSource.getRepository(Problem);