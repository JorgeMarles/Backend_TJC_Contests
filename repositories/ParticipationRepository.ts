import { AppDataSource } from '../database';
import { Participation } from '../database/entity/Participation';


export const ParticipationRepository = AppDataSource.getRepository(Participation);