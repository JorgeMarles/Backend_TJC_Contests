import { AppDataSource } from '../database';
import { User } from '../database/entity/User';


export const UserRepository = AppDataSource.getRepository(User);