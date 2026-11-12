# GlobalGig AI — PayPal AI Hackathon 2026 submission

Copy the sections below into the submission form. Replace the two links at the end once they exist.

---

## Project name
GlobalGig AI

## Tagline (one line)
From your next gig to your next payment: AI turns a freelance job post into a priced, payable project, and PayPal collects every milestone.

## Short description (~50 words)
GlobalGig AI is a freelance business assistant. Paste any job description and AI analyses the requirements, estimates effort, recommends a price range and plans payment milestones. One click writes a client-ready proposal. The client then pays each milestone through PayPal, and the backend verifies every capture before the milestone counts as paid.

## The problem
Independent professionals lose time and money between "I found a gig" and "I got paid". They have to decode vague client briefs, guess at a price, write proposals from scratch, structure milestones and then chase payments in a separate tool. Underpricing and late or disputed payments are the norm, especially for freelancers new to working internationally.

## What it does
1. **Analyse.** Paste a job post. Claude returns structured JSON: client summary, requirements, skills, complexity, an hours estimate, risks with mitigations, a timeline and questions to ask the client.
2. **Price.** Three AI price points (minimum, recommended, premium) derived from hours × rate, adjusted for complexity and risk, with the reasoning shown. Re-price at any time with a note such as "client now needs it in 3 weeks".
3. **Plan.** AI-proposed payment milestones that the freelancer edits. Amounts are calculated from the price and always add up to it exactly.
4. **Propose.** A client-ready proposal that quotes those exact milestone amounts and says payment is via PayPal. Edit, save and copy.
5. **Get paid.** Each milestone has a client payment link with PayPal checkout. The backend creates the order (the amount comes from the database, never the browser), captures it after buyer approval, and verifies status, amount, currency and milestone reference before marking it paid.
6. **Track.** A pipeline (Opportunity → Analysed → Proposal → In progress → Paid) and a payment history of verified PayPal captures.

## How AI and PayPal work together
They are not two separate features. The AI's pricing and milestone plan **becomes** the PayPal charge. Each AI-planned milestone turns into a PayPal Orders API order for its exact amount. The capture result flows back to update the project's status and the freelancer's pipeline. AI decides what to charge and when; PayPal executes it and confirms it.

## How we built it
- **Frontend and backend:** Next.js 16 (App Router, route handlers), React 19, TypeScript, Tailwind CSS v4.
- **AI:** Claude API (`claude-opus-5-5`) via the Anthropic SDK, with structured outputs validated by zod schemas. A reusable service powers job analysis, pricing, milestone planning and proposal writing.
- **Payments:** PayPal Orders API v2 (server-side create and capture with OAuth client credentials) and the PayPal JS SDK buttons. Sandbox only.
- **Data:** SQLite via libSQL (Turso-compatible). Money is stored in integer cents.

## Trust and safety decisions
- A milestone is never marked paid before a verified PayPal capture. The status API refuses "paid" outright.
- The PayPal secret and the AI key live only on the server.
- Captures are idempotent (PayPal-Request-Id plus a unique order ID).
- No fake data: without an AI key, the app offers a demo mode labelled "Demo data — not AI" everywhere it appears. The dashboard shows only numbers computed from real records.
- The verification logic is unit-tested: amount off by one cent, wrong currency, wrong milestone and pending captures are all rejected.

## Challenges
- Making AI output safe to charge money from. AI percentages can drift to 99% or 101%, so they are normalised, and the price split puts the rounding on the last milestone so the parts always sum to the total.
- Keeping AI and money decoupled where it matters: AI recommends, but only the freelancer's click changes what a client is charged.

## What's next
PayPal webhooks for refunds and disputes, multi-currency support, user accounts, and sending proposals with an embedded payment link straight from the app.

## Links
- Source code: https://github.com/clydeopenda-svg/globalgig-ai
- Live demo: _add after deployment_
- Demo video: _add after recording_

---

# Demo video script (about 2.5 minutes)

**Before recording:** keys in `.env.local`, `npm run dev`, a fresh database (delete `globalgig.db`), Settings → profile saved with an hourly rate, and the PayPal Sandbox personal account email and password ready.

| Time | Show | Say |
| --- | --- | --- |
| 0:00 | Landing page | "Freelancers lose money between finding a gig and getting paid. GlobalGig AI closes that gap with AI and PayPal." |
| 0:15 | Click **Start building your next gig** → paste a real job post → **Analyse opportunity** | "I paste a real job post. Claude analyses it like a freelance consultant." |
| 0:35 | Scroll the result: requirements, complexity, hours, three prices, milestones, risks | "It pulls out requirements, estimates hours, recommends three prices with the reasoning, and plans payment milestones. Every field is editable." |
| 0:55 | Pick **Recommended**, tweak a milestone % → **Save as project** | "I choose the recommended price. Each milestone amount comes from it, so this becomes a real payment plan." |
| 1:10 | **Proposal** tab → **Write proposal with AI** → **Copy proposal** | "One click writes a client-ready proposal quoting those exact milestone amounts, payable through PayPal." |
| 1:30 | **Plan & payments** → **Request payment** on milestone 1 | "Each milestone gets a client payment page." |
| 1:40 | PayPal button → log in as the Sandbox buyer → **Pay** | "The client pays with PayPal. Our backend creates the order with the amount from our database, never the browser." |
| 2:00 | The "Payment received and verified" panel with the capture ID | "After approval, the backend captures the order and verifies the status, the exact amount, currency and milestone before anything is marked paid." |
| 2:15 | Back in the workspace: milestone ✓, Payments page, Overview pipeline | "The project, the payment history and the pipeline all update from that verified PayPal capture." |
| 2:30 | Overview | "GlobalGig AI: from your next gig to your next payment." |
