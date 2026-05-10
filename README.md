# Task Manager API

Backend API для приложения Task Manager на FastAPI.

Проект поддерживает регистрацию пользователей, авторизацию через JWT, работу с задачами, фильтрацию, поиск и пагинацию. Каждая задача привязана к конкретному пользователю, поэтому пользователи видят и изменяют только свои задачи.

## Стек

* Python
* FastAPI
* PostgreSQL
* SQLAlchemy
* Pydantic
* JWT авторизация
* Passlib + bcrypt
* Uvicorn

## Основные возможности

* Регистрация пользователя
* Логин пользователя
* JWT access token
* Получение текущего пользователя
* Создание задач
* Получение списка задач текущего пользователя
* Получение одной задачи
* Частичное обновление задачи
* Удаление задачи
* Фильтрация задач по статусу
* Поиск задач по названию
* Пагинация
* CORS для frontend-разработки

## Установка и запуск

### 1. Клонировать репозиторий

```bash
git clone <repository-url>
cd tasks_manager
```

### 2. Создать виртуальное окружение

```bash
python -m venv .venv
```

### 3. Активировать виртуальное окружение

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Linux/macOS:

```bash
source .venv/bin/activate
```

### 4. Установить зависимости

```bash
pip install -r requirements.txt
```

### 5. Создать `.env`

Создай файл `.env` в корне проекта на основе `.env.example`.

Пример:

```env
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
```

### 6. Запустить сервер

```bash
uvicorn main:app --reload
```

После запуска API будет доступно по адресу:

```text
http://127.0.0.1:8000
```

Swagger-документация:

```text
http://127.0.0.1:8000/docs
```

## Авторизация

API использует JWT Bearer Token.

После логина backend возвращает:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer"
}
```

Для защищённых запросов frontend должен передавать токен в заголовке:

```http
Authorization: Bearer <access_token>
```

## Auth endpoints

### Регистрация

```http
POST /auth/register
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response `201 Created`:

```json
{
  "id": 1,
  "email": "user@example.com",
  "is_active": true
}
```

Возможные ошибки:

```json
{
  "detail": "User already exists"
}
```

---

### Логин

```http
POST /auth/login
```

Важно: login принимает данные как form-data, потому что используется `OAuth2PasswordRequestForm`.

Form fields:

```text
username=user@example.com
password=password123
```

Response `200 OK`:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer"
}
```

Возможные ошибки:

```json
{
  "detail": "Invalid email or password"
}
```

---

### Получить текущего пользователя

```http
GET /auth/me
```

Headers:

```http
Authorization: Bearer <access_token>
```

Response `200 OK`:

```json
{
  "id": 1,
  "email": "user@example.com",
  "is_active": true
}
```

## Task endpoints

Все task endpoints требуют авторизацию через JWT.

---

### Получить список задач

```http
GET /tasks
```

Query parameters:

| Параметр  | Тип     | Описание                                        |
| --------- | ------- | ----------------------------------------------- |
| `is_done` | boolean | Фильтр по статусу задачи                        |
| `search`  | string  | Поиск по названию задачи                        |
| `limit`   | integer | Количество задач на странице, по умолчанию `10` |
| `offset`  | integer | Смещение для пагинации, по умолчанию `0`        |

Примеры:

```http
GET /tasks
GET /tasks?is_done=false
GET /tasks?search=fastapi
GET /tasks?limit=10&offset=0
GET /tasks?is_done=false&search=python&limit=5&offset=0
```

Response `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "title": "Learn FastAPI",
      "description": "JWT authorization",
      "is_done": false,
      "created_at": "2026-05-10T12:30:15.123456",
      "updated_at": "2026-05-10T12:30:15.123456"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

### Создать задачу

```http
POST /tasks
```

Request body:

```json
{
  "title": "Learn FastAPI",
  "description": "Add JWT authorization",
  "is_done": false
}
```

`is_done` можно не передавать. По умолчанию задача создаётся со статусом `false`.

Response `201 Created`:

```json
{
  "id": 1,
  "title": "Learn FastAPI",
  "description": "Add JWT authorization",
  "is_done": false,
  "created_at": "2026-05-10T12:30:15.123456",
  "updated_at": "2026-05-10T12:30:15.123456"
}
```

---

### Получить одну задачу

```http
GET /tasks/{task_id}
```

Response `200 OK`:

```json
{
  "id": 1,
  "title": "Learn FastAPI",
  "description": "Add JWT authorization",
  "is_done": false,
  "created_at": "2026-05-10T12:30:15.123456",
  "updated_at": "2026-05-10T12:30:15.123456"
}
```

Если задача не найдена или принадлежит другому пользователю:

```json
{
  "detail": "Task not found"
}
```

---

### Обновить задачу

```http
PATCH /tasks/{task_id}
```

Можно передавать только те поля, которые нужно изменить.

Request body examples:

```json
{
  "title": "Updated title"
}
```

```json
{
  "is_done": true
}
```

```json
{
  "description": null
}
```

Response `200 OK`:

```json
{
  "id": 1,
  "title": "Updated title",
  "description": null,
  "is_done": true,
  "created_at": "2026-05-10T12:30:15.123456",
  "updated_at": "2026-05-10T13:10:00.123456"
}
```

---

### Удалить задачу

```http
DELETE /tasks/{task_id}
```

Response:

```text
204 No Content
```

Если задача не найдена или принадлежит другому пользователю:

```json
{
  "detail": "Task not found"
}
```

## CORS

Для frontend-разработки backend разрешает запросы с локальных адресов, например:

```text
http://localhost:5173
http://127.0.0.1:5173
http://localhost:3000
http://127.0.0.1:3000
```

Frontend должен отправлять JWT в заголовке `Authorization`.

## Структура проекта

```text
main.py
config.py
db.py
models.py
schemas.py
auth_utils.py
auth.py
tasks.py
requirements.txt
.env.example
.gitignore
```

## Важные замечания для frontend

* `POST /auth/login` принимает не JSON, а form-data.
* В поле `username` нужно передавать email пользователя.
* После логина нужно сохранить `access_token`.
* Для всех `/tasks` запросов нужно передавать заголовок `Authorization: Bearer <token>`.
* Frontend не должен передавать `owner_id`, `created_at`, `updated_at` или `id` при создании/обновлении задачи.
* Backend сам определяет текущего пользователя по JWT.

## План дальнейшего развития

* Alembic migrations
* Docker
* Тесты
* Refresh tokens
* Logout / token blacklist
* Роли пользователей
* Soft delete задач
