import { NextResponse } from "next/server";
import { renderPdfFromUrl } from "@/lib/puppeteer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function appOrigin(request: Request): string {
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") ?? "Athlete";
    const goal = searchParams.get("goal") ?? "longevity";
    const payload = searchParams.get("payload");

    const templateUrl = new URL("/templates/pdf-protocol", appOrigin(request));
    templateUrl.searchParams.set("name", name);
    templateUrl.searchParams.set("goal", goal);
    if (payload) templateUrl.searchParams.set("payload", payload);

    const pdf = await renderPdfFromUrl(templateUrl.toString());

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="kastoria-protocol-${name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "PDF render failed", detail: message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      goal?: string;
      protocol?: unknown;
    };

    const templateUrl = new URL("/templates/pdf-protocol", appOrigin(request));
    if (body.name) templateUrl.searchParams.set("name", body.name);
    if (body.goal) templateUrl.searchParams.set("goal", body.goal);
    if (body.protocol) {
      templateUrl.searchParams.set(
        "payload",
        Buffer.from(JSON.stringify(body.protocol)).toString("base64url"),
      );
    }

    const pdf = await renderPdfFromUrl(templateUrl.toString());
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="kastoria-protocol.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "PDF render failed", detail: message },
      { status: 500 },
    );
  }
}
