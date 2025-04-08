import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from "../config";
import { DataSource } from 'typeorm';
import mysql from "mysql2";
import { Asignation } from "./entities/Asignation";
import { Contest } from "./entities/Contest";
import { Participation } from "./entities/Participation";
import { Problem } from "./entities/Problem";
import { Submission } from "./entities/Submission";
import { User } from "./entities/User";


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