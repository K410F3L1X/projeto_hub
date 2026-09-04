import { NextResponse } from "next/server";
import { listVaultFiles } from "@/lib/obsidian-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const files = await listVaultFiles("", 1000);
    
    // Group files by folder
    const fileTree: Record<string, string[]> = {};
    
    files.forEach((file) => {
      const parts = file.split("/");
      if (parts.length > 1) {
        const folder = parts[0];
        const filename = parts.slice(1).join("/");
        if (!fileTree[folder]) {
          fileTree[folder] = [];
        }
        fileTree[folder].push(filename);
      } else {
        if (!fileTree["Root"]) {
          fileTree["Root"] = [];
        }
        fileTree["Root"].push(file);
      }
    });

    return NextResponse.json({ files: fileTree });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Falha ao ler arquivos do Obsidian." },
      { status: 502 }
    );
  }
}
