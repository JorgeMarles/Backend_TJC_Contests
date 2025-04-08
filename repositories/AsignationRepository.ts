import { AppDataSource } from '../database';
import { Asignation } from '../database/entity/Asignation';


export const AsignationRepository = AppDataSource.getRepository(Asignation);