# Projeto Hub (Study Hub)

Um painel de estudos e produtividade (Dashboard) focado em integrar uma interface moderna com as suas anotações no **Obsidian** e a inteligência artificial do **Google Gemini**.

## 🚀 Funcionalidades Principais

*   **Integração com o Obsidian:** Lê, edita, busca e cria notas diretamente no seu cofre do Obsidian sem sair do aplicativo.
*   **Inteligência Artificial (Gemini):** Gera resumos, estrutura informações em Markdown (com wikilinks do Obsidian) utilizando a API do Gemini.
*   **Interface Moderna:** Estilizado com Tailwind CSS e React.
*   **Multiplataforma:** Roda tanto como uma aplicação web nativa quanto como um aplicativo desktop usando Electron.

## 🛠️ Tecnologias Utilizadas

*   **[Next.js](https://nextjs.org/)** (v14) + **React** (v18)
*   **[Electron](https://www.electronjs.org/)** - Para rodar como um app Desktop independente
*   **[Tailwind CSS](https://tailwindcss.com/)** - Estilização
*   **API do Google Gemini** (`@google/generative-ai`)
*   **Obsidian Local REST API / MCP** - Para a comunicação direta com o seu cofre

---

## ⚙️ Pré-requisitos

Para rodar este projeto, você precisará de:

1.  **Node.js** (recomendado usar a versão LTS mais recente)
2.  **Obsidian** aberto e com o plugin [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) ou [MCP](https://modelcontextprotocol.io/) configurado e rodando.
3.  Uma **API Key do Google Gemini** (criada no Google AI Studio).

## 🔒 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do seu projeto e adicione as seguintes chaves. Lembre-se de substituir os valores pelos seus dados reais:

```env
OBSIDIAN_MCP_URL=http://127.0.0.1:27200
OBSIDIAN_MCP_TOKEN=seu_token_gerado_no_plugin_do_obsidian
GEMINI_API_KEY=sua_chave_de_api_do_google_gemini
```

> **Aviso:** Nunca faça o *commit* (envio) do seu arquivo `.env.local` para um repositório público no GitHub.

## 💻 Como Executar o Projeto

Primeiro, instale todas as dependências:

```bash
npm install
```

### 🌐 Rodar na Web (Modo de Desenvolvimento Web)
Para testar apenas o sistema no navegador:

```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

### 🖥️ Rodar como App Desktop (Modo Electron)
Para abrir a aplicação como um aplicativo nativo no seu computador:

```bash
npm run electron:dev
```

### 📦 Compilar o Aplicativo (Build Final)
Para gerar o executável (.exe) do Windows:

```bash
npm run electron:build
```
Isso vai gerar a build de produção do Next.js e empacotar tudo no instalador usando o `electron-builder`.

## 🏗️ Estrutura do Projeto

*   `/src/app`: Rotas e páginas do Next.js (App Router)
*   `/src/components`: Componentes da interface React (Sidebar, Modais, etc)
*   `/src/lib`: Bibliotecas clientes de comunicação:
    *   `obsidian-client.ts`: Lida com as chamadas de rede (fetch) para o seu servidor local do Obsidian.
    *   `gemini-client.ts`: Lida com a comunicação com a API do Google Gemini.
*   `/electron`: Código principal e configurações para o Electron empacotar a versão desktop.

---

**Nota:** Como a comunicação com o Obsidian depende do servidor local em `127.0.0.1`, o aplicativo precisará que o programa do Obsidian esteja aberto em seu computador para efetuar o carregamento de notas, buscas ou alterações no seu cofre. Caso contrário, será retornado o status "Obsidian Offline".

---

## 🤖 Sobre o Desenvolvimento (Powered by AI) & 🎓 Propósito Educacional

Este projeto tem um **propósito 100% voltado para estudos e aprendizado**. O objetivo principal foi explorar como a IA pode acelerar o desenvolvimento de aplicações completas (Fullstack e Desktop), mesmo lidando com integrações complexas e tecnologias que eu ainda não dominava no início. Ele foi desenvolvido com o auxílio contínuo de Inteligência Artificial (Google Gemini).

Utilizar a IA não substitui o papel do desenvolvedor, mas atua como um "Pair Programmer" super avançado, permitindo criar arquiteturas robustas, resolver bugs e implementar funcionalidades de forma rápida e eficiente, além de servir como uma excelente ferramenta de aprendizado. Deixar isso claro demonstra honestidade, adaptabilidade e que você sabe usar as ferramentas modernas a seu favor para gerar valor de forma rápida, além de evidenciar a busca por novos conhecimentos! Recomendo a todos abraçarem a IA no seu fluxo de estudo e trabalho.

### 🧠 Mapa de Aprendizado

Durante o desenvolvimento deste projeto com o auxílio da Inteligência Artificial, pude ser apresentado e aprender na prática sobre:

*   **Next.js e React:** Estrutura de rotas (App Router), criação de componentes de interface e hooks básicos.
*   **Tailwind CSS:** Utilização de classes utilitárias para construir interfaces modernas e responsivas de forma rápida.
*   **Integração de APIs de IA:** Como configurar e consumir a API do Google Gemini para gerar e estruturar dados.
*   **Consumo de APIs Locais:** Como realizar chamadas HTTP (`fetch`) para o Obsidian (REST API / MCP) rodando na máquina local.

**Pontos que ainda são complexos e requerem mais estudos (Próximos Passos):**

*   **Electron:** A comunicação entre o processo principal (Node.js) e o processo de renderização (React), além da configuração de empacotamento (builds) para desktop ainda possuem uma curva de aprendizado íngreme.
*   **Gerenciamento de Estado e Ciclo de Vida (React):** Entender profundamente a diferença entre Server Components e Client Components no Next.js e como gerenciar o estado global da aplicação de forma otimizada.
*   **Tratamento Avançado de Erros e Assincronicidade:** Lidar com cenários de falha (ex: quando o Obsidian está fechado) e o tempo de resposta das APIs de forma mais robusta e amigável ao usuário.
