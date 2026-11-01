# Kindora API

Express + MongoDB REST API for **Kindora**, a social development events platform.

**Live API:** https://server-delta-five-18.vercel.app
**Client repository:** https://github.com/ariandesu/Assignment8-frontend

## Authentication

The Next.js client signs users in with Better Auth. Its JWT plugin issues short-lived tokens (`GET /api/auth/token`) and publishes public keys at `/api/auth/jwks`. This API verifies the `Authorization: Bearer <token>` header against that JWKS (`jose`), checking issuer and audience. Owner-only actions compare the token's user id with the event's `creatorId`.

## Environment Variables

```env
PORT=5001
MONGODB_URI=mongodb+srv://...
DB_NAME=kindora
CLIENT_URL=http://localhost:3000                     # allowed CORS origin(s), comma-separated
JWKS_URL=http://localhost:3000/api/auth/jwks          # <client-url>/api/auth/jwks
JWT_ISSUER=http://localhost:3000                      # must match the client's JWT_ISSUER
JWT_AUDIENCE=kindora-api                              # must match the client's JWT_AUDIENCE
```

## Run Locally

```bash
npm install
npm run dev
```

## Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/events` | Public | Upcoming events (`search`, `category`, `location`, `page`, `limit`) |
| GET | `/api/events/recent` | Public | Six nearest upcoming events (`.limit(6)`) |
| GET | `/api/events/:id` | Public | Event details with participant count |
| POST | `/api/events` | JWT | Create event (future date required) |
| PATCH | `/api/events/:id` | JWT + owner | Update event |
| DELETE | `/api/events/:id` | JWT + owner | Delete event and its participants |
| POST | `/api/events/:id/join` | JWT | Join event (once per user) |
| GET | `/api/events/:id/join-status` | JWT | Whether the user joined |
| GET | `/api/my-events` | JWT | Events created by the user |
| GET | `/api/my-joined-events` | JWT | Joined events sorted by event date |
| GET | `/api/users/me` | JWT | Identity from the token |
