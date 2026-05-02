# Study Finder
## By Rafat


A full-stack web application that allows students to create and join study sessions. Users can post study sessions with a location, subject, and available spots, and other users can request to join them. The application features real-time updates using WebSockets.

---

## Tech Stack

**Backend**
- Node.js
- Express
- MongoDB / Mongoose
- Socket.IO
- JSON Web Token (JWT)
- Bcrypt

**Frontend**
- Angular
- Socket.IO Client
- RxJS

---

## Features

- User registration and login with JWT authentication
- Create, edit, and delete study sessions
- Request to join other users' study sessions
- Accept or decline incoming join requests
- Dismiss responded requests
- Geolocation-based session filtering by distance (1, 5, 10, 25 km)
- Real-time updates via WebSockets:
  - `request:received` — session owner is notified when someone requests to join
  - `request:accepted` — requester is notified when their request is accepted
  - `request:declined` — requester is notified when their request is declined
  - `request:deleted` — both owner and requester are notified when a request is dismissed
  - `session:created` — all users see new sessions in real time
  - `session:updated` — all users see spot count updates in real time
  - `session:deleted` — all users see session removals in real time

---

## Data Models

**User**
- Signup, login, fetch current user
- Stores last known location for geolocation filtering

**StudySession**
- Full CRUD
- Fields: title, subject, date, location, spotsAvailable, coordinates (GeoJSON)

**JoinRequest**
- Full CRUD
- Fields: sessionId, userId, message, status (pending / accepted / declined)

---

## Project Structure

```
study-finder-be/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── sessionController.js
│   │   └── joinRequestController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── StudySession.js
│   │   └── JoinRequest.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── sessionRoutes.js
│   │   └── joinRequestRoutes.js
│   ├── app.js
│   ├── server.js
│   └── socket.js
├── frontend/
│   └── src/
│       └── app/
│           ├── core/
│           │   ├── auth.service.ts
│           │   ├── session.service.ts
│           │   ├── join-request.service.ts
│           │   ├── realtime.service.ts
│           │   └── models.ts
│           └── features/
│               ├── auth/
│               └── dashboard/
├── package.json
└── .env
```

---

## Getting Started

### Prerequisites

- Node.js
- MongoDB database

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/Rafat-i/study-finder-be.git
cd study-finder-be
```

2. Install backend dependencies:
```bash
npm install
```

3. Create a `.env` file at the root of the project (see Environment Variables section below)

4. Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:5000` by default.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Update the API URL in `src/environments/environment.ts` to point to your backend:
```ts
export const environment = {
  apiUrl: 'http://localhost:5000'
};
```

4. Start the frontend:
```bash
npm start
```

The app will run on `http://localhost:4200`.

---

## Environment Variables

Create a `.env` file at the root of the project with the following variables:

```
PORT=5000
MONGODB_URI=mongodb_connection_string
JWT_SECRET=jwt_secret_key
```

| Variable      | Description                              |
|---------------|------------------------------------------|
| PORT          | Port the backend server runs on          |
| MONGODB_URI   | MongoDB connection string                |
| JWT_SECRET    | Secret key used to sign JWT tokens       |

---

## API Endpoints

### Auth
| Method | Endpoint        | Access  | Description          |
|--------|-----------------|---------|----------------------|
| POST   | /auth/register  | Public  | Register a new user  |
| POST   | /auth/login     | Public  | Login and get token  |
| GET    | /auth/me        | Private | Get current user     |

### Sessions
| Method | Endpoint          | Access  | Description              |
|--------|-------------------|---------|--------------------------|
| POST   | /sessions         | Private | Create a session         |
| GET    | /sessions         | Private | Get all sessions         |
| GET    | /sessions/:id     | Private | Get a session by ID      |
| PATCH  | /sessions/:id     | Private | Update a session         |
| DELETE | /sessions/:id     | Private | Delete a session         |

### Join Requests
| Method | Endpoint              | Access  | Description                    |
|--------|-----------------------|---------|--------------------------------|
| POST   | /join-requests        | Private | Send a join request            |
| GET    | /join-requests        | Private | Get incoming requests          |
| GET    | /join-requests/sent   | Private | Get sent requests              |
| GET    | /join-requests/:id    | Private | Get a request by ID            |
| PATCH  | /join-requests/:id    | Private | Accept or decline a request    |
| DELETE | /join-requests/:id    | Private | Delete or dismiss a request    |

---

## Deployment

The application is deployed on Render.

- Backend: https://study-finder-be.onrender.com
- Frontend: https://study-finder-be-1.onrender.com