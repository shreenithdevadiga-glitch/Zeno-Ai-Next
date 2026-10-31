# ZENO AI NEXT — Architecture Specification

## 1. System Architecture Overview

ZENO AI NEXT is designed around a decoupled, modular full-stack architecture prioritizing low latency, resilient failover, and high security.

```mermaid
flowchart TD
    User([User Browser]) <--> |HTTP / SSE Streaming| WebServer[Express Server]
    
    subgraph Core Server
        WebServer --> Security[Security Layer\nCSP, Rate Limiter, SSRF Guard]
        Security --> Auth[Auth & Session Service]
        Security --> Router[Intelligent Model Router]
        Security --> Research[Deep Research Service]
        Security --> Files[File & RAG Engine]
        Security --> Image[Generative Image Service]
        Security --> Voice[Voice Session Service]
    end

    subgraph Data Layer
        Auth & Router & Files & Research --> DB[(SQLite WAL / PostgreSQL)]
        Files --> FileStore[Disk File Storage]
        Image --> ImageStore[Disk Image Storage]
    end

    subgraph AI Gateway
        Router --> |Primary| OR[OpenRouter API]
        Router --> |Cascade 1| GEM[Google Gemini API]
        Router --> |Cascade 2| NVD[NVIDIA NIM API]
        Router --> |Cascade 3| OAI[OpenAI / Ollama Local]
        Router --> |Offline| SafeFallback[ZENO Safe Core Fallback]
        Research --> Tavily[Tavily Search API / DDG Fallback]
    end
```

---

## 2. Intelligent Routing & Failover Pipeline

The Intelligent Router inspects user intent, capability requirements (such as code synthesis, mathematical reasoning, vision, or multi-step tools), and evaluates candidate availability:

```mermaid
flowchart LR
    Prompt[User Prompt] --> Detect[Detect Requirements:\nCoding, Vision, Reasoning]
    Detect --> Route[Check Model Tier:\nAUTO, FAST, SMART, etc.]
    Route --> Primary{Primary Provider\nAvailable?}
    Primary -- Yes --> Exec[Stream Response]
    Primary -- No / Error --> Fallback1{Cascade Provider B\nAvailable?}
    Fallback1 -- Yes --> Exec
    Fallback1 -- No / Error --> Fallback2{Cascade Provider C\nAvailable?}
    Fallback2 -- Yes --> Exec
    Fallback2 -- No / Error --> Graceful[Safe ZENO Core Response\nExplains Config Needed]
```

---

## 3. Deep Research Multi-Agent Pipeline

```mermaid
sequenceDiagram
    participant User
    participant Studio as Research Studio
    participant Planner as Research Planner
    participant Crawler as Web Search Crawler
    participant Synthesis as Evidence Synthesizer
    
    User->>Studio: Submit research topic + depth + breadth
    Studio->>Planner: Formulate research vectors & sub-queries
    Planner->>Crawler: Parallel search across queries
    Crawler-->>Synthesis: Harvest primary sources & snippets
    Synthesis->>Synthesis: Score credibility & extract evidence
    Synthesis->>Synthesis: Draft whitepaper with citations
    Synthesis-->>User: Stream completed markdown report
```

---

## 4. Database Schema Design

The relational database is architected for strict referential integrity and performance:

1. **`users` & `user_profiles`**: Authentication credentials (salted PBKDF2), role-based permissions (`admin`, `user`), and user styling configuration.
2. **`sessions`**: SHA-256 hashed session tokens with sliding TTL expiration.
3. **`conversations` & `messages`**: Multi-turn conversation sessions with model attribution, mode markers, attachments, and feedback.
4. **`message_citations`**: Structured sources with URL, snippet, and credibility index.
5. **`projects`**: Isolated workspaces providing distinct system instructions, theme colors, and attached file boundaries.
6. **`files` & `file_chunks`**: Document metadata, extracted raw text, and 600-character chunk embeddings for contextual retrieval.
7. **`research_jobs` & `research_sources`**: Deep research dossiers, multi-step execution plans, and bibliographies.
8. **`memories`**: Long-term user directives and preferences categorized into preferences, facts, and technical habits.
9. **`audit_logs` & `usage_records`**: Security monitoring and resource consumption tracking.
