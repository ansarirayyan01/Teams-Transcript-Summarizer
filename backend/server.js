import express from "express";
import cors from "cors";
// import { getMeetingTranscript } from "./graph.js";
import { summarizeWithGemini } from "./summarizer_gemini.js";
import { getMeetingTranscript } from "./graph.js";

const app = express();
app.use(cors());
app.use(express.json());

// Manual transcript fetch
app.get("/transcript/:meetingId", async (req, res) => {
  try {
    const data = await getMeetingTranscript(req.params.meetingId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manual summary
app.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;
    const summary = await summarizeWithGemini(text);
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// // Automatic transcript watcher
// app.get("/auto-summary/:meetingId", async (req, res) => {
//   const meetingId = req.params.meetingId;
//
//   let attempts = 0;
//
//   const interval = setInterval(async () => {
//     attempts++;
//
//     const result = await pollTranscript(meetingId);
//
//     if (result) {
//       clearInterval(interval);
//       return res.json({
//         success: true,
//         message: "Transcript ready & summarized!",
//         summary: result.summary
//       });
//     }
//
//     if (attempts > 20) {
//       clearInterval(interval);
//       return res.json({
//         success: false,
//         message: "Transcript still not ready. Try again later."
//       });
//     }
//
//   }, 10000); // check every 10 seconds
// });

// Combined endpoint: get summary by meeting ID
app.get("/summary/:meetingId", async (req, res) => {
  try {
    const transcript = await getMeetingTranscript(req.params.meetingId);
    const summary = await summarizeWithGemini(transcript);
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5000, () => console.log("Backend running on port 5000"));
