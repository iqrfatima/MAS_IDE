import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Unique } from "typeorm";
import { Habit } from "./Habit";

@Entity({ name: "habit_entries" })
@Unique(["habit", "date"])
export class HabitEntry {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Habit, habit => habit.entries, { onDelete: "CASCADE" })
  habit!: Habit;

  @Column({ type: "date" })
  date!: string;

  @Column({ default: false })
  completed!: boolean;

  @CreateDateColumn({ type: "datetime" })
  created_at!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updated_at!: Date;
}