# Bidshop – Bidfood SDET Technical Test

Welcome! This repository is a small two-service application that mimics the
sort of food-supply e-commerce site Bidfood runs. It intentionally ships with
**no automated tests** – the goal of the exercise is for you to design and
build a test suite that you would be comfortable owning in production.

The stack:

| Service    | Path        | Tech                                          |
|------------|-------------|-----------------------------------------------|
| API        | `backend/`  | Node.js + Express + TypeScript (in-memory DB) |
| Web app    | `frontend/` | React 18 + Vite + TypeScript + React Router   |

See `CANDIDATE_INSTRUCTIONS.md` for the full exercise brief.

---

## 1. Prerequisites

You need the following installed locally. Exact versions are suggestions –
anything in the same major line should be fine.

| Tool     | Recommended version | Check command        |
|----------|---------------------|----------------------|
| Node.js  | 18.x or 20.x LTS    | `node --version`     |
| npm      | 9.x or 10.x         | `npm --version`      |
| Git      | any modern version  | `git --version`      |

No database, Docker, or cloud accounts are required. Both services run
locally and the API stores everything in memory.

---

## 2. Getting the code

```bash
# Clone or unzip the repo, then:
cd bidshop
```

You will see two sibling folders:

```
.
├── backend/     # Express API
├── frontend/    # React web app
├── README.md               <- this file
└── CANDIDATE_INSTRUCTIONS.md
```

Install the dependencies for each service. They are independent npm packages
so you install them separately.

```bash
# From the repo root:
cd backend && npm install
cd ../frontend && npm install
cd ..
```

Expect the first `npm install` in each folder to take 30–90 seconds.

---

## 3. Running the services

You will need **two terminals** open – one for the API and one for the web
app.

### Terminal 1 – start the API

```bash
cd backend
npm run dev
```

You should see:

```
[bidshop-api] listening on http://localhost:4000
```

Quick smoke test in another shell:

```bash
curl http://localhost:4000/health
# -> {"status":"ok","service":"bidshop-api","time":"..."}
```

### Terminal 2 – start the web app

```bash
cd frontend
npm run dev
```

Vite will print something like:

```
  VITE v5.x  ready in 400 ms
  ➜  Local:   http://localhost:5173/
```

Open <http://localhost:5173/> in your browser. You should see the Bidshop
product catalogue. Registering a new account lets you add items to the cart
and place an order.

### Swagger / OpenAPI

The API ships with interactive API documentation:

- **Swagger UI** – <http://localhost:4000/api-docs>
- **Raw OpenAPI 3.0 spec** – <http://localhost:4000/openapi.json>

Swagger UI lets you browse every endpoint, see request/response schemas,
and execute calls directly from the browser (use the **Authorize** button
at the top to paste in a Bearer token from `/auth/login`). The raw JSON
spec is handy if you want to drive generated clients or schema
validation from your tests.

### Ports and config

|            | Port   | Override via                             |
|------------|--------|------------------------------------------|
| Backend    | `4000` | `PORT` env var (see `backend/.env.example`) |
| Frontend   | `5173` | `vite.config.ts`                         |

If you need to change the API URL the frontend talks to, create
`frontend/.env` with `VITE_API_BASE_URL=http://localhost:4000`.

---

## 4. Building for production (optional)

```bash
# Backend
cd backend
npm run build     # tsc -> dist/
npm start         # runs dist/index.js

# Frontend
cd frontend
npm run build     # tsc + vite build -> dist/
npm run preview   # serves the built site on :4173
```

You should not need production builds to complete the SDET exercise, but
they are handy if you want to pin down behaviour that only surfaces when
Vite/tsc strips dev helpers.

---

## 5. API reference

Base URL: `http://localhost:4000`

> 💡 For the full interactive reference with request/response schemas, open
> <http://localhost:4000/api-docs> once the backend is running. The summary
> below is a quick cheat sheet.

### Auth

| Method | Path              | Auth   | Body                                   | Success                                          |
|--------|-------------------|--------|----------------------------------------|--------------------------------------------------|
| POST   | `/auth/register`  | –      | `{ email, password, name }`            | `201 { token, user }`                            |
| POST   | `/auth/login`     | –      | `{ email, password }`                  | `200 { token, user }`                            |
| GET    | `/auth/me`        | Bearer | –                                      | `200 { id, email, name }`                        |

Validation rules worth exploring:

