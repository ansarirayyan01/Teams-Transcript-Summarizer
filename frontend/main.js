document.getElementById("summarizeBtn").onclick = async function () {
  const input = document.getElementById("inputText").value.trim();
  const summaryDiv = document.getElementById("summary");
  const loadingDiv = document.getElementById("loading");
  summaryDiv.textContent = "";
  if (!input) {
    summaryDiv.textContent = "Please enter Meeting ID or paste your meeting text.";
    return;
  }
  loadingDiv.textContent = "Summarizing with Gemini. Please wait...";
  try {
    const resp = await fetch("http://localhost:5000/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });
    const data = await resp.json();
    if (data.success && data.summary) {
      summaryDiv.innerHTML = `<strong>Summary:</strong><br><pre>${data.summary}</pre>`;
    } else {
      summaryDiv.textContent =
        data.message || data.error || "No summary available.";
    }
  } catch (err) {
    summaryDiv.textContent = "Error: " + err.message;
  }
  loadingDiv.textContent = "";
};
