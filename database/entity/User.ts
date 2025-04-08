import { Entity, OneToMany, PrimaryColumn, Column } from "typeorm";
import { Participation } from "./Participation";

@Entity({ name: "user" })
export class User {
    @PrimaryColumn()
    id: number;

    @OneToMany(() => Participation, (participation) => participation.user)
    participations: Participation[];
}

