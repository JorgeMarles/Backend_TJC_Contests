import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Timestamp } from "typeorm";
import { Participation } from "./Participation";
import { Asignation } from "./Asignation";

@Entity({ name: "contest" })
export class Contest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { length: 100 })
    name: string;

    @Column("varchar", { length: 100 })
    description: string;

    @Column("datetime")
    start: Date;

    @Column("int")
    duration: number; // in minutes

    @Column("boolean", { default: false })
    disable: boolean;

    @OneToMany(() => Participation, (participation) => participation.contest)
    participations: Participation[];

    @OneToMany(() => Asignation, (asignation) => asignation.contest)
    asignations: Asignation[];
}
