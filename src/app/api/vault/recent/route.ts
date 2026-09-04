import { NextResponse } from "next/server";
import { getRecentFiles } from "@/lib/obsidian-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const recentFiles = await getRecentFiles(10);
    return NextResponse.json({ files: recentFiles });
  } catch (error) {
    console.error("Error fetching recent files:", error);
    return NextResponse.json(
      { error: "Falha ao buscar notas recentes." },
      { status: 502 }
    );
  }
}
