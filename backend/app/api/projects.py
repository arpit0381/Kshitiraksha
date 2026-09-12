import uuid
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.api import deps
from app.models.project import Project as ProjectModel
from app.schemas.models import ProjectResponse, ProjectCreate

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(deps.get_db)):
    return db.query(ProjectModel).order_by(ProjectModel.created_at.desc()).all()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(deps.get_db)):
    proj = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj

@router.post("", response_model=ProjectResponse)
def create_project(payload: ProjectCreate, db: Session = Depends(deps.get_db)):
    new_id = f"proj-{int(datetime.now().timestamp())}-{str(uuid.uuid4())[:6]}"
    proj = ProjectModel(
        id=new_id,
        name=payload.name,
        description=payload.description,
        department=payload.department,
        aoi_ids=payload.aoi_ids,
        monitoring_frequency=payload.monitoring_frequency,
        status=payload.status
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj
