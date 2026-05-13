import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kvStore } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isOriginAllowed } from "@/lib/security";

const ALLOWED_KEYS = new Set<string>([
  "ns-strategy",
  "ns-initiatives",
  "ns-notes",
  "ns-gantt",
  "ns-company",
  "ns-brands",
  "ns-team",
  "ns-campaigns",
  "ns-concepts",
  "ns-timeline",
  "ns-orgroles",
  "ns-orgpos",
  "ns-orgconns",
  "ns-camp-timeline",
  "ns-compliance-cards",
  "ns-compliance-docs",
  "ns-compliance-links",
  "ns-compliance-overview",
  "ns-user",
  "ns-agency-submissions",
  "ns-tierlist",
  "ns-weekly-drops",
  "ns-credit-memos",
  "ns-sales-contacts",
  "ns-promo-calendar",
  "ns-popups-blitz",
  "ns-events-cal",
  "ns-cs-board",
  "ns-packaging-tracker",
  "ns-packaging-confirmed",
  "ns-packaging-evolution-tracker",
  "ns-packaging-evolution-confirmed",
  "ns-design-requests",
  "ns-fieldteam-tree",
  "ns-centralized-contacts",
  "ns-field-agenda-v2",
]);

const ALLOWED_PREFIXES = ["ns-concept-html-", "ns-camp-html-", "ns-ch-"];

const MAX_KEY_LEN = 200;
const MAX_VALUE_BYTES = 5 * 1024 * 1024; // 5 MB

function isKeyAllowed(key: unknown): key is string {
  if (typeof key !== "string" || key.length === 0 || key.length > MAX_KEY_LEN) return false;
  if (ALLOWED_KEYS.has(key)) return true;
  return ALLOWED_PREFIXES.some((p) => key.startsWith(p) && key.length > p.length);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!isKeyAllowed(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const [row] = await db
      .select({ value: kvStore.value })
      .from(kvStore)
      .where(eq(kvStore.key, key))
      .limit(1);

    return NextResponse.json({ key, value: row?.value ?? null });
  } catch (e) {
    console.error("GET store error:", e);
    return NextResponse.json({ key, value: null });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOriginAllowed(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { key, value } = (body ?? {}) as { key?: unknown; value?: unknown };

  if (!isKeyAllowed(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }
  if (typeof value !== "string") {
    return NextResponse.json({ error: "Value must be a string" }, { status: 400 });
  }
  if (Buffer.byteLength(value, "utf8") > MAX_VALUE_BYTES) {
    return NextResponse.json({ error: "Value too large" }, { status: 413 });
  }

  try {
    await db
      .insert(kvStore)
      .values({ key, value, updatedAt: new Date(), updatedBy: session.user.id })
      .onConflictDoUpdate({
        target: kvStore.key,
        set: { value, updatedAt: new Date(), updatedBy: session.user.id },
      });

    return NextResponse.json({ key, ok: true });
  } catch (e) {
    console.error("POST store error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOriginAllowed(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!isKeyAllowed(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    await db.delete(kvStore).where(eq(kvStore.key, key));
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ deleted: false }, { status: 500 });
  }
}
