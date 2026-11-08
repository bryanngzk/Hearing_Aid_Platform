# HearBridge

A hearing-aid trade-in and marketplace platform. HearBridge lets patients donate a used
pair of hearing aids in exchange for a discount coupon, and lets partnered clinics turn
approved donations into real, purchasable listings — connecting patients who can't afford
a new pair with the incentive to pass on their old one instead of leaving it in a drawer.

Built as an MSc project. Client-only web app — React frontend talking directly to
Firebase, no custom backend server.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Routes](#routes)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Security](#security)
- [Known Limitations](#known-limitations)

---

## Overview

HearBridge solves two linked problems:

1. **Cost** — high-end hearing aids are expensive, and many patients who'd benefit from
   one can't afford it.
2. **Waste** — patients who upgrade to a new pair are often unsure what to do with their
   old one, so it usually just gets kept rather than reused.

The platform closes that loop: a donor submits their old device for trade-in, a
partnered clinic inspects and approves it, the donor receives a percentage-off coupon
(set at the clinic's discretion, not auto-calculated from condition), and the device
itself is published as a real listing other patients can browse and book a viewing for.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend framework | React 19 |
| Build tool / dev server | Vite 8 (not Create React App) |
| Routing | React Router v7, one flat `<Routes>` tree |
| Styling | Plain hand-written CSS (`src/index.css`) — no Tailwind, no CSS Modules, no component library |
| Backend | None — client talks directly to Firebase |
| Database | Cloud Firestore |
| Auth | Firebase Authentication (email/password) |
| Hosting | Firebase Hosting |
| HEIC photo support | Native `createImageBitmap()` first, [`heic2any`](https://www.npmjs.com/package/heic2any) as a WASM fallback |
| Linting | [`oxlint`](https://oxc.rs/) (not ESLint) |

Firebase is used for exactly three things — Firestore, Auth, and Hosting. There is no
Cloud Functions, Cloud Storage, or any other backend service in this project; every
write goes straight from the browser to Firestore, secured entirely by
[`firestore.rules`](./firestore.rules).

## Features

**Patient / Donor**
- Browse the public hearing-aid catalogue and search by brand/model
- Book a viewing for a specific listing, with race-safe slot locking (see
  [Security](#security)) so two patients can never double-book the same clinic slot
- Reschedule or cancel a booking, with an "are you sure?" confirmation before cancelling
- Submit a device for trade-in, with photos (HEIC/HEIF auto-converted to JPEG)
- Track booking history, trade-in status, and earned coupons from one profile page
- Reveal/copy a coupon code without leaving it visible on screen by default

**Clinic** (manually provisioned accounts — see [Getting Started](#getting-started))
- Review every trade-in submitted platform-wide, approve or reject it
- On approval, publish the device as a public listing (brand, price, description)
- Issue a percentage-off coupon at approval time, at the clinic's own discretion
- See bookings only for their own clinic location(s), and mark a visit completed
- Toggle any listing between Available and Sold
- Look up and redeem a donor's coupon code in person

## Project Structure

```
src/
├── components/        Shared UI building blocks (Header, Footer, homepage sections)
├── data/               Static lookup data and small pure helpers (clinic list, status
│                       label maps, ID generators — no Firestore calls)
├── pages/              One component per route (see Routes below)
├── utils/              Client-side helpers (image compression, HEIC conversion)
├── App.jsx             Route table
├── firebase.js         Firebase SDK initialisation (Firestore + Auth)
└── main.jsx            React entry point

firestore.rules          Firestore security rules (deployed separately from hosting)
firebase.json             Hosting + Firestore config for the Firebase CLI
```

## Routes

| Route | Page | Access |
|---|---|---|
| `/home` | `Home` | Public |
| `/listings` | `Listing` | Public |
| `/product/:id` | `Product` | Public |
| `/login`, `/signup` | `Login`, `SignUp` | Public |
| `/booking` | `Booking` | Signed-in patient |
| `/booking/new` | `Appointments` | Signed-in patient |
| `/trade-in` | `TradeIn` | Signed-in patient |
| `/profile` | `Profile` | Signed-in patient |
| `/clinic-approval` | `ClinicApproval` | Clinic account |
| `/clinic-approval/:tradeInId` | `TradeInDetail` | Clinic account |
| `/clinic-bookings` | `ClinicBookings` | Clinic account |
| `/clinic-listings` | `ClinicListings` | Clinic account |
| `/redeem-coupon` | `RedeemCoupon` | Clinic account |

Clinic-only pages are not linked from the nav bar — they're reached by typing the URL
directly. Access control isn't done at the router level; each page checks the signed-in
user's `role` field itself and renders a "log in" / "not authorised" message instead of
its real content when the check fails.

## Data Model

Six Firestore collections: `users`, `tradeIns`, `bookings`, `bookingSlots`, `coupons`,
`listings`. Full field-by-field schema (types, document ID conventions, who writes what)
is documented separately — see `HearBridge_Data_Schema.docx` if present in the project,
or regenerate it by asking Claude Code to produce a schema table from the current
`firestore.rules` and page source.

Briefly:
- **`users/{uid}`** — profile + `role` (`patient` | `clinic`) + `clinicIds` for clinic accounts
- **`tradeIns/{id}`** — a donor's submission, through pending → approved/rejected
- **`bookings/{id}`** + **`bookingSlots/{clinicId}_{date}_{time}`** — appointments, with the
  slot document existing only to make double-booking impossible
- **`coupons/{code}`** — issued on trade-in approval, redeemed in person by a clinic
- **`listings/{id}`** — the public catalogue; published either manually or from an
  approved trade-in

## Getting Started

**Prerequisites:** Node.js, a Firebase project with Firestore and Authentication
(email/password provider) enabled.

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app connects to the Firebase project configured in `src/firebase.js`. To point it at
your own Firebase project, replace the `firebaseConfig` object there with your project's
config (Firebase Console → Project Settings → General). This value is not a secret in the
traditional sense — Firebase client apps ship their config publicly, and real access
control is enforced by `firestore.rules`, not by hiding this object.

**Provisioning a clinic account:** there is no clinic sign-up flow. Sign up normally
(creates a `role: 'patient'` account), then in the Firebase Console, manually edit that
user's `users/{uid}` document:
- set `role` to `clinic`
- add `clinicIds` (array of strings) — the clinic location ID(s) this account manages

## Available Scripts

| Command | Does |
|---|---|
| `npm run dev` | Starts the Vite dev server with hot reload |
| `npm run build` | Builds the production bundle into `dist/` |
| `npm run preview` | Serves the built `dist/` bundle locally, for a pre-deploy sanity check |
| `npm run lint` | Runs `oxlint` over the project |

## Deployment

Firebase Hosting serves the built `dist/` folder; Firestore rules deploy separately.
Both are defined in `firebase.json`.

```bash
npm run build
firebase deploy --only firestore:rules,hosting
```

Firestore rules changes do not take effect until explicitly deployed — editing
`firestore.rules` locally has no effect on the live project until you run the command
above (or `--only firestore:rules` alone). This has been a repeated source of confusing,
generic permission errors during development; if a feature that writes to a new
collection or field suddenly fails with no detail, check whether its rules were actually
deployed before debugging the application code.

## Security

- Every collection in `firestore.rules` is default-deny: nothing is permitted unless a
  rule explicitly grants it.
- Ownership checks use `request.auth.uid` throughout; a custom `isClinic()` rule function
  looks up the caller's own `role` field to gate clinic-only writes.
- Bookings use a Firestore **transaction** (`runTransaction`) to claim a time slot — the
  slot document's existence is checked and created atomically, so two patients booking
  the same clinic/date/time at once can't both succeed.
- Passwords are never handled by this app's own code or database — Firebase
  Authentication manages credential hashing (a modified scrypt algorithm) entirely
  server-side; `users/{uid}` documents only ever contain profile fields.
- The only fully public rule is `listings` reads, since the catalogue is meant to be
  browsable without logging in.

## Known Limitations

Honest gaps, not oversights glossed over:

- Coupon redemption has no transaction guard — two clinics redeeming the same code at
  the same instant could theoretically both succeed.
- No server-side bound on a coupon's `percentOff` value beyond the UI's own 0–100 input
  constraint.
- No in-app account/data deletion flow.
- Trade-ins are visible to every clinic account platform-wide (unlike bookings, which are
  scoped to each clinic's own `clinicIds`) — deliberate, since a donor never chooses a
  clinic up front, but worth stating explicitly.
- Trade-in and listing photos are stored as base64 strings directly in Firestore
  documents, not in Cloud Storage — simple and dependency-free at this scale, but doesn't
  scale to many or very large images.
- Clinic account provisioning is entirely manual via the Firebase Console; there's no
  admin UI.
- No automated test suite.
