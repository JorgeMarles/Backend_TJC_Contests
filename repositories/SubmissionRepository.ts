import { AppDataSource } from '../database';
import { Submission } from '../database/entity/Submission';


export const SubmissionRepository = AppDataSource.getRepository(Submission);