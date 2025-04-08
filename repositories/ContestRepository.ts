import { AppDataSource } from '../database';
import { Contest } from '../database/entity/Contest';


export const ContestRepository = AppDataSource.getRepository(Contest);