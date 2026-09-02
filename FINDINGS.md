# Bidshop – Exploration Findings

**Author:** David Mackey-Ward
**Date:** 02-09-2026
**Environment:** Node v22.23.1 · services run locally (`backend` :4000, `frontend` :5173)
**Scope:** Initial exploratory pass over the app *before* test design began (Step 0 of the exercise). No product source code was modified.

---

## Summary

| ID | Severity | Product / area | Title | Status |
|----|----------|----------------|-------|--------|
| BUG-001 | Medium | p-003 – Bluff Oysters | Dead product image (HTTP 404) | Open – product data |
| BUG-002 | Medium | p-010 – Puhoi Valley Greek Yoghurt | Dead product image (HTTP 404) | Open – product data |
| BUG-003 | Medium | p-012 – Sourdough Ciabatta | Dead product image (HTTP 404) | Open – product data |
| BUG-004 | Medium | p-001 / p-002 – Beef Mince & Chicken Breast | Duplicate / incorrect product image | Open – product data |
| BUG-005 | High | Cart & order pricing | GST rate inconsistency (12.5% vs 15%) between cart and order | Open – needs product/dev decision |

---

## BUG-001 · Dead product image – Bluff Oysters

- **Severity:** Medium
- **Affected:** `p-003` "Bluff Oysters (Dozen)" (category Seafood)
- **Evidence:**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" \
    "https://images.unsplash.com/photo-1565295003460-98cd26918d1b?w=600"
  # -> 404
  ```
  The image endpoint returns an HTTP 404 body (`<html><body>404</body></html>`).
- **Impact:** The product card shows a permanently broken image for all customers.

## BUG-002 · Dead product image – Puhoi Valley Greek Yoghurt

- **Severity:** Medium
- **Affected:** `p-010` "Puhoi Valley Greek Yoghurt" (category Dairy)
- **Evidence:**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" \
    "https://images.unsplash.com/photo-1571212515416-fca8b8d0e9c0?w=600"
  # -> 404
  ```
- **Impact:** Broken image on the product card.

## BUG-003 · Dead product image – Sourdough Ciabatta

- **Severity:** Medium
- **Affected:** `p-012` "Sourdough Ciabatta" (category Bakery)
- **Evidence:**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" \
    "https://images.unsplash.com/photo-1585478259715-4d3d0e8b2f83?w=600"
  # -> 404
  ```
- **Impact:** Broken image on the product card.

> **Suggested fix for BUG-001..003:** replace each dead URL in `backend/src/data/seed.ts` with a valid image URL. Requires the product owner/devs to supply correct photography. Logged as findings; **not changed** per the exercise's rules of engagement.

---

## BUG-004 · Duplicate / incorrect product image – Beef Mince and Chicken Breast

- **Severity:** Medium
- **Affected:** `p-001` "NZ Grass-Fed Beef Mince" and `p-002` "Free-Range Chicken Breast" (category Meat & Poultry)
- **Evidence:**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" \
    "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600"
  # -> 200
  ```
  Both products reference the **same** `imageUrl`. Downloads are byte-identical (same file size, `126,852` bytes) — confirmed duplicate, not coincidence.
- **Impact:** A single photo is used for two different products, so at least one card displays an image that does not match its product (chicken breast is shown with a red-meat photo). In a real food-supply storefront this misleads customers about what they are ordering.
- **Suggested fix:** give `p-002` its own URL from the same image set. Not changed in this pass.

---

## BUG-005 · GST rate inconsistency between cart display and order charge

- **Severity:** High
- **Affected:** Cart pricing vs order pricing (monetary discrepancy)
- **Evidence (code review):**
  - `backend/src/routes/cart.ts` → `serialiseCart()`:
    ```ts
    const gst = Number((subtotal * 0.125).toFixed(2));   // 12.5%
    ```
  - `backend/src/routes/orders.ts` → `POST /orders`:
    ```ts
    const gst = Number((subtotal * 0.15).toFixed(2));    // 15%
    ```
  - The checkout UI (`frontend/src/pages/CheckoutPage.tsx`) labels the line **"GST (15%)"**, and `README.md` states "Cart totals include GST at 15% (computed on the server)" — yet the cart total shown to the customer is computed at **12.5%**.
- **Reproduction (conceptual):** add item(s) to the cart, then read the cart response and the order response for the same items — `cart.gst`/`cart.total` will be lower than the corresponding values on the placed order. The price the customer sees at checkout differs from the price actually charged.
- **Impact:** Customer-visible pricing inconsistency between the pre-purchase summary and the charged amount. (Note: NZ GST is 15% — the cart serialiser is the outlier.)
- **Suggested next step:** confirm intended rate with product/BA, then align `cart.ts` with the 15% rate and add a regression test covering the exact cent values of `subtotal`, `gst`, and `total` across cart → order. This is a prime candidate for the exercise's API test suite.





