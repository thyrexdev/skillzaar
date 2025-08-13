# Chat Media Testing Guide

This guide will help you test the media functionality in the chat service, including file uploads, downloads, and attachment management.

## Prerequisites

1. **Media Service (Cloudflare Worker) Setup**
2. **Chat Service (WebSocket) Running**
3. **Database with Users** 
4. **Authentication Tokens**

---

## 1. Media Service Setup

### Step 1: Configure Wrangler for Local Development

First, make sure you have the necessary environment variables. Create a `.dev.vars` file in the media-service directory:

```bash
# Navigate to media service
cd server/media-service

# Create environment variables file
touch .dev.vars
```

Add these variables to `.dev.vars`:
```env
AUTH_SERVICE_URL=http://localhost:5000
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

### Step 2: Start Media Service Locally

```bash
# In media-service directory
npm run dev
# or
bun run dev
```

This will start the Cloudflare Worker locally, typically on `http://localhost:8787`

---

## 2. Chat Service Setup

### Step 1: Create Test Users First

Before testing chat media, you need users in the database. Use the Auth Service to create test users:

**Register User 1:**
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Test",
    "email": "alice@test.com",
    "password": "Password123",
    "role": "CLIENT"
  }'
```

**Register User 2:**
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Test",
    "email": "bob@test.com",
    "password": "Password123",
    "role": "FREELANCER"
  }'
```

Save the user IDs and tokens from the responses.

### Step 2: Start Chat Service

```bash
cd server/chat-service
bun run dev
```

---

## 3. Testing Media in Chat

### Test 1: Upload Chat Attachment

**Upload a file as chat attachment:**

```bash
curl -X POST http://localhost:8787/api/chat/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@/path/to/your/test-file.jpg" \
  -F "chatId=test-chat-123" \
  -F "messageId=test-message-456"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "1 files uploaded successfully",
  "files": [
    {
      "id": "attachment_123",
      "fileName": "chat_file_123.jpg",
      "originalName": "test-file.jpg",
      "fileSize": 1024000,
      "fileType": "image/jpeg",
      "url": "/api/chat/files/attachment_123",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Test 2: Send Message with Attachment via WebSocket

**Connect to WebSocket:**
```javascript
const ws = new WebSocket('ws://localhost:5002', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

// Send message with attachment reference
ws.send(JSON.stringify({
  type: "chat",
  recipientId: "USER_2_ID",
  message: "Check out this file!",
  attachments: ["attachment_123"]
}));
```

### Test 3: Download Chat Attachment

**Get the uploaded file:**
```bash
curl -X GET http://localhost:8787/api/chat/files/attachment_123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o downloaded-file.jpg
```

### Test 4: List Chat Attachments

**Get all attachments for a chat:**
```bash
curl -X GET "http://localhost:8787/api/chat/test-chat-123/attachments?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "attachments": [
    {
      "id": "attachment_123",
      "user_id": "user_456",
      "message_id": "msg_789",
      "original_name": "test-file.jpg",
      "file_type": "image/jpeg",
      "file_size": 1024000,
      "url": "/api/chat/files/attachment_123",
      "uploaded_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### Test 5: Get Attachment Info

**Get metadata about an attachment:**
```bash
curl -X GET http://localhost:8787/api/chat/attachments/attachment_123/info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 6: Delete Chat Attachment

**Delete an attachment:**
```bash
curl -X DELETE http://localhost:8787/api/chat/attachments/attachment_123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 4. Frontend Testing with HTML/JavaScript

Create a test HTML file to test the complete flow:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Chat Media Test</title>
</head>
<body>
    <h1>Chat Media Testing</h1>
    
    <!-- File Upload Form -->
    <form id="uploadForm">
        <input type="file" id="fileInput" multiple>
        <input type="text" id="chatId" placeholder="Chat ID" value="test-chat-123">
        <input type="text" id="messageId" placeholder="Message ID (optional)">
        <button type="submit">Upload Files</button>
    </form>
    
    <!-- WebSocket Connection -->
    <div>
        <input type="text" id="messageInput" placeholder="Type a message">
        <input type="text" id="recipientId" placeholder="Recipient ID">
        <button id="sendMessage">Send Message</button>
    </div>
    
    <!-- Connection Status -->
    <div id="status">Disconnected</div>
    <div id="messages"></div>

    <script>
        const token = 'YOUR_JWT_TOKEN'; // Replace with actual token
        let ws;
        
        // WebSocket Connection
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:5002', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            ws.onopen = () => {
                document.getElementById('status').textContent = 'Connected';
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                const messagesDiv = document.getElementById('messages');
                messagesDiv.innerHTML += `<div>Received: ${JSON.stringify(data)}</div>`;
            };
            
            ws.onclose = () => {
                document.getElementById('status').textContent = 'Disconnected';
            };
        }
        
        // File Upload
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            const files = document.getElementById('fileInput').files;
            const chatId = document.getElementById('chatId').value;
            const messageId = document.getElementById('messageId').value;
            
            for (let file of files) {
                formData.append('files', file);
            }
            formData.append('chatId', chatId);
            if (messageId) formData.append('messageId', messageId);
            
            try {
                const response = await fetch('http://localhost:8787/api/chat/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                const result = await response.json();
                console.log('Upload result:', result);
                alert(`Upload ${result.success ? 'successful' : 'failed'}: ${result.message}`);
            } catch (error) {
                console.error('Upload error:', error);
                alert('Upload failed');
            }
        });
        
        // Send Message
        document.getElementById('sendMessage').addEventListener('click', () => {
            const message = document.getElementById('messageInput').value;
            const recipientId = document.getElementById('recipientId').value;
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'chat',
                    recipientId: recipientId,
                    message: message
                }));
                document.getElementById('messageInput').value = '';
            } else {
                alert('WebSocket not connected');
            }
        });
        
        // Connect on page load
        connectWebSocket();
    </script>
