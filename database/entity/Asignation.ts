import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Problem } from "./Problem";
import { Contest } from './Contest';
import { SubmissionOverview } from "./SubmissionOverview";


@Entity({ name: "asignation" })
export class Asignation {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Problem, (problem) => problem.asignations)
    problem: Problem;

    @ManyToOne(() => Contest, (contest) => contest.asignations)
    contest: Contest;

    @OneToMany(() => SubmissionOverview, (submission) => submission.asignation)
    submissions: SubmissionOverview[]; // submissions related to this asignation

    @Column("tinyint")
    order: number; // order of the problem in the contest
}