- `email` must match a basic email regex, otherwise `400`.
- `password` must be ≥ 6 characters, otherwise `400`.
- Registering with an existing email returns `409`.
- Incorrect credentials on login return `401`.

### Products (public)

| Method | Path                   | Query params                                                    | Notes                                     |
|--------|------------------------|-----------------------------------------------------------------|-------------------------------------------|
| GET    | `/products`            | `search`, `category`, `minPrice`, `maxPrice`, `inStock=true`    | Returns `{ count, items: Product[] }`     |
| GET    | `/products/categories` | –                                                               | Returns `{ categories: string[] }`        |
| GET    | `/products/:id`        | –                                                               | `404` when not found                      |

### Cart (requires Bearer token)

| Method | Path                     | Body                         |
|--------|--------------------------|------------------------------|
| GET    | `/cart`                  | –                            |
| POST   | `/cart/items`            | `{ productId, quantity }`    |
| PATCH  | `/cart/items/:productId` | `{ quantity }`               |
| DELETE | `/cart/items/:productId` | –                            |
| DELETE | `/cart`                  | – (clears the whole cart)    |

Cart totals include GST at 15% (computed on the server).

### Orders (requires Bearer token)

| Method | Path            | Body                                                                          |
|--------|-----------------|-------------------------------------------------------------------------------|
| POST   | `/orders`       | `{ customer: { name, email, address, city, postcode } }` – uses current cart  |
| GET    | `/orders`       | –                                                                             |
| GET    | `/orders/:id`   | –                                                                             |

On a successful `POST /orders`:

1. Stock is decremented on each product.
2. The user's cart is emptied.
3. A fully-priced `Order` object is returned with status `CONFIRMED`.

### Trying it out with curl

```bash
# Register
TOKEN=$(curl -s -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"mike@example.com","password":"secret1","name":"Mike B"}' | jq -r .token)

# Add a product to the cart
curl -s -X POST http://localhost:4000/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"productId":"p-001","quantity":2}'

# Place an order
curl -s -X POST http://localhost:4000/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"customer":{"name":"Mike B","email":"mike@example.com","address":"1 Queen St","city":"Auckland","postcode":"1010"}}'
```

---

## 6. Data model & test data

Products are seeded from `backend/src/data/seed.ts`. The seed contains 18
Bidfood-style food items spread across 8 categories (Fresh Produce, Meat &
Poultry, Dairy, Seafood, Pantry, Frozen, Beverages, Bakery). Stock, prices
and categories are fixed and will always be the same when the server boots.

Users, carts and orders are **not** seeded. The only way to create them is
via the API, which keeps the starting state deterministic for your tests.

Because everything lives in memory, **restarting the API resets the world**.
This is deliberate: your test suite should be able to rely on a clean state
by simply restarting the server, without needing a separate teardown step.

---

## 7. Common scripts

From inside the respective folder:

| Folder      | Command            | What it does                                       |
|-------------|--------------------|----------------------------------------------------|
| `backend/`  | `npm run dev`      | Runs the API with auto-reload (`ts-node-dev`)      |
| `backend/`  | `npm run build`    | Compiles TypeScript to `dist/`                     |
| `backend/`  | `npm start`        | Runs the compiled API (needs `npm run build` first)|
| `backend/`  | `npm run typecheck`| TypeScript compile check without emitting files    |
| `frontend/` | `npm run dev`      | Vite dev server (HMR) on `http://localhost:5173`   |
| `frontend/` | `npm run build`    | Type-checks and builds the static bundle           |
| `frontend/` | `npm run preview`  | Serves the production build on `http://localhost:4173` |
| `frontend/` | `npm run typecheck`| TypeScript project references build-check          |

---

## 8. Troubleshooting

- **Port already in use** – kill whatever is on 4000/5173 (`lsof -i :4000`)
  or change `PORT` in `backend/.env` and `VITE_API_BASE_URL` in
  `frontend/.env` to match.
- **CORS errors in the browser** – make sure the backend is running on
  `http://localhost:4000`. If you changed the port, set `CORS_ORIGIN` in the
  backend `.env` so it matches the frontend origin.
- **`npm install` fails** – confirm Node is on v18+ (`node --version`). The
  project uses ESM-only tooling (Vite) which requires Node 18 or later.
- **`Invalid or expired token`** – the JWT has a 12h lifetime. Log out and
  back in to mint a new one.

Happy testing!
