# Feature Plan — 10% off orders over $100

**Author:** David Mackey-Ward · **Date:** 02-09-2026

## 1. Clarifying questions (asked before any code)

1. Is "subtotal over NZD $100" the *GST-exclusive* subtotal (matching the
   `order.subtotal` field)? Or the total a customer sees incl. GST?
2. Is "over $100" strict (`> 100.00`, so exactly $100.00 does **not**
   qualify)?
3. Does the 10% discount apply to the GST-exclusive subtotal, with GST then
   computed on the *discounted* amount (standard NZ treatment — the discount
   reduces the GST-inclusive price)?
4. **Known blocker to resolve first:** BUG-005 (FINDINGS.md) — the cart
   prices GST at 12.5% while orders charge 15%. Discount logic must sit on a
   single, correct GST rate or every discounted order inherits the bug.

## 2. Changes required

**Data model (`backend/src/types.ts`)**
- `Order`: add `discount: number` (0 when not applicable) and
  `discountedSubtotal`? Or keep `subtotal` = pre-discount and add
  `discountAmount` + `total` net of discount — decide in Q3. Adding a
  field is backward-compatible for existing orders (they get `discount: 0`).
- `Cart` serialisation: optionally preview `discount` so the UI can show it
  before checkout.

**API (`backend/src/routes/orders.ts` + `cart.ts`)**
- Extract pricing into one pure function, e.g.
  `priceOrder(items) → { subtotal, discount, gst, total }`, unit-testable
  and shared by cart and order paths (fixes the current duplicated 12.5/15%
  logic as a side effect).
- `POST /orders`: if `subtotal > 100.00` apply 10%; compute GST on the
  discounted subtotal; persist new fields. `GET /orders` unchanged in shape
  (extra fields).

**UI**
- Cart page: "10% discount" line when eligible (+/- progress hint like
  "Add $X more for 10% off").
- Checkout summary: show discount line and discounted total before submit.
- Confirmation screen: show discount applied.
- API client (`frontend/src/api.ts`) + types: new fields flow through.

**Docs** — update `openapi.ts` schema; README note.

## 3. Test strategy

**API (table-driven, boundary-focused)** — `api/discount.spec.ts`:

| Subtotal scenario | Expected |
|---|---|
| $99.99 (below) | no discount, fields unchanged |
| $100.00 (exactly "over"? — Q2) | decision-driven |
| $100.01 (just over) | 10% = $10.00, GST on discounted |
| $150.00 | 10% = $15.00 |
| Rounding case (e.g. subtotal $100.03) | discount to the cent |

- Assert the *full pricing invariant*: `total == (subtotal − discount) + gst`
  where `gst == 15% × (subtotal − discount)`.
- Regression: existing cart/order specs must stay green unchanged (their
  baskets are below $100, so the discount path must not alter them).

**UI** — one journey with a basket > $100: cart shows the discount line →
checkout summary shows discounted total → confirmation shows the same
amount. (API covers the maths; UI covers presentation).

