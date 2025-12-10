import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const tenantId = process.env.GRAPH_TENANT_ID;
const clientId = process.env.GRAPH_CLIENT_ID;
const clientSecret = process.env.GRAPH_CLIENT_SECRET;

async function getGraphToken() {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  const response = await axios.post(url, params);
  return response.data.access_token;
}

export async function getMeetingTranscript(meetingId) {
  const token = await getGraphToken();

  const url = `https://graph.microsoft.com/v1.0/communications/onlineMeetings/${meetingId}/transcripts`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data; // Contains transcript chunks
}
