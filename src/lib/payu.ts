import crypto from "crypto";

export const PLAN_AMOUNT = "49.00";
export const PLAN_PRODUCT_INFO = "AnswerDe Monthly Pass";
export const PLAN_DOUBTS = 100;

const TEST_URL = "https://test.payu.in/_payment";
const PROD_URL = "https://secure.payu.in/_payment";

export function getPayuUrl(): string {
  return process.env.PAYU_MODE?.toLowerCase() === "test" ? TEST_URL : PROD_URL;
}

function sha512(input: string): string {
  return crypto.createHash("sha512").update(input, "utf8").digest("hex");
}

/** Unique, PayU-safe transaction id (alphanumeric, ≤ 25 chars). */
export function generateTxnId(): string {
  return `AD${Date.now()}${crypto.randomBytes(4).toString("hex")}`;
}

export interface HashFields {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

/**
 * Request hash:
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
 */
export function generatePaymentHash(fields: HashFields, salt: string): string {
  const input = [
    fields.key,
    fields.txnid,
    fields.amount,
    fields.productinfo,
    fields.firstname,
    fields.email,
    fields.udf1 ?? "",
    fields.udf2 ?? "",
    fields.udf3 ?? "",
    fields.udf4 ?? "",
    fields.udf5 ?? "",
    "", "", "", "", "",
    salt,
  ].join("|");
  return sha512(input);
}

export interface ResponseHashFields extends HashFields {
  status: string;
}

/**
 * Reverse (response) hash:
 * sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function generateResponseHash(
  fields: ResponseHashFields,
  salt: string,
): string {
  const input = [
    salt,
    fields.status,
    "", "", "", "", "",
    fields.udf5 ?? "",
    fields.udf4 ?? "",
    fields.udf3 ?? "",
    fields.udf2 ?? "",
    fields.udf1 ?? "",
    fields.email,
    fields.firstname,
    fields.productinfo,
    fields.amount,
    fields.txnid,
    fields.key,
  ].join("|");
  return sha512(input);
}

/** Constant-time comparison of the returned hash against the expected one. */
export function verifyResponseHash(
  fields: ResponseHashFields,
  salt: string,
  returnedHash: string,
): boolean {
  const expected = generateResponseHash(fields, salt);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from((returnedHash || "").trim().toLowerCase(), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
