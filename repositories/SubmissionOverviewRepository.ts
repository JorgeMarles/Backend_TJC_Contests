import { AppDataSource } from '../database';
import { SubmissionOverview } from '../database/entity/SubmissionOverview';


export const SubmissionOverviewRepository = AppDataSource.getRepository(SubmissionOverview);