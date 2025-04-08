import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Participation } from "./Participation";
import { Problem } from "./Problem";


@Entity({ name: "submission" })
export class Submission {
    @Column("varchar", { length: 256 })
    id: string;

    @ManyToOne(() => Participation, (participation) => participation.submissions)
    participation: Participation;

    @ManyToOne(() => Problem, (problem) => problem.submissions)
    problem: Problem;

    @Column("varchar", { length: 100 })
    veredict: string; // verdict of the submission

    @Column("datetime")
    time_judge: Date;
}