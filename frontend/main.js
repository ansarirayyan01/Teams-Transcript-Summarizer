const API_URL = 'http://localhost:3000/api';

// Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const uploadBtn = document.getElementById('uploadBtn');
const meetingIdInput = document.getElementById('meetingId');
const fetchBtn = document.getElementById('fetchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const result = document.getElementById('result');
const summaryContent = document.getElementById('summaryContent');

let selectedFile = null;

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    // Update active tab
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Update active content
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Reset UI
    hideError();
    hideResult();
  });
});

// File upload: Click to upload
uploadArea.addEventListener('click', () => {
  fileInput.click();
});

// File upload: File selected
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    handleFileSelect(file);
  }
});

// File upload: Drag and drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  
  const file = e.dataTransfer.files[0];
  if (file) {
    handleFileSelect(file);
  }
});

// Handle file selection
function handleFileSelect(file) {
  const validExtensions = ['vtt', 'txt', 'docx'];
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  if (!validExtensions.includes(fileExtension)) {
    showError('Invalid file type. Please upload a .vtt, .txt, or .docx file.');
    return;
  }
  
  selectedFile = file;
  fileInfo.style.display = 'block';
  fileInfo.innerHTML = `
    <strong>Selected file:</strong> ${file.name}<br>
    <strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB
  `;
  uploadBtn.disabled = false;
  hideError();
  hideResult();
}

// Upload and summarize
uploadBtn.addEventListener('click', async () => {
  if (!selectedFile) return;
  
  const formData = new FormData();
  formData.append('transcript', selectedFile);
  
  try {
    showLoading();
    hideError();
    hideResult();
    
    const response = await fetch(`${API_URL}/upload-transcript`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to process transcript');
    }
    
    showResult(data.summary);
    
  } catch (err) {
    showError(err.message);
  } finally {
    hideLoading();
  }
});

// Fetch and summarize by meeting ID
fetchBtn.addEventListener('click', async () => {
  const meetingId = meetingIdInput.value.trim();
  
  if (!meetingId) {
    showError('Please enter a meeting ID');
    return;
  }
  
  try {
    showLoading();
    hideError();
    hideResult();
    
    const response = await fetch(`${API_URL}/fetch-transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ meetingId })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch transcript');
    }
    
    showResult(data.summary);
    
  } catch (err) {
    showError(err.message);
  } finally {
    hideLoading();
  }
});

// UI Helper Functions
function showLoading() {
  loading.classList.add('active');
}

function hideLoading() {
  loading.classList.remove('active');
}

function showError(message) {
  error.textContent = message;
  error.classList.add('active');
}

function hideError() {
  error.classList.remove('active');
}

function showResult(summary) {
  summaryContent.textContent = summary;
  result.classList.add('active');
}

function hideResult() {
  result.classList.remove('active');
}