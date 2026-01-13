import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

export async function summarizeWithGemini(text) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `
You are an expert meeting summarizer. Analyze the following Teams meeting transcript and extract only the most important information.

**Instructions:**
- Focus on actionable content and key decisions
- Ignore greetings, small talk, jokes, and off-topic discussions
- Be specific with names, tasks, and deadlines
- Only include sections that have actual content

**Format your response as follows:**

**📌 Key Highlights**
- [Maximum 4 bullet points covering the main topics discussed]
- [Focus on outcomes, not just what was talked about]

**📝 Action Items**
- [Name] → [Specific task] [by deadline if mentioned]
- [Only list items with clear ownership]

**🎯 Decisions Made**
- [Only confirmed decisions, not proposals or discussions]
- [Include context if the decision impacts other work]

**⚠️ Risks / Blockers**
- [Only if explicitly raised as concerns]
- [Include any mentioned mitigation plans]

**💬 Topics Discussed**
- [Topic]: [Brief 1-line summary]
- [Only include if it adds value to understanding the meeting]

**Transcript:**
${text}

---

**Summary:**
`;

  const resp = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ text: prompt }],
    config: {
      thinkingConfig: {
        thinkingBudget: 0, // Disables thinking
      },
    }
  });
  return resp.text; // JSON summary string
}
