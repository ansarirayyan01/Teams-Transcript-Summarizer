import axios from "axios";
import dotenv from "dotenv";
import he from "he";

dotenv.config();

const tenantId = process.env.GRAPH_TENANT_ID;
const clientId = process.env.GRAPH_CLIENT_ID;
const clientSecret = process.env.GRAPH_CLIENT_SECRET;

/**
 * Get Microsoft Graph API access token
 */
async function getGraphToken() {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  try {
    const response = await axios.post(url, params);
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting token:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * List all transcripts for a meeting
 */
async function listMeetingTranscripts(meetingId) {
  const token = await getGraphToken();
  const url = `https://graph.microsoft.com/beta/communications/onlineMeetings/${meetingId}/transcripts`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.value;
  } catch (error) {
    console.error("Error listing transcripts:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get transcript content in VTT format
 */
async function getTranscriptContent(meetingId, transcriptId) {
  const token = await getGraphToken();
  const url = `https://graph.microsoft.com/beta/communications/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content?$format=text/vtt`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
    return response.data;
  } catch (error) {
    console.error("Error getting transcript content:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Parse VTT format to plain text
 */
function parseVTTToText(vttContent) {
  const lines = vttContent.split('\n');
  const textLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line &&
      !line.startsWith('WEBVTT') &&
      !line.includes('-->') &&
      !line.match(/^\d+$/)) {

      const speakerMatch = line.match(/<v ([^>]+)>(.+)<\/v>/);
      if (speakerMatch) {
        textLines.push(`${speakerMatch[1]}: ${speakerMatch[2]}`);
      } else {
        textLines.push(line);
      }
    }
  }

  return textLines.join('\n');
}

/**
 * Basic HTML -> plain text for chat messages
 */
function stripHtml(content) {
  if (!content) return "";
  // Decode common HTML entities then drop tags
  const decoded = he.decode(content);
  return decoded.replace(/<[^>]*>/g, "").trim();
}

/**
 * Fetch chat/thread (thread.v2) messages
 * Expects threadId that resolves with /chats/{id}/messages
 */
export async function getChatThreadMessages(threadId) {
  const token = await getGraphToken();
  const url = `https://graph.microsoft.com/v1.0/chats/${threadId}/messages`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.value || [];
  } catch (error) {
    console.error("Error fetching chat thread messages:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Convert chat messages array to a single plain text blob
 */
export function flattenChatMessages(messages) {
  if (!Array.isArray(messages)) return "";

  return messages
    .map((m) => {
      const sender = m.from?.user?.displayName || "Unknown";
      const body = stripHtml(m.body?.content || "");
      if (!body) return null;
      return `${sender}: ${body}`;
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Parse DOCX/TXT transcript to plain text
 */
function parseTextTranscript(content) {
  const lines = content.split('\n');
  const textLines = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.match(/^\d{2}:\d{2}:\d{2}$/)) {
      textLines.push(trimmed);
    }
  }
  
  return textLines.join('\n');
}

/**
 * Fetch transcript via API
 */
export async function getMeetingTranscript(meetingId) {
  try {
    console.log(`Fetching transcripts for meeting: ${meetingId}`);

    const transcripts = await listMeetingTranscripts(meetingId);

    if (!transcripts || transcripts.length === 0) {
      console.log("No transcripts found for this meeting");
      return null;
    }

    console.log(`Found ${transcripts.length} transcript(s)`);

    const latestTranscript = transcripts[0];
    const transcriptId = latestTranscript.id;

    console.log(`Fetching transcript: ${transcriptId}`);

    const vttContent = await getTranscriptContent(meetingId, transcriptId);
    const plainText = parseVTTToText(vttContent);

    return {
      metadata: latestTranscript,
      plainText: plainText,
      transcriptId: transcriptId,
      source: 'api'
    };

  } catch (error) {
    console.error("Error in getMeetingTranscript:", error.message);

    if (error.response?.status === 404) {
      console.error("Meeting or transcript not found. Check your meeting ID.");
    } else if (error.response?.status === 403) {
      console.error("Permission denied. Ensure your app has OnlineMeetingTranscript.Read.All permission.");
    } else if (error.response?.status === 401) {
      console.error("Unauthorized. Check your tenant ID, client ID, and client secret.");
    }

    throw error;
  }
}

/**
 * Parse uploaded transcript file
 */
export function parseUploadedTranscript(fileBuffer, fileName) {
  try {
    console.log(`Parsing uploaded file: ${fileName}`);

    const fileContent = fileBuffer.toString('utf-8');
    const fileExtension = fileName.split('.').pop().toLowerCase();

    let plainText;

    switch (fileExtension) {
      case 'vtt':
        plainText = parseVTTToText(fileContent);
        break;
      
      case 'txt':
      case 'docx':
        plainText = parseTextTranscript(fileContent);
        break;
      
      default:
        plainText = fileContent;
    }

    console.log(`✅ Successfully parsed transcript (${plainText.length} characters)`);

    return {
      fileName: fileName,
      plainText: plainText,
      characterCount: plainText.length,
      wordCount: plainText.split(/\s+/).length,
      source: 'upload'
    };

  } catch (error) {
    console.error("❌ Error parsing uploaded transcript:", error.message);
    throw error;
  }
}