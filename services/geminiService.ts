import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";

const tools: FunctionDeclaration[] = [
  {
    name: "list_files",
    description: "List files in a repository directory.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        owner: { type: Type.STRING, description: "Repository owner (optional, inferred if not provided)" },
        repo: { type: Type.STRING, description: "Repository name (optional, inferred if not provided)" },
        path: { type: Type.STRING, description: "Directory path (default: root)" },
      },
    },
  },
  {
    name: "read_file",
    description: "Read the content of a file in the repository.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        owner: { type: Type.STRING },
        repo: { type: Type.STRING },
        path: { type: Type.STRING, description: "File path" },
      },
      required: ["path"],
    },
  },
  {
    name: "create_or_update_file",
    description: "Create a new file or update an existing file with FULL content.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        owner: { type: Type.STRING },
        repo: { type: Type.STRING },
        path: { type: Type.STRING, description: "File path" },
        content: { type: Type.STRING, description: "Full file content" },
        message: { type: Type.STRING, description: "Commit message" },
      },
      required: ["path", "content", "message"],
    },
  },
  {
    name: "replace_in_file",
    description: "Replace a specific string in a file with new content. Use this for small edits like comments or refactors.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        owner: { type: Type.STRING },
        repo: { type: Type.STRING },
        path: { type: Type.STRING, description: "File path" },
        search: { type: Type.STRING, description: "The exact string or code block to find" },
        replace: { type: Type.STRING, description: "The new string or code block to replace with" },
        message: { type: Type.STRING, description: "Commit message" },
      },
      required: ["path", "search", "replace", "message"],
    },
  },
  {
    name: "delete_file",
    description: "Delete a file from the repository.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        owner: { type: Type.STRING },
        repo: { type: Type.STRING },
        path: { type: Type.STRING, description: "File path" },
        message: { type: Type.STRING, description: "Commit message" },
      },
      required: ["path", "message"],
    },
  },
];

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateResponse(
    history: any[], 
    userMessage: string, 
    context: any,
    model: string
  ) {
    const systemInstruction = `
      You are an autonomous senior software engineer agent embedded in <Graphite:Git>.
      
      CURRENT APP CONTEXT:
      ${JSON.stringify(context, null, 2)}
      
      NOTE ON CONTEXT:
      - If 'currentSelection' is present in the context, the user is specifically referring to that snippet of code within 'fileContent'.
      - When asked to Refactor, Comment, or Explain, focus specifically on the 'currentSelection'.
      - PREFER 'replace_in_file' for small edits, comments, or granular refactors to avoid rewriting large files.
      - Use 'create_or_update_file' only for creating new files or when the changes are so extensive that a full rewrite is safer.
      
      CAPABILITIES:
      - You can navigate the user's repositories.
      - You can READ, WRITE, UPDATE, and DELETE files.
      - When asked to create or edit code, produce high-quality, production-ready code.
      - ALWAYS check the current context (active repo/path) before acting. If 'owner'/'repo' args are missing in tools, infer them from context.
      
      RULES:
      - Be concise and professional.
      - If you need to perform an action (edit/create/delete), CALL THE FUNCTION. Do not just describe it.
      - If you are writing a file, ensure the content is complete.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: [
            ...history,
            { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: tools }],
          thinkingConfig: model.includes('gemini-3-pro-preview') ? { thinkingBudget: 1024 } : undefined
        }
      });
      return response;
    } catch (e) {
      console.error("Gemini Error:", e);
      throw e;
    }
  }
}