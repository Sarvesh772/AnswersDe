import { auth } from "@/lib/auth/server";
import {
  generatePaymentHash,
  generateTxnId,
  getPayuUrl,
  PLAN_AMOUNT,
  PLAN_PRODUCT_INFO,
} from "@/lib/payu";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_SALT;
  if (!key || !salt) {
    return jsonError(
      "PayU is not configured. Set PAYU_MERCHANT_KEY and PAYU_SALT in .env.local.",
      500,
    );
  }

  // Require a signed-in user so we can tie the transaction to them.
  let user: { id: string; name?: string | null; email?: string | null } | undefined;
  try {
    const { data } = await auth.getSession();
    user = data?.user;
  } catch (err) {
    console.error("AnswerDe: payu initiate getSession failed:", err);
    return jsonError("Could not verify your session. Please sign in again.", 401);
  }
  if (!user?.id) {
    return jsonError("Please sign in to upgrade.", 401);
  }

  // PayU's `firstname` is ASCII-only; fall back to a placeholder when the
  // user's name contains non-ASCII (e.g. Devanagari) characters.
  const rawName = (user.name || user.email || "Student").trim();
  const firstname =
    (rawName.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/)[0] || "Student").slice(0, 60);
  const email = (user.email || "").trim();

  const txnid = generateTxnId();
  const origin = new URL(req.url).origin;
  const surl = `${origin}/api/payu/webhook`;
  const furl = `${origin}/api/payu/webhook`;

  const hash = generatePaymentHash(
    {
      key,
      txnid,
      amount: PLAN_AMOUNT,
      productinfo: PLAN_PRODUCT_INFO,
      firstname,
      email,
      udf1: user.id, // ties the transaction to this user (hash-verified later)
    },
    salt,
  );

  return Response.json({
    key,
    txnid,
    amount: PLAN_AMOUNT,
    productinfo: PLAN_PRODUCT_INFO,
    firstname,
    email,
    phone: "9999999999", // PayU requires a 10-digit phone; collect a real one later
    udf1: user.id,
    udf2: "",
    udf3: "",
    udf4: "",
    udf5: "",
    surl,
    furl,
    hash,
    payuUrl: getPayuUrl(),
  });
}
