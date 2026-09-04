// Obsidian MCP Client — server-side only
// Communicates with the Obsidian MCP Server via Streamable HTTP (JSON-RPC 2.0)

const OBSIDIAN_URL = process.env.OBSIDIAN_MCP_URL || "http://127.0.0.1:27200";
const OBSIDIAN_TOKEN = process.env.OBSIDIAN_MCP_TOKEN || "";
const MCP_ENDPOINT = `${OBSIDIAN_URL}/mcp`;

let requestId = 1;
let sessionId: string | null = null;
let initialized = false;

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

interface VaultOverview {
  totalNotes: number;
  topFolders: { folder: string; count: number }[];
  recentFiles: { path: string; mtime: number; ctime: number; size: number }[];
}

async function mcpRequest(method: string, params: Record<string, unknown> = {}): Promise<McpResponse> {
  const id = requestId++;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${OBSIDIAN_TOKEN}`,
  };
  if (sessionId) {
    headers["Mcp-Session-Id"] = sessionId;
  }

  const res = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params,
    }),
    cache: "no-store",
  });

  // Capture session ID from response header
  const newSessionId = res.headers.get("Mcp-Session-Id");
  if (newSessionId) {
    sessionId = newSessionId;
  }

  const contentType = res.headers.get("content-type") || "";

  // Handle SSE responses
  if (contentType.includes("text/event-stream")) {
    const text = await res.text();
    const lines = text.split("\n");
    let lastData = "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        lastData = line.substring(6);
      }
    }
    if (lastData) {
      return JSON.parse(lastData);
    }
    throw new Error("No data in SSE response");
  }

  // Handle JSON response
  if (!res.ok) {
    throw new Error(`MCP error: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}

async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  
  try {
    const res = await mcpRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "study-hub", version: "0.1.0" },
    });

    if (res.result) {
      initialized = true;
      // Send initialized notification
      await fetch(MCP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OBSIDIAN_TOKEN}`,
          ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "notifications/initialized",
        }),
        cache: "no-store",
      });
    }
  } catch (err) {
    console.error("MCP initialization failed:", err);
    throw err;
  }
}

async function callTool(toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
  await ensureInitialized();

  const res = await mcpRequest("tools/call", {
    name: toolName,
    arguments: args,
  });

  if (res.error) {
    throw new Error(`MCP tool error: ${res.error.message}`);
  }

  // MCP tool results come as content array
  const result = res.result as { content?: { type: string; text: string }[] };
  if (result?.content && result.content.length > 0) {
    const textContent = result.content.find((c) => c.type === "text");
    if (textContent) {
      try {
        return JSON.parse(textContent.text);
      } catch {
        return textContent.text;
      }
    }
  }
  return result;
}

// --- Public API ---

export async function getVaultOverview(): Promise<VaultOverview> {
  const data = await callTool("get_vault_overview") as VaultOverview;
  return data;
}

export async function listVaultFiles(directory?: string, limit?: number): Promise<string[]> {
  const args: Record<string, unknown> = {};
  if (directory) args.directory = directory;
  if (limit) args.limit = limit;
  
  const data = await callTool("list_vault_files", args) as { files: string[] };
  return data.files || [];
}

export async function getVaultFile(path: string): Promise<{ content: string; frontmatter?: Record<string, unknown>; tags?: string[] }> {
  const data = await callTool("get_vault_file", { path }) as string | { content: string };
  
  // The tool may return raw text or a JSON object
  if (typeof data === "string") {
    return { content: data };
  }
  return { content: (data as { content?: string }).content || String(data), ...(data as Record<string, unknown>) };
}

export async function createVaultFile(path: string, content: string): Promise<void> {
  await callTool("create_vault_file", { path, content });
}

export async function searchVault(query: string): Promise<{ filename: string; score?: number; matches?: { match: { start: number; end: number }; context: string }[] }[]> {
  const data = await callTool("search_vault_simple", { query }) as unknown;
  
  // Normalize search results
  if (Array.isArray(data)) {
    return data;
  }
  if (typeof data === "object" && data !== null && "results" in data) {
    return (data as { results: unknown[] }).results as { filename: string }[];
  }
  return [];
}

export async function getRecentFiles(limit: number = 10): Promise<{ path: string; mtime: number; ctime: number; size: number }[]> {
  const overview = await getVaultOverview();
  return overview.recentFiles.slice(0, limit);
}

// --- Utility Functions ---

export function extractTitle(path: string): string {
  const filename = path.split("/").pop() || path;
  return filename.replace(/\.md$/, "");
}

export function extractFolder(path: string): string {
  const parts = path.split("/");
  return parts.length > 1 ? parts[0] : "Root";
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} ${months === 1 ? "mês" : "meses"} atrás`;
  if (weeks > 0) return `${weeks} ${weeks === 1 ? "semana" : "semanas"} atrás`;
  if (days > 0) return `${days} ${days === 1 ? "dia" : "dias"} atrás`;
  if (hours > 0) return `${hours}h atrás`;
  if (minutes > 0) return `${minutes}min atrás`;
  return "Agora mesmo";
}

export function truncateContent(content: string, maxLength: number = 120): string {
  const clean = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/[#*_~>`\-]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  
  if (clean.length <= maxLength) return clean;
  return clean.substring(0, maxLength).trim() + "…";
}
