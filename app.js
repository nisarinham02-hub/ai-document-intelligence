/* ============================================
   AI DOCUMENT INTELLIGENCE - MAIN APP.JS
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_FILE_TYPES: ['application/pdf'],
    N8N_WEBHOOK_URL: localStorage.getItem('n8nWebhookUrl') || 'https://your-n8n-instance.com/webhook/upload-pdf',
    GEMINI_API_KEY: localStorage.getItem('geminiApiKey') || 'your_gemini_api_key_here',
    QDRANT_URL: localStorage.getItem('qdrantUrl') || 'http://localhost:6333',
    CHUNK_SIZE: 1000,
    CHUNK_OVERLAP: 200,
    MAX_MESSAGES_DISPLAY: 100,
};

// ============================================
// STATE MANAGEMENT
// ============================================

const appState = {
    currentPdf: null,
    currentPdfName: null,
    currentPdfPages: 0,
    isProcessing: false,
    messages: [],
    chatHistory: JSON.parse(localStorage.getItem('chatHistory')) || [],
    currentChatId: null,
    isStreaming: false,
    lastResponse: null,
};

// ============================================
// DOM ELEMENTS
// ============================================

const dom = {
    // Navbar
    themeToggle: document.getElementById('themeToggle'),
    sunIcon: document.getElementById('sunIcon'),
    moonIcon: document.getElementById('moonIcon'),
    infoBtn: document.getElementById('infoBtn'),
    menuBtn: document.getElementById('menuBtn'),

    // Upload
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    uploadProgress: document.getElementById('uploadProgress'),
    uploadPercent: document.getElementById('uploadPercent'),
    uploadBar: document.getElementById('uploadBar'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    pageCount: document.getElementById('pageCount'),
    clearFileBtn: document.getElementById('clearFileBtn'),

    // Chat
    welcomeScreen: document.getElementById('welcomeScreen'),
    chatContainer: document.getElementById('chatContainer'),
    messagesArea: document.getElementById('messagesArea'),
    questionInput: document.getElementById('questionInput'),
    sendBtn: document.getElementById('sendBtn'),

    // Actions
    actionButtons: document.getElementById('actionButtons'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    exportBtn: document.getElementById('exportBtn'),
    newChatBtn: document.getElementById('newChatBtn'),

    // Chat History
    chatHistory: document.getElementById('chatHistory'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),

    // Modals
    infoModal: document.getElementById('infoModal'),
    errorToast: document.getElementById('errorToast'),
    errorMessage: document.getElementById('errorMessage'),
    errorDetail: document.getElementById('errorDetail'),
    successToast: document.getElementById('successToast'),
    successMessage: document.getElementById('successMessage'),
    loadingSpinner: document.getElementById('loadingSpinner'),
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    initializeTheme();
    updateChatHistory();
    console.log('✅ App initialized successfully');
});

// ============================================
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
    // Theme Toggle
    dom.themeToggle.addEventListener('click', toggleTheme);

    // Info Button
    dom.infoBtn.addEventListener('click', () => {
        dom.infoModal.classList.remove('hidden');
    });

    // Modal Close
    document.querySelectorAll('.closeModal').forEach(btn => {
        btn.addEventListener('click', () => {
            dom.infoModal.classList.add('hidden');
        });
    });

    // File Upload
    dom.dropZone.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput.addEventListener('change', handleFileSelect);
    dom.dropZone.addEventListener('dragover', handleDragOver);
    dom.dropZone.addEventListener('dragleave', handleDragLeave);
    dom.dropZone.addEventListener('drop', handleDrop);

    // Clear File
    dom.clearFileBtn.addEventListener('click', clearFile);

    // Chat Input
    dom.questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    dom.sendBtn.addEventListener('click', sendMessage);

    // Action Buttons
    dom.copyBtn.addEventListener('click', copyLastResponse);
    dom.downloadBtn.addEventListener('click', downloadChat);
    dom.exportBtn.addEventListener('click', exportChatAsPdf);
    dom.newChatBtn.addEventListener('click', startNewChat);

    // Chat History
    dom.clearHistoryBtn.addEventListener('click', clearChatHistory);

    // Close modals on background click
    dom.infoModal.addEventListener('click', (e) => {
        if (e.target === dom.infoModal) {
            dom.infoModal.classList.add('hidden');
        }
    });

    // Prevent body scroll when modal is open
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !dom.infoModal.classList.contains('hidden')) {
            dom.infoModal.classList.add('hidden');
        }
    });
}

// ============================================
// THEME MANAGEMENT
// ============================================

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcons();
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    if (isDark) {
        document.documentElement.classList.add('dark');
    }
    updateThemeIcons();
}

function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
        dom.sunIcon.classList.add('hidden');
        dom.moonIcon.classList.remove('hidden');
    } else {
        dom.sunIcon.classList.remove('hidden');
        dom.moonIcon.classList.add('hidden');
    }
}

// ============================================
// FILE HANDLING
// ============================================

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dom.dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dom.dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dom.dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect({ target: { files } });
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validation
    if (!CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
        showError('Invalid File Type', 'Please upload a valid PDF file');
        return;
    }

    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showError('File Too Large', `Maximum file size is ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
        return;
    }

    // Store file
    appState.currentPdf = file;
    appState.currentPdfName = file.name;

    // Show upload progress
    dom.uploadProgress.classList.remove('hidden');
    dom.fileInfo.classList.add('hidden');

    // Process PDF
    processPdf(file);
}

async function processPdf(file) {
    try {
        // Get page count
        const arrayBuffer = await file.arrayBuffer();
        
        // Simulate page count extraction (normally use PDF.js)
        const pageCount = Math.ceil(file.size / 10000); // Rough estimation
        appState.currentPdfPages = pageCount;

        // Simulate upload progress
        simulateProgress();

        // Send to n8n webhook
        await uploadToN8n(file, arrayBuffer);

        // Show success
        showFileInfo(file, pageCount);
        showSuccess('PDF Uploaded', 'Your document is ready for questions!');

        // Show chat interface
        showChatInterface();

    } catch (error) {
        console.error('Error processing PDF:', error);
        showError('Upload Failed', error.message);
        dom.uploadProgress.classList.add('hidden');
    }
}

function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        dom.uploadBar.style.width = progress + '%';
        dom.uploadPercent.textContent = Math.floor(progress) + '%';
    }, 200);
}

async function uploadToN8n(file, arrayBuffer) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('fileSize', file.size);

    const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    appState.currentPdfName = data.fileName || file.name;
    return data;
}

function showFileInfo(file, pageCount) {
    dom.uploadProgress.classList.add('hidden');
    dom.fileInfo.classList.remove('hidden');
    dom.fileName.textContent = file.name;
    dom.fileSize.textContent = formatFileSize(file.size);
    dom.pageCount.textContent = `${pageCount} pages`;
}

function clearFile() {
    appState.currentPdf = null;
    appState.currentPdfName = null;
    appState.currentPdfPages = 0;
    appState.messages = [];
    
    dom.fileInput.value = '';
    dom.uploadProgress.classList.add('hidden');
    dom.fileInfo.classList.add('hidden');
    dom.messagesArea.innerHTML = '';
    
    hideChatInterface();
    showSuccess('Cleared', 'Upload area cleared');
}

// ============================================
// CHAT INTERFACE
// ============================================

function showChatInterface() {
    dom.welcomeScreen.classList.add('hidden');
    dom.chatContainer.classList.remove('hidden');
    dom.actionButtons.classList.remove('hidden');
    dom.questionInput.focus();
}

function hideChatInterface() {
    dom.welcomeScreen.classList.remove('hidden');
    dom.chatContainer.classList.add('hidden');
    dom.actionButtons.classList.add('hidden');
}

async function sendMessage() {
    const question = dom.questionInput.value.trim();

    if (!question) {
        showError('Empty Question', 'Please ask a question');
        return;
    }

    if (!appState.currentPdf) {
        showError('No PDF Uploaded', 'Please upload a PDF first');
        return;
    }

    // Add user message
    addMessage(question, 'user');
    dom.questionInput.value = '';

    // Show loading
    showLoading();
    appState.isStreaming = true;

    try {
        // Get response from AI
        const response = await getAiResponse(question);
        appState.isStreaming = false;

        // Add AI message
        addMessage(response.answer, 'ai', response.sources);
        appState.lastResponse = response.answer;

        // Auto-save chat
        saveChatHistory();

    } catch (error) {
        console.error('Error getting response:', error);
        appState.isStreaming = false;
        showError('Error', error.message);
    }
}

async function getAiResponse(question) {
    try {
        // Step 1: Retrieve relevant chunks from Qdrant
        const relevantChunks = await retrieveFromVectorDb(question);

        // Step 2: Prepare context
        const context = relevantChunks.map(chunk => chunk.text).join('\n\n');

        // Step 3: Call Gemini API
        const response = await callGeminiApi(question, context);

        return {
            answer: response,
            sources: relevantChunks.map((chunk, i) => ({
                pageNumber: chunk.metadata?.page || i + 1,
                text: chunk.text.substring(0, 100) + '...'
            }))
        };
    } catch (error) {
        throw new Error('Failed to get AI response: ' + error.message);
    }
}

async function retrieveFromVectorDb(question) {
    try {
        // Create embedding for question
        const questionEmbedding = await getEmbedding(question);

        // Search in Qdrant
        const response = await fetch(`${CONFIG.QDRANT_URL}/collections/documents/points/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': localStorage.getItem('qdrantApiKey') || ''
            },
            body: JSON.stringify({
                vector: questionEmbedding,
                limit: 5,
                score_threshold: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('Vector search failed');
        }

        const data = await response.json();
        return data.result.map(item => ({
            text: item.payload.text,
            metadata: item.payload.metadata
        }));
    } catch (error) {
        console.error('Vector DB retrieval error:', error);
        return [];
    }
}

async function getEmbedding(text) {
    try {
        // Call Gemini API for embeddings
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': CONFIG.GEMINI_API_KEY
            },
            body: JSON.stringify({
                model: 'models/embedding-001',
                content: {
                    parts: [{ text: text }]
                }
            })
        });

        if (!response.ok) {
            throw new Error('Embedding failed');
        }

        const data = await response.json();
        return data.embedding.values;
    } catch (error) {
        console.error('Embedding error:', error);
        return Array(768).fill(0); // Fallback
    }
}

async function callGeminiApi(question, context) {
    try {
        const prompt = `You are a helpful document assistant. Based on the following context from a PDF document, answer the user's question accurately and concisely.

Context:
${context}

User Question: ${question}

Please provide a clear, direct answer. If the information is not in the context, say "I cannot find this information in the document."`;

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': CONFIG.GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            throw new Error('Gemini API error');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini API error:', error);
        throw error;
    }
}

function addMessage(text, sender, sources = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender} flex animate-fade-in-up`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = `message-bubble ${sender}`;
    
    // Add text
    const textP = document.createElement('p');
    textP.textContent = text;
    bubbleDiv.appendChild(textP);

    // Add sources if AI message
    if (sender === 'ai' && sources && sources.length > 0) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.className = 'source-reference mt-3 pt-3 border-t border-white/20';
        sourcesDiv.innerHTML = '<strong>Sources:</strong><ul class="mt-2 text-xs space-y-1">';
        
        sources.forEach(source => {
            sourcesDiv.innerHTML += `<li>📄 Page ${source.pageNumber}: ${source.text}</li>`;
        });
        
        sourcesDiv.innerHTML += '</ul>';
        bubbleDiv.appendChild(sourcesDiv);
    }

    messageDiv.appendChild(bubbleDiv);
    dom.messagesArea.appendChild(messageDiv);

    // Auto-scroll to bottom
    dom.messagesArea.scrollTop = dom.messagesArea.scrollHeight;

    // Add to state
    appState.messages.push({
        text,
        sender,
        timestamp: new Date(),
        sources
    });

    // Limit messages display
    if (appState.messages.length > CONFIG.MAX_MESSAGES_DISPLAY) {
        const messageDivs = dom.messagesArea.querySelectorAll('.message');
        if (messageDivs.length > CONFIG.MAX_MESSAGES_DISPLAY) {
            messageDivs[0].remove();
        }
    }
}

// ============================================
// CHAT ACTIONS
// ============================================

function copyLastResponse() {
    if (!appState.lastResponse) {
        showError('Nothing to Copy', 'No response to copy');
        return;
    }

    navigator.clipboard.writeText(appState.lastResponse).then(() => {
        showSuccess('Copied', 'Response copied to clipboard');
    }).catch(err => {
        showError('Copy Failed', err.message);
    });
}

function downloadChat() {
    if (appState.messages.length === 0) {
        showError('No Messages', 'Nothing to download');
        return;
    }

    const chatText = appState.messages
        .map(msg => `[${msg.sender.toUpperCase()}]: ${msg.text}`)
        .join('\n\n---\n\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(chatText));
    element.setAttribute('download', `chat-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    showSuccess('Downloaded', 'Chat saved as TXT file');
}

async function exportChatAsPdf() {
    if (appState.messages.length === 0) {
        showError('No Messages', 'Nothing to export');
        return;
    }

    // Simple PDF generation (in production, use a library like jsPDF)
    const chatJson = {
        fileName: appState.currentPdfName,
        messages: appState.messages,
        exportDate: new Date().toISOString()
    };

    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(chatJson, null, 2)));
    element.setAttribute('download', `chat-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    showSuccess('Exported', 'Chat exported as JSON');
}

function startNewChat() {
    if (appState.messages.length > 0) {
        saveChatHistory();
    }

    appState.messages = [];
    appState.currentChatId = null;
    appState.lastResponse = null;
    dom.messagesArea.innerHTML = '';
    dom.questionInput.value = '';
    dom.questionInput.focus();

    showSuccess('New Chat', 'Started a new conversation');
}

// ============================================
// CHAT HISTORY
// ============================================

function saveChatHistory() {
    if (appState.messages.length === 0) return;

    const chatEntry = {
        id: Date.now(),
        name: `Chat with ${appState.currentPdfName}`,
        messages: appState.messages,
        timestamp: new Date(),
        pageCount: appState.currentPdfPages
    };

    appState.chatHistory.unshift(chatEntry);
    appState.chatHistory = appState.chatHistory.slice(0, 50); // Keep last 50 chats

    localStorage.setItem('chatHistory', JSON.stringify(appState.chatHistory));
    updateChatHistory();
}

function updateChatHistory() {
    dom.chatHistory.innerHTML = '';

    if (appState.chatHistory.length === 0) {
        dom.chatHistory.innerHTML = '<div class="text-sm text-gray-400 text-center py-4">No chats yet</div>';
        return;
    }

    appState.chatHistory.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors animate-fade-in';
        chatItem.innerHTML = `
            <p class="text-sm font-semibold truncate">${chat.name}</p>
            <p class="text-xs text-gray-400 mt-1">${new Date(chat.timestamp).toLocaleDateString()}</p>
            <p class="text-xs text-gray-500 mt-1">${chat.messages.length} messages</p>
        `;
        
        chatItem.addEventListener('click', () => loadChat(chat.id));
        dom.chatHistory.appendChild(chatItem);
    });
}

function loadChat(chatId) {
    const chat = appState.chatHistory.find(c => c.id === chatId);
    if (!chat) return;

    appState.messages = chat.messages;
    appState.currentChatId = chat.id;
    appState.currentPdfName = chat.name;

    // Rebuild messages display
    dom.messagesArea.innerHTML = '';
    chat.messages.forEach(msg => {
        addMessage(msg.text, msg.sender, msg.sources);
    });

    showChatInterface();
    showSuccess('Loaded', `Loaded chat: ${chat.name}`);
}

function clearChatHistory() {
    if (confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
        appState.chatHistory = [];
        localStorage.removeItem('chatHistory');
        updateChatHistory();
        showSuccess('Cleared', 'Chat history deleted');
    }
}

// ============================================
// NOTIFICATIONS
// ============================================

function showError(title, message) {
    dom.errorMessage.textContent = title;
    dom.errorDetail.textContent = message;
    dom.errorToast.classList.remove('hidden');

    setTimeout(() => {
        dom.errorToast.classList.add('hidden');
    }, 5000);
}

function showSuccess(title, message) {
    dom.successMessage.textContent = `✓ ${title} - ${message}`;
    dom.successToast.classList.remove('hidden');

    setTimeout(() => {
        dom.successToast.classList.add('hidden');
    }, 3000);
}

function showLoading() {
    dom.loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    dom.loadingSpinner.classList.add('hidden');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// ERROR HANDLING
// ============================================

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showError('Error', 'Something went wrong. Check console for details.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
    showError('Error', 'An unexpected error occurred.');
});

// ============================================
// PERFORMANCE MONITORING
// ============================================

if ('PerformanceObserver' in window) {
    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                console.log(`⏱️ ${entry.name}: ${entry.duration.toFixed(2)}ms`);
            }
        });
        observer.observe({ entryTypes: ['measure'] });
    } catch (e) {
        console.log('Performance monitoring not available');
    }
}

console.log('🚀 AI Document Intelligence App Loaded Successfully');
