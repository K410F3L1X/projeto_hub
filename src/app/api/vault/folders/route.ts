import { NextRequest, NextResponse } from "next/server";
import { getAllVaultFolders, createVaultDirectory } from "@/lib/obsidian-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const folders = await getAllVaultFolders();
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Falha ao listar pastas do Obsidian." },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body;

    if (!path || typeof path !== "string" || !path.trim()) {
      return NextResponse.json(
        { error: "O nome/caminho da pasta é obrigatório." },
        { status: 400 }
      );
    }

    // Clean slashes and trim
    const sanitizedPath = path
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)
      .join("/");

    if (!sanitizedPath) {
      return NextResponse.json(
        { error: "Caminho de pasta inválido." },
        { status: 400 }
      );
    }

    await createVaultDirectory(sanitizedPath);
    return NextResponse.json({ success: true, folder: sanitizedPath });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Falha ao criar pasta no Obsidian." },
      { status: 502 }
    );
  }
}
