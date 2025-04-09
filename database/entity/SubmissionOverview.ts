import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Participation } from "./Participation";
import { Problem } from "./Problem";
import { Asignation } from "./Asignation";


@Entity({ name: "submissionoverview" })
export class SubmissionOverview {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Participation, (participation) => participation.submissions)
    participation: Participation;

    @ManyToOne(() => Asignation, (asignation) => asignation.submissions)
    asignation: Asignation;

    @Column("int")
    attemps: number;

    @Column("boolean")
    solved: boolean;

    @Column("int")
    time: number;
}