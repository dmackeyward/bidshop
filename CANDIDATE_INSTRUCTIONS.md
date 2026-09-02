# Bidfood SDET Technical Test – Candidate Brief

Kia ora, and thanks for taking the time to work on this exercise.

The repository you have is a small two-service app ("Bidshop") that mirrors
the kind of food-supply e-commerce experience our customers use every day.
There is an **Express API** and a **React web app**, both written in
TypeScript. Everything runs locally – no cloud, no database, no Docker.

Start with the main `README.md` for setup and run instructions. Once you
can hit <http://localhost:5173> and see the shop, you're ready to begin.

The API is fully documented via Swagger UI at
<http://localhost:4000/api-docs> (with a raw OpenAPI 3.0 spec at
`/openapi.json`). Use it to explore the endpoints before you start
writing tests.

---

## Your mission

> **Set up a test project with API tests and UI tests for Bidshop.**
> The repo ships with no tests – we want to see how you design and
> structure a test framework from scratch.

**This exercise is NOT about code coverage.** We are not counting test
cases or chasing a percentage. What we care about is how you **set up
and structure** a test project and your **choice of framework and
tooling**.We also care how you plan a project and test what brings true value to the customer. A small, well-organised suite of a handful of tests will score higher than dozens of messy or flaky tests.

---

## What you need to deliver

1. **An API test project** that exercises the Express service in
   `backend/`.
2. **A UI test project** that exercises the React app in `frontend/`.
3. A short **README** (half a page is fine) covering:
   - Which frameworks you picked and why.
   - How to install and run each suite (exact commands).
   - Any trade-offs or things you'd do differently with more time.

That's it – no component tests, unit tests, performance tests, or test
pyramids required. Just **API tests** and **UI tests**.

---

## Time expectations

Aim for **about 4–6 hours** of focused work. We would rather see a
clean, thoughtful setup than an exhaustive suite.

---

## Suggested tooling (pick what you're comfortable with)

- **API tests** – Playwright API testing, Supertest + Jest, Supertest +
  Vitest, or similar.
- **UI tests** – Playwright or Cypress.

You don't have to use these – if you prefer something else, just
explain the choice in your README.

---

## Rules of engagement

- Add any dev-dependencies you need (`npm install --save-dev …`).
- Don't change the product source code unless absolutely necessary.
  If you do, call it out in your README so we can see exactly what you
  touched.
- Put your tests in a clear location 

---

## Bonus task – planning a new feature

> This is **not just about writing code**. We want to see how you think.

Imagine the Product team has just asked us to add a new feature to
Bidshop:

> **"Give customers a 10% discount on any order with a subtotal over
> NZD $100."**

Write up (in your submission README, or in a separate `DISCOUNT.md`) a
short plan covering:

- Clarifying questions you would ask the product owner / devs before
  starting.
- What you would need to change or add across the API, the UI, and
  the data model.
- Your **test strategy** for this feature 
- How you would validate that the feature doesn't break existing
- Anything you'd want in place before shipping.


---

## How to submit

1. Push your work (tests, config and README) to a **fresh public git
   repo** or send us a zipped copy.
2. Your README must tell us exactly which commands to run from a clean
   checkout to execute each suite, e.g.:

   ```bash
   cd backend && npm install && npm test
   cd ../frontend && npm install && npm test
   ```

3. If a specific browser or Playwright install step is needed, document
   that too.

---

## Any questions?

Email the hiring manager named in the invitation if anything is
unclear before you start. Otherwise, have fun with it.

Good luck!  
