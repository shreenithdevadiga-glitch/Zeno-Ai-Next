# ZENO AI NEXT — Environment Variable Reference

All configuration variables are loaded via standard `.env` files or container environment variables.

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `3000` | Port on which the HTTP/SSE server listens. |
| `NODE_ENV` | Optional | `development` | Set to `production` for secure cookie enforcement and production assets. |
| `DATABASE_URL` | Optional | `""` | Database connection string. If omitted, uses embedded high-speed SQLite in WAL mode at `data/zeno_next.db`. |
| `OPENROUTER_API_KEY` | Optional | `""` | OpenRouter API Key for 100+ frontier and open-weight models. |
| `GEMINI_API_KEY` | Optional | `""` | Google Gemini API Key for Gemini 2.5 Flash and Pro. |
| `NVIDIA_API_KEY` | Optional | `""` | NVIDIA NIM API Key for fast accelerated inference. |
| `OPENAI_API_KEY` | Optional | `""` | OpenAI API Key or bearer token for custom endpoints. |
| `OPENAI_BASE_URL` | Optional | `https://api.openai.com/v1` | Custom endpoint for Ollama, vLLM, or LM Studio. |
| `TAVILY_API_KEY` | Optional | `""` | Tavily API Key for live web research and source extraction. |
| `SEARCH_API_KEY` | Optional | `""` | Secondary search provider fallback key. |
| `IMAGE_API_KEY` | Optional | `""` | Dedicated DALL-E or Flux key. |

> [!NOTE]
> All external AI providers and search services degrade gracefully when keys are omitted. Local document indexing, personal memory, project workspaces, and voice processing operate out of the box with zero external dependencies.
