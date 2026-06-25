from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import schemas, dependencies
from ..services.habit_service import HabitService
from ..database import get_db

router = APIRouter(prefix="/habits", tags=["habits"])

@router.post("/", response_model=schemas.HabitRead, status_code=status.HTTP_201_CREATED)
def create_habit(habit_in: schemas.HabitCreate, db: Session = Depends(get_db), current_user=Depends(dependencies.get_current_user)):
    service = HabitService(db, current_user.id)
    habit = service.create_habit(habit_in)
    return habit

@router.get("/", response_model=List[schemas.HabitRead])
def list_habits(db: Session = Depends(get_db), current_user=Depends(dependencies.get_current_user)):
    service = HabitService(db, current_user.id)
    return service.get_habits()

@router.get("/{habit_id}", response_model=schemas.HabitRead)
def get_habit(habit_id: int, db: Session = Depends(get_db), current_user=Depends(dependencies.get_current_user)):
    service = HabitService(db, current_user.id)
    habit = service.get_habit(habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit

@router.put("/{habit_id}", response_model=schemas.HabitRead)
def update_habit(habit_id: int, habit_in: schemas.HabitUpdate, db: Session = Depends(get_db), current_user=Depends(dependencies.get_current_user)):
    service = HabitService(db, current_user.id)
    habit = service.update_habit(habit_id, habit_in)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit

@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(habit_id: int, db: Session = Depends(get_db), current_user=Depends(dependencies.get_current_user)):
    service = HabitService(db, current_user.id)
    success = service.delete_habit(habit_id)
    if not success:
        raise HTTPException(status_code=404, detail="Habit not found")
    return None
