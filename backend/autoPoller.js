import { getMeetingTranscript } from "./graph.js";
import { summarizeWithGemini } from "./summarizer_gemini.js";

export async function pollTranscript(meetingId) {
  console.log("Polling transcript...");

  try {
    const data = await getMeetingTranscript(meetingId);

    if (!data.value || data.value.length === 0) {
      console.log("Transcript not ready yet...");
      return null;
    }

    console.log("Transcript found!");

    const fullText = data.value
      .map((t) => (t.content?.trim ? t.content.trim() : ""))
      .join("\n");

    const summary = await summarizeWithGemini(fullText);

    return {
      transcript: fullText,
      summary: summary,
    };
  } catch (err) {
    console.error("Polling failed:", err.message);
    return null;
  }
}
