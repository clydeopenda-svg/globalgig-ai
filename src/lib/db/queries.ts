import "server-only";
import type { Row } from "@libsql/client";
import { getDb } from "./client";
import { normalisePercents, splitByPercent } from "@/lib/format";
import type {
  ContentSource,
  FreelancerProfile,
  Gig,
  GigAnalysis,
  GigStatus,
  GigSummary,
  Milestone,
  Payment,
  Proposal,
} from "@/lib/types";

// All SQL lives here so route handlers and pages stay short. Every query uses
// "?" placeholders — never string concatenation — to prevent SQL injection.

function parseJson<T>(value: unknown): T | null {
  if (typeof value !== "string" || !value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function toGig(row: Row): Gig {
  return {
    id: Number(row.id),
    title: String(row.title),
    clientName: String(row.client_name),
    description: String(row.description),
    status: row.status as GigStatus,
    analysis: parseJson<GigAnalysis>(row.analysis_json),
    analysisSource: (row.analysis_source as ContentSource | null) ?? null,
    proposal: parseJson<Proposal>(row.proposal_json),
    proposalSource: (row.proposal_source as ContentSource | null) ?? null,
    priceCents: row.price_cents === null ? null : Number(row.price_cents),
    currency: String(row.currency),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toMilestone(row: Row): Milestone {
  return {
    id: Number(row.id),
    gigId: Number(row.gig_id),
    position: Number(row.position),
    title: String(row.title),
    description: String(row.description),
    percent: Number(row.percent),
    amountCents: Number(row.amount_cents),
    status: row.status as Milestone["status"],
    paypalOrderId: row.paypal_order_id === null ? null : String(row.paypal_order_id),
    paidAt: row.paid_at === null ? null : String(row.paid_at),
  };
}

// ---------- Gigs ----------

export async function listGigs(): Promise<GigSummary[]> {
  const db = await getDb();
  const rs = await db.execute(`
    SELECT g.id, g.title, g.client_name, g.status, g.analysis_source, g.proposal_source,
           g.price_cents, g.currency, g.created_at, g.updated_at,
           (SELECT COUNT(*) FROM milestones m WHERE m.gig_id = g.id) AS milestone_count,
           (SELECT COALESCE(SUM(p.amount_cents), 0) FROM payments p WHERE p.gig_id = g.id) AS paid_cents
    FROM gigs g ORDER BY g.updated_at DESC, g.id DESC`);
  return rs.rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title),
    clientName: String(row.client_name),
    status: row.status as GigStatus,
    analysisSource: (row.analysis_source as ContentSource | null) ?? null,
    proposalSource: (row.proposal_source as ContentSource | null) ?? null,
    priceCents: row.price_cents === null ? null : Number(row.price_cents),
    currency: String(row.currency),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    milestoneCount: Number(row.milestone_count),
    paidCents: Number(row.paid_cents),
  }));
}

export async function getGig(id: number): Promise<Gig | null> {
  const db = await getDb();
  const rs = await db.execute({ sql: "SELECT * FROM gigs WHERE id = ?", args: [id] });
  return rs.rows[0] ? toGig(rs.rows[0]) : null;
}

/**
 * Saves an analysed opportunity as a project in one transaction: the gig, its
 * recommended price and the AI-planned milestones (amounts derived from the
 * price so they always sum to it).
 */
