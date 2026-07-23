# 🤖 AI Document Intelligence - ChatPDF Clone

A powerful AI-powered document intelligence web application that allows users to upload PDFs and ask unlimited questions using Google Gemini API with RAG (Retrieval-Augmented Generation) architecture.

## ✨ Features

✅ **Drag & Drop PDF Upload** - Easy file upload with visual feedback
✅ **AI-Powered Q&A** - Ask unlimited questions about your documents
✅ **RAG Architecture** - Intelligent document chunking and retrieval
✅ **Streaming Responses** - Real-time AI responses with streaming
✅ **Chat History** - Persistent conversation history
✅ **Source References** - Shows which page the answer came from
✅ **Dark Mode** - Modern dark theme with glassmorphism
✅ **Mobile Responsive** - Works perfectly on all devices
✅ **Copy & Download** - Copy responses or download entire chat
✅ **Error Handling** - Robust error management
✅ **Modern UI** - Glassmorphism design with Tailwind CSS
✅ **Loading Animations** - Smooth loading states

## 🏗️ Architecture

```
Frontend (HTML5 + Tailwind CSS + Vanilla JS)
    ↓
n8n Webhook
    ↓
PDF Processing & Chunking
    ↓
Vector Embeddings (Google Gemini)
    ↓
Qdrant Vector Database
    ↓
RAG + Google Gemini API
    ↓
Response Back to Frontend
```

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **Tailwind CSS** - Modern styling with glassmorphism
- **Vanilla JavaScript** - No frameworks, pure JS
- **Responsive Design** - Mobile-first approach

### Backend
- **n8n** - Workflow automation
- **Webhooks** - Real-time communication
- **PDF.js** - PDF processing

### AI & Data
- **Google Gemini API** - LLM for AI responses
- **Qdrant** - Vector database for embeddings
- **RAG** - Retrieval-Augmented Generation

## 📦 Project Structure

```
ai-document-intelligence/
├── index.html              # Main HTML file
├── style.css               # Tailwind CSS styling
├── app.js                  # Frontend logic
├── n8n-workflow.json       # n8n workflow configuration
├── .env.example            # Environment variables example
└── README.md               # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (for n8n)
- Google Gemini API Key
- Qdrant vector database (local or cloud)
- n8n instance (local or self-hosted)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/nisarinham02-hub/ai-document-intelligence.git
cd ai-document-intelligence
```

2. **Set up environment variables**
```bash
cp .env.example .env
```

3. **Update .env with your credentials**
```env
GEMINI_API_KEY=your_gemini_api_key_here
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_key_here
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

4. **Start Qdrant (using Docker)**
```bash
docker run -p 6333:6333 qdrant/qdrant
```

5. **Set up n8n workflow**
- Import `n8n-workflow.json` to your n8n instance
- Configure webhook URL to point to your n8n instance

6. **Open index.html in browser**
- Use a local server: `python -m http.server 8000`
- Visit: `http://localhost:8000`

## 📖 How It Works

1. **User uploads PDF** → Frontend processes file
2. **PDF sent to n8n** → Webhook triggers workflow
3. **PDF Extraction** → Extract text and chunk document
4. **Embeddings** → Create vector embeddings using Gemini
5. **Store in Qdrant** → Save vectors in database
6. **User asks question** → Frontend sends query
7. **RAG Retrieval** → Find relevant chunks from Qdrant
8. **AI Response** → Gemini generates answer
9. **Stream response** → Real-time response to user
10. **Store chat** → Save conversation history

## 🔑 API Keys Required

1. **Google Gemini API Key**
   - Get from: https://makersuite.google.com/app/apikey
   - Free tier available

2. **Qdrant Vector Database**
   - Self-hosted: docker run -p 6333:6333 qdrant/qdrant
   - Or use Qdrant Cloud: https://qdrant.tech/

3. **n8n Instance**
   - Self-hosted: https://docs.n8n.io/hosting/
   - Or use n8n Cloud: https://n8n.cloud/

## 🎨 UI Features

### Glassmorphism Design
- Modern backdrop blur effects
- Semi-transparent cards
- Smooth transitions
- Beautiful gradients

### Dark Mode
- Eye-friendly dark theme
- High contrast for readability
- Smooth theme transitions

### Responsive Layout
- Mobile-first design
- Tablet optimized
- Desktop full experience
- Touch-friendly buttons

## 💬 Chat Features

- **Real-time streaming** - See responses as they're generated
- **Source references** - Know which page info came from
- **Copy button** - Copy responses to clipboard
- **Download chat** - Export conversation as JSON/PDF
- **Chat history** - Load previous conversations
- **Auto-scroll** - Auto-scroll to latest message
- **Typing indicator** - Show when AI is thinking

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Security

- API keys stored in .env (never in code)
- CORS configured properly
- Input validation on all forms
- XSS protection
- CSRF tokens for state modifications

## 🐛 Troubleshooting

### PDF not uploading?
- Check file size (max 50MB recommended)
- Ensure PDF is valid/not corrupted
- Check browser console for errors

### No responses from AI?
- Verify Gemini API key is valid
- Check Qdrant connection
- Ensure PDF was processed successfully
- Check n8n workflow logs

### Slow responses?
- Check internet connection
- Verify Gemini API quota
- Ensure Qdrant has sufficient resources
- Check n8n workflow performance

## 📚 Documentation

- [Google Gemini Docs](https://ai.google.dev/)
- [Qdrant Docs](https://qdrant.tech/documentation/)
- [n8n Docs](https://docs.n8n.io/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

## 🤝 Contributing

Feel free to fork, modify, and improve this project!

## 📄 License

MIT License - Free to use for personal and commercial projects

## 👨‍💻 Author

Created with ❤️ by Nisar

## 🎯 Roadmap

- [ ] Support for other document formats (DOCX, TXT, etc.)
- [ ] Multi-language support
- [ ] Advanced search capabilities
- [ ] Document summarization
- [ ] Export to PDF
- [ ] Voice input support
- [ ] Collaborative features
- [ ] Advanced analytics

---

**Made with ❤️ for AI Enthusiasts** 🚀
