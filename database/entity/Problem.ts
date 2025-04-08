import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Asignation } from "./Asignation";
import { Submission } from "./Submission";


@Entity({ name: "problem" })
export class Problem { 
    @PrimaryColumn()
    id: number;

    @OneToMany(() => Asignation, (asignation) => asignation.problem)
    asignations: Asignation[];

    @OneToMany(() => Submission, (submission) => submission.problem)
    submissions: Submission[];

    @Column("boolean")
    disable: boolean;
}