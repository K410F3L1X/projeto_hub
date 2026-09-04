import { NextRequest, NextResponse } from "next/server";
import { searchVault } from "@/lib/obsidian-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Parâmetro 'q' é obrigatório" }, { status: 400 });
    }

    const results = await searchVault(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching vault:", error);
    return NextResponse.json(
      { error: "Falha ao pesquisar no Obsidian." },
      { status: 502 }
    );
  }
}
