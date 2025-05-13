import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Timestamp } from "typeorm";
import { Participation } from "./Participation";
import { Asignation } from "./Asignation";
import { sumMinutes } from "../../util/dateCalculations";

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

    @Column("float", { default: 0 })
    difficulty: number;

    @Column("boolean", { default: false })
    ended: boolean;

    getEndTime(): Date {        
        return sumMinutes(this.start, this.duration);;
    }
}
