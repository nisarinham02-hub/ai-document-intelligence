# 🚀 AI Document Intelligence - Complete Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** 16+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://www.python.org/))
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))
- A text editor (VS Code, Sublime, etc.)

## Step 1: Clone the Repository

```bash
git clone https://github.com/nisarinham02-hub/ai-document-intelligence.git
cd ai-document-intelligence
```

## Step 2: Set Up Environment Variables

### Copy the example file:
```bash
cp .env.example .env
```

### Edit the `.env` file with your credentials:

#### 2.1 Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key and paste in `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 2.2 Configure Qdrant Vector Database

**Option A: Local Qdrant (Recommended for development)**

Will be started via Docker in the next step. Default config in `.env`:

```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
```

**Option B: Qdrant Cloud (Production)**

1. Sign up at [Qdrant Cloud](https://qdrant.tech/)
2. Create a cluster
3. Copy the URL and API key:

```env
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
```

#### 2.3 Configure n8n Webhook

**For local development:**
```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/upload-pdf
N8N_CHAT_WEBHOOK_URL=http://localhost:5678/webhook/chat-query
```

## Step 3: Start Services with Docker

### Option A: Use Docker Compose (Recommended)

```bash
docker-compose up -d
```

This will start:
- ✅ Qdrant Vector Database (port 6333)
- ✅ n8n Workflow Engine (port 5678)
- ✅ Redis Cache (port 6379) - optional

### Option B: Manual Setup

**Start Qdrant:**
```bash
docker run -p 6333:6333 qdrant/qdrant
```

**Start n8n:**
```bash
docker run -it -p 5678:5678 n8nio/n8n
```

## Step 4: Set Up n8n Workflow

1. Open n8n in browser: http://localhost:5678
2. Click "+" to create new workflow
3. Import the workflow:
   - Click "File" → "Import"
   - Select `n8n-workflow.json`
4. Edit the workflow nodes:
   - Add your **Gemini API Key**
   - Update **Qdrant URL** if needed
   - Set **WEBHOOK_RESPONSE_URL** to your frontend
5. Save and activate the workflow

## Step 5: Start the Frontend

### Option A: Using Python (Simple)

```bash
python -m http.server 8000
```

Then open: http://localhost:8000

### Option B: Using Node.js

```bash
npm install
npm run dev
```

Then open: http://localhost:8000

### Option C: Using Live Server (VS Code)

1. Install Live Server extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Step 6: Configure Frontend API Keys

### On first load, add your API keys:

1. Open developer console (F12)
2. Run:

```javascript
localStorage.setItem('geminiApiKey', 'your_gemini_api_key_here');
localStorage.setItem('qdrantUrl', 'http://localhost:6333');
localStorage.setItem('n8nWebhookUrl', 'http://localhost:5678/webhook/upload-pdf');
```

Or wait for the settings modal to appear on first load.

## Step 7: Test the Application

1. Upload a PDF document
2. Wait for processing (check n8n logs)
3. Ask a question about the document
4. Verify you get an AI response

## Troubleshooting

### Issue: "Cannot reach Qdrant"

**Solution:**
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Restart Qdrant
docker restart qdrant
```

### Issue: "Gemini API key invalid"

**Solution:**
1. Get a new key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Check key is properly set in `.env`
3. Reload the page

### Issue: "n8n webhook not responding"

**Solution:**
```bash
# Check n8n logs
docker logs n8n

# Verify webhook is active in n8n
# Go to http://localhost:5678 and check workflow status
```

### Issue: "PDF upload fails"

**Solution:**
1. Check file size (max 50MB)
2. Ensure PDF is valid
3. Check browser console for errors (F12)
4. Check n8n logs for workflow errors

## Development Tips

### Enable Debug Mode

In `.env`:
```env
DEBUG=true
LOG_LEVEL=debug
```

### Clear Cache

```bash
# Clear browser cache
# Ctrl + Shift + Delete (Chrome/Firefox)

# Clear local storage
localStorage.clear();
```

### View Logs

```bash
# n8n logs
docker logs -f n8n

# Qdrant logs
docker logs -f qdrant

# Browser console
F12 → Console tab
```

## Production Deployment

### Deploy to Vercel (Frontend)

1. Push to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Select your repository
5. Deploy

### Deploy Backend (n8n + Qdrant)

1. Use **n8n Cloud**: https://n8n.cloud/
2. Use **Qdrant Cloud**: https://qdrant.tech/
3. Update `.env` with production URLs

## Performance Optimization

### For faster responses:

```env
# Use reranking
USE_RERANKING=true

# Enable caching
ENABLE_CACHE=true
CACHE_DURATION=3600

# Adjust chunk size
CHUNK_SIZE=800  # Smaller = faster, less context
CHUNK_OVERLAP=100
```

## Security Best Practices

1. **Never commit `.env` file**
2. **Rotate API keys regularly**
3. **Use HTTPS in production**
4. **Enable CORS restrictions**:
   ```env
   CORS_ORIGINS=https://yourdomain.com
   ```
5. **Rate limiting enabled:**
   ```env
   ENABLE_RATE_LIMIT=true
   RATE_LIMIT_RPM=60
   ```

## Architecture Overview

```
┌─────────────────┐
│   Frontend      │ (HTML, CSS, JS)
│  (Browser)      │
└────────┬────────┘
         │ PDF Upload
         ▼
┌─────────────────┐
│    n8n WF       │ (Webhook, Processing)
│   (Localhost)   │
└────┬──────┬─────┘
     │      └──────────┐
     │                 │ Embeddings
     ▼                 ▼
┌─────────────┐   ┌──────────────┐
│  PDF Parse  │   │  Gemini API  │
│             │   │  (Embeddings)│
└─────────────┘   └──────────────┘
     │                 │
     └────────┬────────┘
              │ Store
              ▼
       ┌──────────────┐
       │   Qdrant     │ (Vector DB)
       │   (6333)     │
       └──────────────┘
              │
              │ Search
              ▼
       ┌──────────────┐
       │  RAG + Gen   │
       │ (Gemini API) │
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐
       │   Response   │
       │ (To Browser) │
       └──────────────┘
```

## Support & Resources

- 📖 [Google Gemini Docs](https://ai.google.dev/)
- 📖 [Qdrant Docs](https://qdrant.tech/documentation/)
- 📖 [n8n Docs](https://docs.n8n.io/)
- 🐛 [Report Issues](https://github.com/nisarinham02-hub/ai-document-intelligence/issues)
- 💬 [Discussions](https://github.com/nisarinham02-hub/ai-document-intelligence/discussions)

## FAQ

**Q: Can I use OpenAI instead of Gemini?**
A: Yes! The code is modular. Replace Gemini API calls with OpenAI endpoints.

**Q: What's the cost?
A: Gemini API is free tier. Qdrant & n8n have free tiers too.

**Q: Can I deploy to production?
A: Yes! See "Production Deployment" section above.

**Q: How many PDFs can I upload?
A: Unlimited, limited by storage and API quotas.

---

**Made with ❤️ by Nisar**
