import { NextRequest, NextResponse } from "next/server";
import { listVaultFiles, getVaultOverview } from "@/lib/obsidian-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const directory = searchParams.get("directory") || undefined;

    if (directory) {
      const files = await listVaultFiles(directory);
      return NextResponse.json({ files });
    }

    const overview = await getVaultOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error("Error fetching vault notes:", error);
    return NextResponse.json(
      { error: "Falha ao conectar com o Obsidian. Verifique se está aberto." },
      { status: 502 }
    );
  }
}
