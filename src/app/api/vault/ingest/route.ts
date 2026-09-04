import { NextRequest, NextResponse } from "next/server";
import { createVaultFile } from "@/lib/obsidian-client";
import { summarizeText, isGeminiConfigured } from "@/lib/gemini-client";

export const dynamic = "force-dynamic";

// pdf-parse is CommonJS, needs dynamic import
async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let text = "";
    let originalName = "upload";

    // Handle multipart (PDF file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      // Validate file type
      if (!file.name.endsWith(".pdf")) {
        return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
      }

      // Validate file size (20MB limit)
      const MAX_SIZE = 20 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 20MB." },
          { status: 400 }
        );
      }

      originalName = file.name.replace(/\.pdf$/i, "");
      const arrayBuffer = await file.arrayBuffer();
      text = await extractPdfText(Buffer.from(arrayBuffer));

      if (!text.trim()) {
        return NextResponse.json(
          { error: "Could not extract text from PDF. The file may be image-based or encrypted." },
          { status: 422 }
        );
      }
    }
    // Handle JSON body (plain text)
    else if (contentType.includes("application/json")) {
      const body = await request.json();
      text = body.text || "";
      originalName = body.filename || "texto";

      if (!text.trim()) {
        return NextResponse.json({ error: "No text provided" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
    }

    // Check if Gemini is configured
    const aiConfigured = await isGeminiConfigured();
    if (!aiConfigured) {
      return NextResponse.json(
        { error: "AI not configured. Add GEMINI_API_KEY to .env.local" },
        { status: 503 }
      );
    }

    // Generate AI summary
    const { title, summary } = await summarizeText(text);

    // Auto-save if requested
    const url = new URL(request.url);
    const autoSave = url.searchParams.get("autoSave") === "true";
    const folder = url.searchParams.get("folder") || "Biblioteca";

    if (autoSave) {
      const sanitizedTitle = title.replace(/[\\/:*?"<>|]/g, "").trim();
      const path = `${folder}/${sanitizedTitle}.md`;
      await createVaultFile(path, summary);

      return NextResponse.json({
        title,
        summary,
        saved: true,
        path,
        extractedLength: text.length,
      });
    }

    return NextResponse.json({
      title,
      summary,
      saved: false,
      extractedLength: text.length,
    });
  } catch (err) {
    console.error("Ingest error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