export async function createGigFromAnalysis(input: {
  description: string;
  clientName: string;
  analysis: GigAnalysis;
  source: ContentSource;
  priceDollars: number;
}): Promise<number> {
  const db = await getDb();
  const priceCents = Math.round(input.priceDollars * 100);
  const percents = normalisePercents(input.analysis.milestones.map((m) => m.percent));
  const amounts = splitByPercent(priceCents, percents);

  const tx = await db.transaction("write");
  try {
    const rs = await tx.execute({
      sql: `INSERT INTO gigs (title, client_name, description, status, analysis_json, analysis_source, price_cents)
            VALUES (?, ?, ?, 'analysed', ?, ?, ?)`,
      args: [
        input.analysis.title,
        input.clientName,
        input.description,
        JSON.stringify(input.analysis),
        input.source,
        priceCents,
      ],
    });
    const gigId = Number(rs.lastInsertRowid);
    for (const [i, m] of input.analysis.milestones.entries()) {
      await tx.execute({
        sql: `INSERT INTO milestones (gig_id, position, title, description, percent, amount_cents)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [gigId, i + 1, m.title, m.description, percents[i], Math.max(1, amounts[i])],
      });
    }
    await tx.commit();
    return gigId;
  } catch (err) {
    await tx.rollback();
    throw err;
  } finally {
    tx.close();
  }
}

export async function updateGigDetails(
  id: number,
  fields: { title?: string; clientName?: string; status?: GigStatus },
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: `UPDATE gigs SET
            title = COALESCE(?, title),
            client_name = COALESCE(?, client_name),
            status = COALESCE(?, status),
            updated_at = datetime('now')
          WHERE id = ?`,
    args: [fields.title ?? null, fields.clientName ?? null, fields.status ?? null, id],
  });
}

export async function saveProposal(id: number, proposal: Proposal, source: ContentSource): Promise<void> {
  const db = await getDb();
  // Saving a proposal moves an analysed gig forward, but never moves a gig
  // that is already in progress or paid back down the pipeline.
  await db.execute({
    sql: `UPDATE gigs SET proposal_json = ?, proposal_source = ?,
            status = CASE WHEN status IN ('opportunity','analysed') THEN 'proposal' ELSE status END,
            updated_at = datetime('now')
          WHERE id = ?`,
    args: [JSON.stringify(proposal), source, id],
  });
}

export async function deleteGig(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM milestones WHERE gig_id = ? AND status <> 'paid'", args: [id] });
  await db.execute({
    sql: "DELETE FROM gigs WHERE id = ? AND NOT EXISTS (SELECT 1 FROM payments WHERE gig_id = ?)",
    args: [id, id],
  });
}

export async function hasPayments(gigId: number): Promise<boolean> {
  const db = await getDb();
  const rs = await db.execute({ sql: "SELECT 1 FROM payments WHERE gig_id = ? LIMIT 1", args: [gigId] });
  return rs.rows.length > 0;
}

// ---------- Milestones ----------

export async function listMilestones(gigId: number): Promise<Milestone[]> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM milestones WHERE gig_id = ? ORDER BY position, id",
    args: [gigId],
  });
  return rs.rows.map(toMilestone);
}

export async function getMilestone(id: number): Promise<Milestone | null> {
  const db = await getDb();
  const rs = await db.execute({ sql: "SELECT * FROM milestones WHERE id = ?", args: [id] });
  return rs.rows[0] ? toMilestone(rs.rows[0]) : null;
}

export interface MilestoneInput {
  id?: number;
  title: string;
  description: string;
  percent: number;
}

/**
 * Replaces the plan of unpaid milestones and the project price in one
 * transaction. Paid milestones are immutable — they are real money already
 * received — so they're kept as-is and the remaining price is split across the
 * edited unpaid milestones.
 */
export async function replaceMilestonePlan(
  gigId: number,
  priceCents: number,
  plan: MilestoneInput[],
): Promise<void> {
  const db = await getDb();
  const tx = await db.transaction("write");
  try {
    const paid = await tx.execute({
      sql: "SELECT id, percent, amount_cents FROM milestones WHERE gig_id = ? AND status = 'paid'",
      args: [gigId],
    });
    const paidIds = new Set(paid.rows.map((r) => Number(r.id)));
    const paidCents = paid.rows.reduce((sum, r) => sum + Number(r.amount_cents), 0);
    const unpaidPlan = plan.filter((m) => !(m.id && paidIds.has(m.id)));
    const remaining = priceCents - paidCents;
    if (unpaidPlan.length > 0 && remaining < unpaidPlan.length) {
      throw new PlanError("The price must be higher than the amount already paid.");
    }

    const unpaidPercentTotal = unpaidPlan.reduce((s, m) => s + m.percent, 0);
    const amounts = splitByPercent(
      remaining,
      unpaidPlan.map((m) => (unpaidPercentTotal > 0 ? (m.percent / unpaidPercentTotal) * 100 : 0)),
    );

    await tx.execute({
      sql: "DELETE FROM milestones WHERE gig_id = ? AND status <> 'paid'",
      args: [gigId],
    });
    let position = paid.rows.length;
    for (const [i, m] of unpaidPlan.entries()) {
      position += 1;
      await tx.execute({
        sql: `INSERT INTO milestones (gig_id, position, title, description, percent, amount_cents)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [gigId, position, m.title, m.description, m.percent, Math.max(1, amounts[i])],
      });
    }
    await tx.execute({
      sql: "UPDATE gigs SET price_cents = ?, updated_at = datetime('now') WHERE id = ?",
      args: [priceCents, gigId],
    });
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  } finally {
    tx.close();
  }
}

export class PlanError extends Error {}

