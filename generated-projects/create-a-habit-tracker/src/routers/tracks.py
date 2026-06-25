from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import schemas, dependencies
from ..services.track_service import TrackService
from ..database import get_db

router = APIRouter(prefix="/tracks", tags=["tracks"])

@router.post("/{habit_id}", response_model=schemas.HabitEntryRead, status_code=status.HTTP_201_CREATED)
def add_entry(habit_id: int, entry_in: schemas.HabitEntryCreate, db: Session = Depends(get_db), current_user=Depends(dependencies.get_current_user)):
    service = TrackService(db, current_user.id)
    try:
        entry = service.add_entry(habit_id, entry_in)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return entry

@router.get("/{habit_id}", response_model=List[schemas.HabitEntryRead])
def list_entries(habit_id: int, db: Session = Depends(get_db), current_user=Depends(dependencies.get_current_user)):
    service = TrackService(db, current_user.id)
    return service.get_entries(habit_id)

@router.get("/{habit_id}/streak", response_model=schemas.StreakResponse)
def get_streak(habit_id: int, db: Session = Depends(get_db), current_user=Depends(dependencies.get_current_user)):
    service = TrackService(db, current_user.id)
    return service.get_streak(habit_id)
