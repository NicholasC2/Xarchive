import { NextResponse } from "next/server";
import { ensureArchiveTables } from "@/lib/archive";
import { searchArchiveEntries, validateSearchGroups } from "@/lib/archive-search";

export const dynamic = "force-dynamic";

function parsePage(value: string | null) {
  const page = Number(value ?? "1");
  return Number.isSafeInteger(page) && page > 0 && page <= 100_000 ? page : null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = parsePage(params.get("page"));
  if (!page) return NextResponse.json({ error: "Choose a valid page." }, { status: 400 });
  try {
    await ensureArchiveTables();
    const result = await searchArchiveEntries({
      query: params.get("q") ?? "",
      kind: params.get("type") ?? undefined,
      page,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Search is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: { query?: unknown; type?: unknown; page?: unknown; groups?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send valid search filters." }, { status: 400 });
  }
  if (body.query !== undefined && (typeof body.query !== "string" || body.query.length > 160)) {
    return NextResponse.json({ error: "Search text must be 160 characters or fewer." }, { status: 400 });
  }
  if (body.type !== undefined && (typeof body.type !== "string" || !["song", "album", "artist", "collective"].includes(body.type))) {
    return NextResponse.json({ error: "Choose a valid entry type." }, { status: 400 });
  }
  const page = Number(body.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) {
    return NextResponse.json({ error: "Choose a valid page." }, { status: 400 });
  }
  let groups;
  try {
    groups = validateSearchGroups(body.groups ?? []);
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "A filter is invalid." }, { status: 400 });
  }
  try {
    await ensureArchiveTables();
    const result = await searchArchiveEntries({
      query: typeof body.query === "string" ? body.query : "",
      kind: typeof body.type === "string" ? body.type : undefined,
      page,
      groups,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Search is temporarily unavailable." }, { status: 503 });
  }
}
