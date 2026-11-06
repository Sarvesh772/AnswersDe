import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { PLAN_DOUBTS, verifyResponseHash } from "@/lib/payu";

function redirect(location: string) {
  return new Response(null, { status: 302, headers: { Location: location } });
}

/**
 * PayU redirects the user's browser here (surl on success, furl on failure)
 * with the response as query parameters. We verify the hash, credit the doubts,
 * and bounce the user back to the app.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.searchParams;
  const base = `${url.origin}/`;

  const salt = process.env.PAYU_SALT || "";
  const status = params.get("status") ?? "";

  const fields = {
    key: params.get("key") ?? "",
    txnid: params.get("txnid") ?? "",
    amount: params.get("amount") ?? "",
    productinfo: params.get("productinfo") ?? "",
    firstname: params.get("firstname") ?? "",
    email: params.get("email") ?? "",
    udf1: params.get("udf1") ?? "",
    udf2: params.get("udf2") ?? "",
    udf3: params.get("udf3") ?? "",
    udf4: params.get("udf4") ?? "",
    udf5: params.get("udf5") ?? "",
    status,
  };

  const valid = salt
    ? verifyResponseHash(fields, salt, params.get("hash") ?? "")
    : false;

  if (status === "success" && valid) {
    // Identify the user: prefer the live session, fall back to `udf1` (which
    // is part of the verified hash, so it cannot be tampered with).
    let userId: string | null = null;
    try {
      const { data } = await auth.getSession();
      userId = data?.user?.id ?? null;
    } catch (err) {
      console.error("AnswerDe: payu webhook getSession failed:", err);
    }
    if (!userId) userId = fields.udf1 || null;

    if (!userId) {
      console.error("AnswerDe: payu webhook could not identify user for txnid", fields.txnid);
      return redirect(`${base}?payment=failure`);
    }

    try {
      await sql()`INSERT INTO profiles (user_id, doubts_remaining) VALUES (${userId}, ${PLAN_DOUBTS}) ON CONFLICT (user_id) DO UPDATE SET doubts_remaining = profiles.doubts_remaining + ${PLAN_DOUBTS}, updated_at = now()`;
    } catch (err) {
      console.error("AnswerDe: payu webhook failed to credit doubts:", err);
      return redirect(`${base}?payment=failure`);
    }

    return redirect(`${base}?payment=success`);
  }

  return redirect(`${base}?payment=failure`);
}
