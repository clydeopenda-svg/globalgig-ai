# GlobalGig AI

**From your next gig to your next payment.**

GlobalGig AI is a freelance business assistant that turns a job post into a priced, payable project. AI analyses the opportunity, recommends a price and milestone plan, and writes the proposal. The client then pays each milestone through **PayPal**, and the backend verifies every payment before the milestone counts as paid.

Built for the PayPal AI Hackathon 2026.

```
Find an opportunity → Analyse with AI → Set a price → Generate proposal → Request payment → Get paid
```

## The demo story

1. Paste a real job description into the **AI Gig Studio**.
2. Claude analyses it and returns the requirements, skills, complexity, an hours estimate, risks, a timeline, clarifying questions, **three price points** (minimum, recommended, premium) and a **milestone payment plan**.
3. The freelancer edits anything, picks a price and saves it as a **project**. Milestone amounts are calculated from the price and always add up to it exactly.
4. One click writes a **client-ready proposal** that quotes those exact amounts. It can be edited, saved and copied.
5. **Request payment** on a milestone opens a client-facing checkout page (`/pay/:milestoneId`) with PayPal buttons.
6. A Sandbox buyer approves the payment in PayPal.
7. The backend **captures** the order and **verifies** it: status `COMPLETED`, exact amount, currency, and the milestone reference (`custom_id`).
8. Only then is the milestone marked paid. The payment is stored, and the dashboard pipeline and payment history update.

## Features

| Area | What it does |
| --- | --- |
| Landing page | Hero, interactive product preview, benefits, how it works |
| Overview | Setup status, AI Studio entry point, real pipeline (Opportunity → Analysed → Proposal → In progress → Paid), totals from real payments |
| AI Gig Studio | Structured AI analysis. Every field is editable (title, summary, requirements, skills, milestones, price). Posts can also be saved as un-analysed **opportunities** and analysed later |
| Smart pricing | Minimum, recommended and premium prices (USD) with rationale, plus a custom price. On a project, **Re-price with AI** reconsiders the current scope plus an optional note ("client needs it in 3 weeks") and lists the factors that moved the price. Applying a price is always the freelancer's click |
| Milestones | Create, edit, remove and re-split milestones, with live amount preview and progress. Paid milestones are locked |
| Proposals | AI-written proposal in a document-style editor. Save, regenerate, copy as plain text |
| PayPal payment center | Orders API v2: create the order on the server, buyer approval with the JS SDK, server-side capture and verification |
| Payment history | Project, buyer, amount, PayPal capture and order IDs, status, environment, date |
| Command menu | Ctrl/⌘+K from anywhere in the workspace: jump to pages or search projects with the keyboard |
| Settings | Freelancer profile (name, headline, skills, hourly rate) that personalises pricing and proposals; integration status |

### Honesty rules built in
- **No simulated payments.** A milestone becomes `paid` only inside `recordVerifiedPayment`, which runs only after `verifyCapture` passes on a real PayPal response. The status API refuses `paid`.
- **No fake AI.** If `ANTHROPIC_API_KEY` is missing, the studio shows the error and offers a **demo mode**. Demo mode uses pre-written sample data for the example brief only. It is stored with `source = demo` and badged *"Demo data — not AI"* everywhere it appears.
- **No invented metrics.** The dashboard shows only numbers computed from your own database.

## Tech stack

- **Next.js 16** (App Router, route handlers) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **SQLite** via `@libsql/client`: a local file, or Turso when hosted
- **Claude API** via `@anthropic-ai/sdk`, with structured JSON output validated by **zod** schemas
- **PayPal Orders API v2** (REST) + PayPal JS SDK buttons, **Sandbox only**

## Getting started

Requirements: Node.js ≥ 20.12.

```bash
npm install
cp .env.example .env.local   # then fill in the keys below
npm run dev                  # http://localhost:3000
```

The database tables are created automatically on first request (`globalgig.db`).

### Environment variables

| Variable | Required | Where to get it |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | For real AI | [console.anthropic.com → API keys](https://console.anthropic.com/settings/keys) |
| `ANTHROPIC_MODEL` | No | Defaults to `claude-opus-5-5` |
| `ANTHROPIC_EFFORT` | No | `low` / `medium` (default) / `high`. Lower is faster |
| `PAYPAL_CLIENT_ID` | For payments | [developer.paypal.com → Apps & Credentials](https://developer.paypal.com/dashboard/applications/sandbox) → **Sandbox** → your app |
| `PAYPAL_CLIENT_SECRET` | For payments | Same app. **Server only**, never sent to the browser |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | For hosting | [turso.tech](https://turso.tech). Leave empty locally |

### Testing a PayPal Sandbox payment

1. In the PayPal Developer Dashboard, go to **Testing Tools → Sandbox Accounts** and note the **Personal** (buyer) account's email and password (*View/Edit account*).
2. In GlobalGig, open a project, go to **Plan & payments**, and click **Request payment** on a milestone.
3. Click the PayPal button and log in with the **Sandbox personal account**.
4. After approval, the page shows the verified capture ID. The milestone, project status and **Payments** page update.

The PayPal API base URL is hard-coded to `api-m.sandbox.paypal.com`, so real money can never move.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # route types + tsc
npm run lint       # eslint
npm test           # payment verification + money-split unit tests
```

## Project structure

```
src/
  app/
    page.tsx                         Landing page
    app/                             Workspace (overview, studio, projects, proposals, payments, settings)
    pay/[milestoneId]/               Client-facing PayPal checkout page
    api/
      ai/analyse                     POST: AI job analysis (no persistence)
      gigs, gigs/[id]                Create opportunities/projects, rename, delete
      gigs/[id]/milestones           PUT: price + milestone plan
      gigs/[id]/proposal             POST: generate (AI/demo), PUT: save edits
      gigs/[id]/pricing              POST: AI price recommendation (not saved)
      milestones/[id]                PATCH: pending ↔ in progress (never "paid")
      paypal/orders                  POST: create order (amount from DB)
      paypal/orders/[id]/capture     POST: capture + verify + record
      settings/profile               PUT: freelancer profile
  lib/
    ai/service.ts                    Reusable Claude service (structured output, error mapping)
    ai/schemas.ts                    zod schemas for analysis + proposal
    ai/demo.ts                       Labelled demo data (used only without an API key)
    paypal.ts                        OAuth token cache, Orders API calls
    paypal-verify.ts                 Pure capture verification (unit-tested)
    db/                              Schema, client, all SQL queries
  components/                        UI primitives, studio, project, payments, layout
tests/                               node:test unit tests
```

## Security notes

- Secrets live only in server environment variables. Only the public PayPal client ID reaches the browser.
- The order amount is read from the database on the server. The browser never chooses what is charged.
- Capture is idempotent: it uses a `PayPal-Request-Id` header and a unique order ID in `payments`, and recovers via `ORDER_ALREADY_CAPTURED`.
- All SQL uses parameter placeholders.
- The job description is passed to the model as delimited data, and the system prompt tells it to ignore instructions inside it.

## Limitations (hackathon scope)

- Single-user workspace with no authentication. Add auth before multi-user use.
- USD only.
- Payment status updates come from the capture callback. PayPal webhooks (for refunds or disputes) are a natural next step.

## License

[MIT](./LICENSE)
