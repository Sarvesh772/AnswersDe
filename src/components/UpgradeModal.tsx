"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface PayuPayload {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone?: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  surl: string;
  furl: string;
  hash: string;
  payuUrl: string;
}

/** Builds and submits the hidden PayU redirect form programmatically. */
function submitPayuForm(p: PayuPayload) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = p.payuUrl;
  form.style.display = "none";

  const fields: Record<string, string> = {
    key: p.key,
    txnid: p.txnid,
    amount: p.amount,
    productinfo: p.productinfo,
    firstname: p.firstname,
    email: p.email,
    phone: p.phone ?? "",
    udf1: p.udf1 ?? "",
    udf2: p.udf2 ?? "",
    udf3: p.udf3 ?? "",
    udf4: p.udf4 ?? "",
    udf5: p.udf5 ?? "",
    surl: p.surl,
    furl: p.furl,
    hash: p.hash,
  };

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

export default function UpgradeModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payu/initiate", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Could not start the payment.",
        );
      }
      const payload = (await res.json()) as PayuPayload;
      submitPayuForm(payload);
      // The page navigates to PayU; leave the loading state in place.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl">
          🔒
        </div>
        <h2 className="mt-4 text-lg font-bold text-zinc-900">
          Aapke free doubts khatam ho gaye!
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Get the ₹49 Monthly Pass to keep solving unlimited doubts step by step.
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Redirecting to PayU…" : "Upgrade — ₹49/month"}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="mt-2 w-full rounded-xl py-2 text-sm text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-60"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
