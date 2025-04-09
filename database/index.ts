import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from "../config";
import { DataSource } from 'typeorm';
import mysql from "mysql2";
import { Asignation } from "./entity/Asignation";
import { Contest } from "./entity/Contest";
import { Participation } from "./entity/Participation";
import { Problem } from "./entity/Problem";
import { Submission } from "./entity/SubmissionOverview";
import { User } from "./entity/User";


export const AppDataSource = new DataSource({
  type: 'mysql', 
  driver: mysql, 
  host: DB_HOST,
  port: parseInt(DB_PORT),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: true,
  entities: [Asignation, Contest, Participation, Problem, Submission, User]
});