# Backend Summarizer (Gemini)

This project provides a backend service for text summarization using Google's Gemini model.

## Features
- Summarizes input text via an API endpoint
- Integrates with Gemini for high-quality summaries
- Simple RESTful API using Node.js and Express

## Project Structure
- `backend/server.js`: Main Express server setup
- `backend/summarizer_gemini.js`: Gemini summarization logic

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- Gemini API credentials

### Installation
1. Clone the repository:
   ```sh
   git clone <repo-url>
   ```
2. Navigate to the backend folder:
   ```sh
   cd backend
   ```
3. Install dependencies:
   ```sh
   npm install
   ```

### Running the Server
```sh
node backend/server.js
```

The server will start on the configured port (default: 5000).

## API Usage
- **POST** `/summarize`
  - **Body:** `{ "text": "Your text here" }`
  - **Response:** `{ "summary": "Summarized text" }`