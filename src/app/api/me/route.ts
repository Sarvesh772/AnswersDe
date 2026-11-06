import { auth } from "@/lib/auth/server";
import { getDoubtsRemaining } from "@/lib/profile";

export async function GET() {
  let user: { id: string; name?: string | null; email?: string | null; image?: string | null } | undefined;
  try {
    const { data } = await auth.getSession();
    user = data?.user;
  } catch (err) {
    console.error("AnswerDe: getSession failed:", err);
    return new Response(JSON.stringify({ error: "Not authenticated." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Not authenticated." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let doubtsRemaining = 3;
  try {
    doubtsRemaining = await getDoubtsRemaining(user.id);
  } catch (err) {
    console.error("AnswerDe: /api/me failed to read profile:", err);
  }

  return Response.json({
    user: {
      id: user.id,
      name: user.name ?? "",
      email: user.email ?? "",
      image: user.image ?? null,
    },
    doubtsRemaining,
  });
}
