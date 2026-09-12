from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.api import deps
from app.models.event import ChangeEvent as EventModel
from app.models.user import User
from app.schemas.models import ChangeEventResponse, ReviewUpdateRequest

router = APIRouter(prefix="/events", tags=["Change Events"])

@router.get("", response_model=List[ChangeEventResponse])
def list_events(
    aoi_id: Optional[str] = Query(None), 
    db: Session = Depends(deps.get_db), 
    current_user: Optional[User] = Depends(deps.get_current_user_optional)
):
    query = db.query(EventModel)
    if aoi_id:
        query = query.filter(EventModel.aoi_id == aoi_id)
    return query.order_by(EventModel.created_at.desc()).all()

@router.get("/{event_id}", response_model=ChangeEventResponse)
def get_event(
    event_id: str, 
    db: Session = Depends(deps.get_db), 
    current_user: Optional[User] = Depends(deps.get_current_user_optional)
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.patch("/{event_id}/review", response_model=ChangeEventResponse)
def update_review(
    event_id: str, 
    payload: ReviewUpdateRequest, 
    db: Session = Depends(deps.get_db), 
    current_user: Optional[User] = Depends(deps.get_current_user_optional)
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.review_status = payload.status
    if payload.notes:
        event.review_notes = payload.notes
        
    db.commit()
    db.refresh(event)
    return event