</body>
</html>
```

---

## 5. Testing with Postman/Insomnia

### Collection Setup

1. **Base URL**: `http://localhost:8787`
2. **Authorization**: Bearer Token (use JWT from auth service)

### Test Cases

1. **Upload Chat Attachment**
   - Method: POST
   - URL: `/api/chat/upload`
   - Body: form-data
     - files: [file]
     - chatId: "test-chat-123"
     - messageId: "test-message-456"

2. **Get Chat Attachments**
   - Method: GET
   - URL: `/api/chat/test-chat-123/attachments`
   - Query Params: page=1, limit=20

3. **Download Attachment**
   - Method: GET
   - URL: `/api/chat/files/{attachmentId}`

4. **Get Attachment Info**
   - Method: GET
   - URL: `/api/chat/attachments/{attachmentId}/info`

5. **Delete Attachment**
   - Method: DELETE
   - URL: `/api/chat/attachments/{attachmentId}`

---

## 6. Troubleshooting

### Common Issues:

1. **CORS Issues**
   - Make sure the media service allows requests from your frontend origin
   - Check the CORS configuration in the media service

2. **Authentication Errors**
   - Verify JWT token is valid and not expired
   - Make sure the auth service URL is correct in media service config

3. **File Upload Errors**
   - Check file size limits (defined in the upload config)
   - Verify file types are allowed
   - Ensure proper form-data encoding

4. **WebSocket Connection Issues**
   - Verify users exist in database
   - Check JWT token in WebSocket headers
   - Ensure chat service is running

### Debugging Commands:

```bash
# Check media service logs
wrangler tail --env development

# Check chat service logs
# (logs appear in the terminal where you ran bun run dev)

# Test WebSocket connection
wscat -c ws://localhost:5002 -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test file upload with curl (verbose)
curl -v -X POST http://localhost:8787/api/chat/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@test-file.jpg" \
  -F "chatId=test-chat-123"
```

---

## 7. Expected File Flow

1. **Upload**: File uploaded to media service → Stored in R2 bucket → Metadata in database
2. **Message**: WebSocket message sent with attachment reference → Saved in database
3. **Retrieval**: Frontend requests file → Media service serves from R2 → File downloaded
4. **Management**: List, info, and delete operations through media service API

---

## 8. Production Considerations

- **Environment Variables**: Set up proper production environment variables
- **R2 Bucket**: Configure actual R2 bucket for file storage
- **Authentication**: Implement proper JWT verification
- **Rate Limiting**: Add rate limiting for file uploads
- **File Scanning**: Consider virus scanning for uploaded files
- **CDN**: Use Cloudflare CDN for better file delivery performance

This guide should help you test all aspects of media functionality in your chat service!
