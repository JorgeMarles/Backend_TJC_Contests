import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Problem } from "./Problem";
import { Contest } from './Contest';


@Entity({ name: "asignation" })
export class Asignation {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Problem, (problem) => problem.asignations)
    problem: Problem;

    @ManyToOne(() => Contest, (contest) => contest.asignations)
    contest: Contest;

    @Column("tinyint")
    order: number; // order of the problem in the contest
}