import { NextRequest, NextResponse } from "next/server";
import { getVaultFile, createVaultFile } from "@/lib/obsidian-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Parâmetro 'path' é obrigatório" }, { status: 400 });
    }

    const note = await getVaultFile(path);
    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Falha ao ler a nota do Obsidian." },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, content } = body;

    if (!path || content === undefined) {
      return NextResponse.json(
        { error: "Campos 'path' e 'content' são obrigatórios" },
        { status: 400 }
      );
    }

    await createVaultFile(path, content);
    return NextResponse.json({ success: true, path });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Falha ao criar nota no Obsidian." },
      { status: 502 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, content } = body;

    if (!path || content === undefined) {
      return NextResponse.json(
        { error: "Campos 'path' e 'content' são obrigatórios" },
        { status: 400 }
      );
    }

    // Using createVaultFile as an upsert/overwrite
    await createVaultFile(path, content);
    return NextResponse.json({ success: true, path });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar a nota no Obsidian." },
      { status: 502 }
    );
  }
}
