# Crew Backend API

Express + PostgreSQL backend for the Crew Agent Teams Workflow Management Platform.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Run Migrations

```bash
npm run migrate
```

### 4. Start Server

```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `POST /api/users/register` | Register new user |
| `POST /api/users/login` | User login |
| `GET /api/users/me` | Get current user |
| `GET /api/projects` | List projects |
| `POST /api/projects` | Create project |
| `GET /api/projects/:id` | Get project details |
| `PUT /api/projects/:id` | Update project |
| `DELETE /api/projects/:id` | Delete project |
| `GET /api/tasks` | List tasks |
| `POST /api/tasks` | Create task |
| `GET /api/tasks/:id` | Get task details |
| `PUT /api/tasks/:id` | Update task |
| `PATCH /api/tasks/:id/status` | Update task status |
| `DELETE /api/tasks/:id` | Delete task |
| `GET /api/agents` | List agents |
| `POST /api/agents` | Register agent |
| `GET /api/agents/:id` | Get agent details |
| `PUT /api/agents/:id` | Update agent |
| `PATCH /api/agents/:id/status` | Update agent status |
| `DELETE /api/agents/:id` | Delete agent |
| `GET /api/teams` | List team templates |
| `POST /api/teams` | Create team template |
| `GET /api/teams/:id` | Get team template |
| `PUT /api/teams/:id` | Update team template |
| `POST /api/teams/:id/apply` | Apply team to project |
| `DELETE /api/teams/:id` | Delete team template |
| `GET /api/execution` | List executions |
| `POST /api/execution` | Start execution |
| `GET /api/execution/:id` | Get execution details |
| `PATCH /api/execution/:id` | Update execution |
| `POST /api/execution/:id/retry` | Retry failed execution |
| `DELETE /api/execution/:id` | Cancel execution |

## Authentication

All API endpoints (except `/health`, `/api/users/register`, and `/api/users/login`) require JWT authentication.

Include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Default Admin User

- Username: `admin`
- Password: `admin123`

**⚠️ Change this password in production!**

## Task Status Flow

```
pending → running → completed
   ↓         ↓
 waiting_retry / waiting_human / fallback
   ↓         ↓
   └────────→ failed → skipped
```

## Agent Statuses

- `idle` -空闲
- `online` - 在线
- `busy` - 工作
- `thinking` - 思考
- `error` - 异常
- `offline` - 离线

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment mode |
| `PORT` | 3001 | Server port |
| `JWT_SECRET` | (dev only) | JWT signing secret |
| `JWT_EXPIRES_IN` | 604800 | Token expiration (7 days) |
| `PGHOST` | localhost | PostgreSQL host |
| `PGPORT` | 5432 | PostgreSQL port |
| `PGDATABASE` | crew | Database name |
| `PGUSER` | postgres | Database user |
| `PGPASSWORD` | postgres | Database password |
