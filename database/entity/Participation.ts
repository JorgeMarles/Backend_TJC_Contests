import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Contest } from "./Contest";
import { SubmissionOverview } from "./SubmissionOverview";


@Entity({ name: "participation" })
export class Participation {
    @PrimaryGeneratedColumn()
    id: number;
    
    @ManyToOne(() => User, (user) => user.participations)
    user: User;

    @ManyToOne(() => Contest, (contest) => contest.participations)
    contest: Contest;

    @Column("int")
    penalty: number; 

    @Column("int", {nullable: true})
    position?: number; // position in the leaderboard

    @OneToMany(() => SubmissionOverview, (submissionOverview) => submissionOverview.participation)
    submissions: SubmissionOverview[]; // submissions made by the user in this contest
}