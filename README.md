# Kindora Server

Express.js REST API for the Kindora Social Impact Platform.

## Environment Variables

Create a `.env` file with:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your-mongodb-connection-string
CLIENT_URL=http://localhost:3000
AUTH_BASE_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret
JWT_ISSUER=http://localhost:3000
JWT_AUDIENCE=kindora-api
JWKS_URL=http://localhost:3000/api/auth/jwks
```

## Install & Run

```bash
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | /api/events | Public | Get upcoming events |
| GET | /api/events/recent | Public | Get six recent events |
| GET | /api/events/:id | Public | Get event details |
| POST | /api/events | JWT | Create event |
| GET | /api/my-events | JWT | Get user's events |
| PATCH | /api/events/:id | JWT + Owner | Update event |
| DELETE | /api/events/:id | JWT + Owner | Delete event |
| POST | /api/events/:id/join | JWT | Join event |
| GET | /api/my-joined-events | JWT | Get joined events |
| GET | /api/users/me | JWT | Get profile |
| PATCH | /api/users/me | JWT | Update profile |
