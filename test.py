from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from tasks import router


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str | None = Field(default=None, min_length=5, max_length=500)
    is_done: bool


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    is_done: bool


class TaskUpdate(BaseModel):
    title: str|None = Field(default=None, min_length=3, max_length=100)
    description: str|None = Field(default=None, min_length=5, max_length=500)
    is_done: bool|None = Field(default=None)

app = FastAPI()
app.include_router(router)

tasks = []


@app.get('/')
def root():
    return{"message" : "Task Manager API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/tasks", response_model=list[TaskResponse])
def get_tasks(limit: int = 10, offset: int  = 0):
    return tasks[offset:offset+limit]


@app.get("/tasks/search")
def search_tasks(q: str):
    return {"q" : q}


@app.get('/about')
def about():
    return {
        "project": "Task Manager API",
        "version": "0.1.0"
    }


@app.get('/users')
def get_users():
    return {"users" : []}


@app.get('/tasks/{task_id}', response_model=TaskResponse)
def get_task(task_id: int):
    for task in tasks:
        if task["id"] == task_id:
            return task
        
    raise HTTPException(status_code=404, detail="Task not found")


@app.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate):
    task_id = len(tasks) + 1
    task_dict = {
        "id": task_id,
        "title": task.title,
        "description": task.description,
        "is_done": task.is_done
    }

    tasks.append(task_dict)
    return {
        **task_dict
    }


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    for task in tasks:
        if task["id"] == task_id:
            tasks.remove(task)

            return {"message": "Task deleted"}

    raise HTTPException(status_code=404, detail="Task not found")


@app.put("/tasks/{task_id}")
def update_task(task_id: int, new_task: TaskUpdate):
    for task in tasks:
        if task["id"] == task_id:
            if new_task.title is not None:
                task["title"] = new_task.title
            if new_task.description is not None:
                task["description"] = new_task.description
            if new_task.is_done is not None:
                task["is_done"] = new_task.is_done

            return {"message": "Task updated"}
        
    raise HTTPException(status_code=404, detail="Task not found")