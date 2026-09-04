// Gemini AI Client — server-side only
// Used for summarizing PDFs and long text content

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY not set. Add it to .env.local to enable AI features."
      );
    }
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

const SUMMARY_PROMPT = `Você é um assistente de estudo que organiza conhecimento para um "Segundo Cérebro" em Obsidian.

Analise o texto a seguir e gere um resumo estruturado em Markdown para o meu cofre do Obsidian.

O resumo DEVE seguir esta estrutura exata:

---
tags: [resumo, ingestion]
tipo: resumo-automatico
data: {DATA_ATUAL}
---

# {TÍTULO SUGERIDO}

## 📋 Metadados
- **Autor:** (se identificável, senão "Desconhecido")
- **Tipo de Conteúdo:** (artigo, livro, relatório, anotação, etc.)
- **Tópico Principal:** (uma frase curta)

## 🔑 Conceitos-Chave
- **Conceito 1** — Breve explicação
- **Conceito 2** — Breve explicação
- **Conceito 3** — Breve explicação
(liste de 3 a 8 conceitos)

## 📝 Resumo Executivo
Escreva 3 a 5 parágrafos que capturem a essência do texto. Seja objetivo, mas inclua nuances importantes.

## 💬 Citações Importantes
> "Citação literal relevante do texto"

> "Outra citação relevante"

(inclua 2-4 citações se houver trechos notáveis)

## 🔗 Conexões Sugeridas
- [[Conceito A]] — relação com o texto
- [[Conceito B]] — relação com o texto

---

**Regras:**
- Escreva SEMPRE em português do Brasil
- Use formatação Obsidian (wikilinks com [[]])
- Seja conciso mas completo
- O frontmatter YAML é obrigatório
- O título deve ser descritivo e sem caracteres especiais (\\/:*?"<>|)

TEXTO PARA ANALISAR:
`;

export async function summarizeText(
  text: string,
  customPrompt?: string
): Promise<{ title: string; summary: string }> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: "gemini-3.6-flash" });

  const today = new Date().toISOString().split("T")[0];
  const prompt = (customPrompt || SUMMARY_PROMPT).replace("{DATA_ATUAL}", today);

  // Truncate very long texts to avoid token limits (~100k chars ≈ 25k tokens)
  const maxChars = 100000;
  const truncatedText =
    text.length > maxChars
      ? text.substring(0, maxChars) + "\n\n[... texto truncado por limite de tamanho ...]"
      : text;

  const result = await model.generateContent(prompt + truncatedText);
  const response = result.response;
  const summaryText = response.text();

  // Extract title from the generated markdown (first # heading)
  const titleMatch = summaryText.match(/^#\s+(.+)$/m);
  const title = titleMatch
    ? titleMatch[1].replace(/[\\/:*?"<>|]/g, "").trim()
    : "Resumo sem título";

  return {
    title,
    summary: summaryText,
  };
}

export async function isGeminiConfigured(): Promise<boolean> {
  return !!GEMINI_API_KEY;
}
