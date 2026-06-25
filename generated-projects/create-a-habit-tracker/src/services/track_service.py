from datetime import date
from typing import List
from sqlalchemy.orm import Session
from . import models, schemas

class TrackService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def add_entry(self, habit_id: int, entry_in: schemas.HabitEntryCreate) -> models.HabitEntry:
        # Ensure habit belongs to user
        habit = self.db.query(models.Habit).filter(models.Habit.id == habit_id, models.Habit.user_id == self.user_id).first()
        if not habit:
            raise ValueError("Habit not found or not owned by user")
        entry = models.HabitEntry(habit_id=habit_id, date=entry_in.date, completed=entry_in.completed)
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def get_entries(self, habit_id: int) -> List[models.HabitEntry]:
        return self.db.query(models.HabitEntry).filter(models.HabitEntry.habit_id == habit_id).order_by(models.HabitEntry.date).all()

    def get_streak(self, habit_id: int) -> schemas.StreakResponse:
        entries = self.get_entries(habit_id)
        if not entries:
            return schemas.StreakResponse(current_streak=0, longest_streak=0)
        # Calculate streaks
        sorted_dates = [e.date for e in entries if e.completed]
        if not sorted_dates:
            return schemas.StreakResponse(current_streak=0, longest_streak=0)
        sorted_dates.sort()
        longest = 1
        current = 1
        prev = sorted_dates[0]
        for d in sorted_dates[1:]:
            if (d - prev).days == 1:
                current += 1
            else:
                longest = max(longest, current)
                current = 1
            prev = d
        longest = max(longest, current)
        # Current streak ends today if last entry date is today and completed
        today = date.today()
        if sorted_dates[-1] == today:
            current_streak = current
        else:
            current_streak = 0
        return schemas.StreakResponse(current_streak=current_streak, longest_streak=longest)
