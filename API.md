# ZENO AI NEXT — API Endpoint Specification

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
- **Body:** `{ "name": "...", "email": "...", "password": "..." }`
- **Returns:** `{ "token": "...", "user": { ... } }`

### `POST /api/auth/login`
- **Body:** `{ "email": "...", "password": "..." }`
- **Returns:** `{ "token": "...", "user": { ... } }`

### `POST /api/auth/logout`
- Invalidate active session and clear cookies.

### `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Returns:** Authenticated user and profile settings.

### `PUT /api/auth/profile`
- Update display name, bio, default model, theme, or RGB configuration.

---

## 2. Conversations & Real-Time Chat (`/api/chat`)

### `GET /api/chat/conversations`
- List user conversations with optional `?projectId=...` filter.

### `POST /api/chat/conversations`
- **Body:** `{ "title": "...", "model": "auto", "mode": "chat", "projectId": null }`

### `GET /api/chat/conversations/:id`
- Retrieve full conversation object with messages, attachments, and citations.

### `POST /api/chat/conversations/:id/stream` (SSE)
- **Headers:** `Accept: text/event-stream`
- **Body:**
  ```json
  {
    "content": "Explain vector similarity algorithms",
    "model": "auto",
    "mode": "chat",
    "attachments": [],
    "webSearch": true
  }
  ```
- **Stream Events:**
  - `user_message`: Persisted user message.
  - `status`: Step progress (e.g., `Searching web...`, `Reading files...`).
  - `token`: Delta chunk `{ "delta": "..." }`.
  - `citations`: Verified citations array.
  - `done`: Final persisted assistant message object.

### `GET /api/chat/conversations/:id/export`
- **Query:** `?format=markdown|json|txt`
- Returns formatted downloadable file.

### `POST /api/chat/conversations/:id/share`
- Generates a cryptographically random public share token.

### `GET /api/chat/share/:token`
- Public read-only endpoint returning shared conversation data.

---

## 3. Models & Health (`/api/models`)

### `GET /api/models`
- Lists curated and auto-discovered models across categories: `auto`, `fast`, `smart`, `reasoning`, `coding`, `vision`, `creative`, `free`.

### `GET /api/models/health`
- Tests live connection to configured providers (OpenRouter, Gemini, NVIDIA, OpenAI).

---

## 4. Deep Research Studio (`/api/research`)

### `POST /api/research/search`
- Quick live web search with citations.
- **Body:** `{ "query": "...", "maxResults": 5 }`

### `POST /api/research/deep`
- Multi-vector deep research job.
- **Body:** `{ "query": "...", "depth": 2, "breadth": 4 }`
- **Returns:** `{ "job": { "id": "...", "status": "completed", "sources": [...], "report": "..." } }`

---

## 5. File Intelligence (`/api/files`)

### `POST /api/files/upload`
- Multipart form data (`file`) with auto text extraction, chunking, and indexing.

### `POST /api/files/search`
- Search indexed chunks across all user documents.
- **Body:** `{ "query": "database isolation levels", "limit": 5 }`

---

## 6. Generative Image Studio (`/api/images`)

### `POST /api/images/generate`
- **Body:** `{ "prompt": "...", "style": "vivid", "aspectRatio": "16:9" }`
- **Returns:** Image record with local served URL `/api/images/file/:filename`.

---

## 7. Personal Memory (`/api/memory`)

- `GET /api/memory`: List active user memories.
- `POST /api/memory`: Add a persistent preference or directive.
- `PATCH /api/memory/:id`: Toggle active status or edit content.
- `DELETE /api/memory/:id`: Delete a specific memory item.
- `DELETE /api/memory`: Wipe all memories.

---

## 8. Projects (`/api/projects`)

- `GET /api/projects`: List workspace projects.
- `POST /api/projects`: Create project with isolated system instructions and color.
- `GET /api/projects/:id`: Get project along with associated chats and files.
- `DELETE /api/projects/:id`: Archive project.