export async function setMilestoneStatus(id: number, status: "pending" | "in_progress"): Promise<void> {
  const db = await getDb();
  // Paid is only ever set by verified PayPal capture, never through this path.
  await db.execute({
    sql: "UPDATE milestones SET status = ? WHERE id = ? AND status <> 'paid'",
    args: [status, id],
  });
  await db.execute({
    sql: `UPDATE gigs SET status = 'in_progress', updated_at = datetime('now')
          WHERE id = (SELECT gig_id FROM milestones WHERE id = ?) AND status IN ('analysed','proposal') AND ? = 'in_progress'`,
    args: [id, status],
  });
}

export async function attachOrderToMilestone(id: number, orderId: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE milestones SET paypal_order_id = ? WHERE id = ? AND status <> 'paid'",
    args: [orderId, id],
  });
}

// ---------- Payments ----------

/**
 * Records a verified PayPal capture and marks the milestone paid, atomically.
 * Only called after the capture response has been checked (status, amount,
 * currency and milestone reference). The UNIQUE order id makes a repeated
 * capture callback a no-op instead of a double-counted payment.
 */
export async function recordVerifiedPayment(p: {
  gigId: number;
  milestoneId: number;
  orderId: string;
  captureId: string;
  status: string;
  amountCents: number;
  currency: string;
  payerName: string;
  payerEmail: string;
  environment: string;
}): Promise<void> {
  const db = await getDb();
  const tx = await db.transaction("write");
  try {
    await tx.execute({
      sql: `INSERT OR IGNORE INTO payments
              (gig_id, milestone_id, paypal_order_id, paypal_capture_id, status, amount_cents, currency, payer_name, payer_email, environment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.gigId, p.milestoneId, p.orderId, p.captureId, p.status,
        p.amountCents, p.currency, p.payerName, p.payerEmail, p.environment,
      ],
    });
    await tx.execute({
      sql: "UPDATE milestones SET status = 'paid', paypal_order_id = ?, paid_at = datetime('now') WHERE id = ?",
      args: [p.orderId, p.milestoneId],
    });
    // The project is "paid" once every milestone is paid; otherwise work is in progress.
    await tx.execute({
      sql: `UPDATE gigs SET updated_at = datetime('now'),
              status = CASE WHEN NOT EXISTS (SELECT 1 FROM milestones WHERE gig_id = ? AND status <> 'paid')
                            THEN 'paid' ELSE 'in_progress' END
            WHERE id = ?`,
      args: [p.gigId, p.gigId],
    });
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  } finally {
    tx.close();
  }
}

export async function getPaymentByOrder(orderId: string): Promise<Payment | null> {
  const all = await listPayments(orderId);
  return all[0] ?? null;
}

export async function listPayments(orderId?: string): Promise<Payment[]> {
  const db = await getDb();
  const rs = await db.execute({
    sql: `SELECT p.*, g.title AS gig_title, g.client_name, m.title AS milestone_title
          FROM payments p
          JOIN gigs g ON g.id = p.gig_id
          JOIN milestones m ON m.id = p.milestone_id
          ${orderId ? "WHERE p.paypal_order_id = ?" : ""}
          ORDER BY p.created_at DESC, p.id DESC`,
    args: orderId ? [orderId] : [],
  });
  return rs.rows.map((row) => ({
    id: Number(row.id),
    gigId: Number(row.gig_id),
    gigTitle: String(row.gig_title),
    clientName: String(row.client_name),
    milestoneId: Number(row.milestone_id),
    milestoneTitle: String(row.milestone_title),
    paypalOrderId: String(row.paypal_order_id),
    paypalCaptureId: String(row.paypal_capture_id),
    status: String(row.status),
    amountCents: Number(row.amount_cents),
    currency: String(row.currency),
    payerName: String(row.payer_name),
    payerEmail: String(row.payer_email),
    environment: String(row.environment),
    createdAt: String(row.created_at),
  }));
}

// ---------- Settings (freelancer profile) ----------

const PROFILE_KEY = "profile";

export async function getProfile(): Promise<FreelancerProfile> {
  const db = await getDb();
  const rs = await db.execute({ sql: "SELECT value FROM settings WHERE key = ?", args: [PROFILE_KEY] });
  const saved = parseJson<Partial<FreelancerProfile>>(rs.rows[0]?.value);
  return {
    name: saved?.name ?? "",
    headline: saved?.headline ?? "",
    skills: saved?.skills ?? "",
    hourlyRate: typeof saved?.hourlyRate === "number" ? saved.hourlyRate : null,
  };
}

export async function saveProfile(profile: FreelancerProfile): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO settings (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [PROFILE_KEY, JSON.stringify(profile)],
  });
}
