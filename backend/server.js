import express from 'express';
import multer from 'multer';
import cors from 'cors';
import {
  getMeetingTranscript,
  parseUploadedTranscript,
  getChatThreadMessages,
  flattenChatMessages,
} from './graph.js';
import { summarizeWithGemini } from './summarizer_gemini.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend')); // Serve frontend files

/**
 * Route 1: Upload transcript file and get summary
 */
app.post('/api/upload-transcript', upload.single('transcript'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📁 Received file: ${req.file.originalname}`);

    // Parse the uploaded transcript
    const transcript = parseUploadedTranscript(req.file.buffer, req.file.originalname);

    // Summarize with AI
    const summary = await summarizeWithGemini(transcript.plainText);

    res.json({
      success: true,
      transcript: {
        fileName: transcript.fileName,
        characterCount: transcript.characterCount,
        wordCount: transcript.wordCount,
        source: transcript.source
      },
      summary: summary
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ 
      error: 'Failed to process transcript',
      message: error.message 
    });
  }
});

/**
 * Route 2: Fetch transcript by meeting ID and get summary
 */
app.post('/api/fetch-transcript', async (req, res) => {
  try {
    const { meetingId } = req.body;

    if (!meetingId) {
      return res.status(400).json({ error: 'Meeting ID is required' });
    }

    console.log(`🔍 Fetching transcript for meeting: ${meetingId}`);

    let plainText = null;
    let transcriptMeta = null;

    // Try standard online meeting transcript first
    try {
      const transcript = await getMeetingTranscript(meetingId);
      if (transcript?.plainText) {
        plainText = transcript.plainText;
        transcriptMeta = {
          transcriptId: transcript.transcriptId,
          createdDate: transcript.metadata?.createdDateTime,
          source: transcript.source || 'api',
          type: 'transcript'
        };
      }
    } catch (err) {
      console.warn('Transcript fetch failed, will try chat thread messages.', err.message);
    }

    // Fallback: fetch chat/thread.v2 messages and flatten
    if (!plainText) {
      const messages = await getChatThreadMessages(meetingId);
      if (!messages || messages.length === 0) {
        return res.status(404).json({
          error: 'No transcript or chat messages found',
          message: 'Ensure transcription or meeting chat exists and the ID is correct'
        });
      }
      plainText = flattenChatMessages(messages);
      transcriptMeta = { source: 'chat', type: 'thread.v2', messageCount: messages.length };
    }

    // Summarize with AI
    const summary = await summarizeWithGemini(plainText);

    res.json({
      success: true,
      transcript: transcriptMeta,
      summary: summary
    });

  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transcript',
      message: error.message 
    });
  }
});

/**
 * Health check route
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Upload endpoint: POST http://localhost:${PORT}/api/upload-transcript`);
  console.log(`🔍 Fetch endpoint: POST http://localhost:${PORT}/api/fetch-transcript`);
});