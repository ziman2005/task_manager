from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlalchemy.orm import Session

from db import get_db
from models import Task, User
from schemas import TaskCreate, TaskResponse, TaskUpdate, TaskListResponse
from auth_utils import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def get_user_task_or_404(
    task_id: int,
    user_id: int,
    db: Session
):
    task = (
        db.query(Task)
        .filter(
            Task.id == task_id,
            Task.owner_id == user_id
        )
        .first()
    )

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED
)
def get_tasks(
    is_done: bool | None = None,
    search: str | None = None,
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Task).filter(Task.owner_id == current_user.id)

    if is_done is not None:
        query = query.filter(Task.is_done == is_done)

    if search:
        query = query.filter(Task.title.ilike(f"%{search}%"))

    total = query.count()

    tasks = (
        query
        .order_by(Task.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    return {
        "items": tasks,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = get_user_task_or_404(
        task_id=task_id,
        user_id=current_user.id,
        db=db
    )

    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = get_user_task_or_404(
        task_id=task_id,
        user_id=current_user.id,
        db=db
    )

    db.delete(task)
    db.commit()


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    new_task: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = get_user_task_or_404(
        task_id=task_id,
        user_id=current_user.id,
        db=db
    )

    update_data = new_task.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task