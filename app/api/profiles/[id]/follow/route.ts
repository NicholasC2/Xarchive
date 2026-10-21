import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const user = (await auth.getSession()).data?.user;
    if (!user) return NextResponse.json({ error: "Sign in to follow artists and listeners." }, { status: 401 });

    const { id } = await params;
    const { follow } = await request.json();
    if (!id || id === user.id || typeof follow !== "boolean") {
      return NextResponse.json({ error: "That follow action is not valid." }, { status: 400 });
    }

    if (follow) {
      
    } else {

    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "The follow action could not be saved." }, { status: 500 });
  }
}