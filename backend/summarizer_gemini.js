import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

export async function summarizeWithGemini(text) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `
Summarize the following meeting transcript into the key points only.

Return the summary in this exact format:

**📌 Highlights**
- Short, crisp bullets (max 4)

**📝 Action Items**
- {Person} → {Task} (Deadline if mentioned)

**🎯 Decisions**
- Only list confirmed decisions

**⚠️ Risks / Blockers**
- Mention only if explicitly discussed

Keep the summary extremely concise. Remove filler talk, greetings, jokes, and unrelated chatter.
Summarize the following meeting transcript:
${text}
`;

  const resp = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ text: prompt }],
  });
  return resp.text; // JSON summary string
}
