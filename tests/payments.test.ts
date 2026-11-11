import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyCapture, valueToCents, centsToValue, type PayPalOrder } from "../src/lib/paypal-verify";
import { normalisePercents, splitByPercent } from "../src/lib/format";

// These tests guard the money logic: a milestone may only be marked paid when
// PayPal's capture matches exactly what we asked the client to pay.

function order(overrides: Partial<{ status: string; captureStatus: string; value: string; currency: string; customId: string }> = {}): PayPalOrder {
  return {
    id: "ORDER1",
    status: overrides.status ?? "COMPLETED",
    payer: { name: { given_name: "Sam", surname: "Buyer" }, email_address: "sam@example.com" },
    purchase_units: [
      {
        reference_id: "milestone-7",
        payments: {
          captures: [
            {
              id: "CAPTURE1",
              status: overrides.captureStatus ?? "COMPLETED",
              custom_id: overrides.customId ?? "7",
              amount: { currency_code: overrides.currency ?? "USD", value: overrides.value ?? "2100.00" },
            },
          ],
        },
      },
    ],
  };
}

const expected = { milestoneId: 7, amountCents: 210000, currency: "USD" };

test("accepts a completed capture that matches milestone, amount and currency", () => {
  const result = verifyCapture(order(), expected);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.captureId, "CAPTURE1");
    assert.equal(result.payerName, "Sam Buyer");
    assert.equal(result.amountCents, 210000);
  }
});

test("rejects pending captures (e.g. under PayPal review)", () => {
  assert.equal(verifyCapture(order({ captureStatus: "PENDING" }), expected).ok, false);
});

test("rejects orders that are not COMPLETED", () => {
  assert.equal(verifyCapture(order({ status: "APPROVED" }), expected).ok, false);
});

test("rejects an amount mismatch, even by one cent", () => {
  assert.equal(verifyCapture(order({ value: "2099.99" }), expected).ok, false);
});

test("rejects a currency mismatch", () => {
  assert.equal(verifyCapture(order({ currency: "EUR" }), expected).ok, false);
});

test("rejects a capture for a different milestone", () => {
  assert.equal(verifyCapture(order({ customId: "8" }), expected).ok, false);
});

test("converts between PayPal decimal strings and cents without float drift", () => {
  assert.equal(valueToCents("19.99"), 1999);
  assert.equal(valueToCents("0.10"), 10);
  assert.equal(centsToValue(1999), "19.99");
  assert.equal(centsToValue(500), "5.00");
});

test("milestone split always sums to the exact project price", () => {
  for (const total of [840000, 100, 99999, 1]) {
    const parts = splitByPercent(total, [33, 33, 34]);
    assert.equal(parts.reduce((a, b) => a + b, 0), total);
  }
});

test("AI milestone percentages are normalised to exactly 100", () => {
  for (const input of [[30, 40, 31], [33, 33, 33], [50, 60], [100]]) {
    const out = normalisePercents(input);
    assert.equal(out.reduce((a, b) => a + b, 0), 100);
    assert.ok(out.every((p) => p >= 1));
  }
});
