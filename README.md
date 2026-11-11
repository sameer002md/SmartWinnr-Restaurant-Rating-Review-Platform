# SmartWinnr – Restaurant Rating & Review Platform

A MERN-stack web application where customers discover restaurants and submit ratings/reviews, restaurant owners manage their assigned restaurant, and administrators manage users, restaurants, owners, and reviews.

## Tech stack

- **Frontend:** React, Vite, Axios, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas / MongoDB, Mongoose
- **Authentication:** JSON Web Tokens (JWT)
- **Password security:** bcryptjs
- **API testing:** Postman or Thunder Client

## Features

### Customer
- Register and log in.
- Browse restaurants and search by restaurant name, location, or cuisine.
- View restaurant details, average rating, and review count.
- Submit one rating (1–5) and review per restaurant.
- View, update, and delete their own reviews.

### Restaurant owner
- Log in to an owner account created by an administrator.
- View assigned restaurant(s).
- View reviews and customers who reviewed the restaurant.
- View average restaurant rating.
- Update permitted restaurant details.

### Administrator
- View dashboard statistics: total users, customers, owners, restaurants, reviews, and average platform rating.
- Create and manage restaurants.
- Create restaurant-owner accounts and assign owners to restaurants.
- Search/filter users and restaurants.
- View reviews and remove inappropriate reviews.
- Activate/deactivate user accounts.

## Project structure

```text
SmartWinnr/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── ...
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── README.md
```

## Prerequisites

- Node.js (LTS recommended)
- npm
- MongoDB Atlas account or local MongoDB
- Git

## Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd SmartWinnr
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a local `.env` file by copying `.env.example`:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS/Linux**
```bash
cp .env.example .env
```

Update the values in `backend/.env`. Use your own MongoDB connection string and strong random JWT secret. Do not commit `.env`.

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000` by default.

Health check:

```text
GET http://localhost:5000/api/health
```

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## Environment variables

See `backend/.env.example`. Required values:
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: long, random secret used to sign JWTs.
- `PORT`: backend port (default `5000`).
- `CLIENT_URL`: frontend origin allowed by CORS.
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: bootstrap admin values if your local project uses the `create-admin` script.

Never publish real database credentials, JWT secrets, or account passwords.

## API overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | API/database health |
| POST | `/auth/register` | Public | Register customer |
| POST | `/auth/login` | Public | Login |
| GET | `/auth/me` | Authenticated | Current user |
| GET | `/restaurants` | Public | Browse/search restaurants |
| GET | `/restaurants/:id` | Public | Restaurant details |
| GET | `/restaurants/owner/my-restaurants` | Owner | Assigned restaurants |
| GET | `/restaurants/owner/:id/reviews` | Owner | Reviews for owned restaurant |
| PUT | `/restaurants/owner/:id` | Owner | Update permitted restaurant details |
| POST | `/restaurants` | Admin | Create restaurant |
| PUT | `/restaurants/:id/assign-owner` | Admin | Assign owner |
| PUT | `/restaurants/:id` | Admin | Update restaurant |
| DELETE | `/restaurants/:id` | Admin | Deactivate/remove restaurant |
| GET | `/reviews/restaurant/:restaurantId` | Public | Reviews for a restaurant |
| GET | `/reviews/my-reviews` | Customer | Current customer's reviews |
| POST | `/reviews` | Customer | Create review |
| PUT | `/reviews/:id` | Review owner | Update own review |
| DELETE | `/reviews/:id` | Review owner | Delete own review |
| GET | `/reviews/admin` | Admin | View all reviews |
| DELETE | `/reviews/admin/:id` | Admin | Remove inappropriate review |
| GET | `/admin/stats` | Admin | Dashboard statistics |
| GET | `/admin/users` | Admin | List/search/filter users |
| POST | `/admin/users/owners` | Admin | Create owner account |
| PATCH | `/admin/users/:id/status` | Admin | Activate/deactivate user |

Protected requests use:

```http
Authorization: Bearer <JWT_TOKEN>
```

Restaurant search supports query parameters such as `?search=Spice` and, where implemented by the API, `?location=Hyderabad&cuisine=Indian`.

## Database design

The application uses three primary MongoDB collections:

- `users`: customer, owner, and admin accounts.
- `restaurants`: restaurant information and an owner reference.
- `reviews`: customer reference, restaurant reference, rating, and comment.

A customer can review a restaurant only once. The customer–restaurant relationship is protected by a unique compound index. Reviews use ObjectId references and timestamps; populated review responses include customer and restaurant details where appropriate.

## Validation and security

- Passwords are hashed with bcryptjs; plaintext passwords are not stored.
- JWT authentication protects private endpoints.
- Role authorization is enforced in Express middleware, not only by hiding frontend controls.
- Rating values must be whole numbers from 1 through 5.
- Duplicate customer/restaurant reviews are rejected.
- Review ownership and restaurant ownership are checked by the backend.
- User and restaurant IDs are validated before database operations.
- Use `.env` for secrets; `.env` must not be committed.

## API testing

Import `postman/SmartWinnr.postman_collection.json` into Postman. Set collection variables:
- `baseUrl` = `http://localhost:5000/api`
- `adminEmail`, `adminPassword`
- `customerEmail`, `customerPassword`
- `ownerEmail`, `ownerPassword`

Login requests store the returned JWT in the corresponding collection variable (`adminToken`, `customerToken`, `ownerToken`). The collection includes example requests for the main customer, owner, and admin workflows. Set `restaurantId`, `reviewId`, `ownerId`, and `userId` after creating or retrieving the relevant records. Do not run destructive delete requests against data you need to keep.

## Sample role accounts

Create or seed local test accounts before running the protected API tests. Use your own test credentials and record them in a private submission note if required. **Do not commit real passwords or production credentials to a public repository.**

| Role | Email variable | Password variable |
|---|---|---|
| Administrator | `adminEmail` | `adminPassword` |
| Customer | `customerEmail` | `customerPassword` |
| Restaurant Owner | `ownerEmail` | `ownerPassword` |

## HTTP status codes

The API uses standard status codes, including `200` (success), `201` (created), `400` (invalid input), `401` (missing/invalid authentication), `403` (insufficient role/permission), `404` (not found), `409` (duplicate/conflict), and `500` (unexpected server error).

## Notes before submission

1. Confirm both frontend and backend start from a clean install.
2. Confirm MongoDB is reachable and `.env` is configured locally.
3. Test each role using the Postman collection.
4. Include screenshots of the customer, owner, and admin flows if requested.
5. Push source code, README, `.env.example`, and the API collection to GitHub.
6. Verify `.env`, `node_modules`, build output, and secrets are excluded from Git.

## License

For assessment/demo use. Add a license if you intend to distribute the project.
