import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Asignation } from "./Asignation";


@Entity({ name: "problem" })
export class Problem { 
    @PrimaryColumn()
    id: number;

    @OneToMany(() => Asignation, (asignation) => asignation.problem)
    asignations: Asignation[];
}