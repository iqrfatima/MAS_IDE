from typing import List, Optional
from sqlalchemy.orm import Session
from . import models, schemas

class HabitService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def create_habit(self, habit_in: schemas.HabitCreate) -> models.Habit:
        db_habit = models.Habit(**habit_in.dict(), user_id=self.user_id)
        self.db.add(db_habit)
        self.db.commit()
        self.db.refresh(db_habit)
        return db_habit

    def get_habits(self) -> List[models.Habit]:
        return self.db.query(models.Habit).filter(models.Habit.user_id == self.user_id).all()

    def get_habit(self, habit_id: int) -> Optional[models.Habit]:
        return self.db.query(models.Habit).filter(models.Habit.id == habit_id, models.Habit.user_id == self.user_id).first()

    def update_habit(self, habit_id: int, habit_in: schemas.HabitUpdate) -> Optional[models.Habit]:
        habit = self.get_habit(habit_id)
        if not habit:
            return None
        for field, value in habit_in.dict(exclude_unset=True).items():
            setattr(habit, field, value)
        self.db.commit()
        self.db.refresh(habit)
        return habit

    def delete_habit(self, habit_id: int) -> bool:
        habit = self.get_habit(habit_id)
        if not habit:
            return False
        self.db.delete(habit)
        self.db.commit()
        return True
