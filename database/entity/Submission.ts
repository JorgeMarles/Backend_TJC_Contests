import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Participation } from "./Participation";
import { Problem } from "./Problem";


@Entity({ name: "submission" })
export class Submission {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Participation, (participation) => participation.submissions)
    participation: Participation;

    @ManyToOne(() => Problem, (problem) => problem.submissions)
    problem: Problem;

    @Column("varchar", { length: 100 })
    veredict: string; // verdict of the submission (AC, WA, TLE, MLE, RE, CE, etc.)
}