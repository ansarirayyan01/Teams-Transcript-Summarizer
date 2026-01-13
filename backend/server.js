import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { getMeetingTranscript, parseUploadedTranscript } from './graph.js';
import { summarizeTranscript } from './summarizer.js';

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
    console.log('🤖 Generating summary...');
    const summary = await summarizeTranscript(transcript.plainText);

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

    // Fetch transcript from Microsoft Graph API
    const transcript = await getMeetingTranscript(meetingId);

    if (!transcript) {
      return res.status(404).json({ 
        error: 'No transcript found',
        message: 'Make sure transcription was enabled during the meeting'
      });
    }

    // Summarize with AI
    console.log('🤖 Generating summary...');
    const summary = await summarizeTranscript(transcript.plainText);

    res.json({
      success: true,
      transcript: {
        transcriptId: transcript.transcriptId,
        createdDate: transcript.metadata?.createdDateTime,
        source: transcript.source
      },
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