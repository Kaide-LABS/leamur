import { GoogleGenAI } from "@google/genai";

export function getGeminiClient(): GoogleGenAI {
  const useVertexAI = process.env.GOOGLE_GENAI_USE_VERTEXAI === "true";

  if (useVertexAI) {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    if (!project) {
      throw new Error("GOOGLE_CLOUD_PROJECT environment variable is not set");
    }
    return new GoogleGenAI({ vertexai: true, project, location });
  }

  // Fallback to API key for backwards compatibility
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Neither Vertex AI nor GEMINI_API_KEY is configured");
  }
  return new GoogleGenAI({ apiKey });
}
