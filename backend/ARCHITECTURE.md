# Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                      │
│                         (REST API Call)                                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SPRING BOOT APPLICATION                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        Controller Layer                             │ │
│  │  ┌──────────────────────┐    ┌──────────────────────┐              │ │
│  │  │  ContractController  │    │    RiskController    │              │ │
│  │  │  POST /api/contracts │    │  GET /api/risks/{id} │              │ │
│  │  │  GET  /contracts/    │    │                      │              │ │
│  │  │       {id}/risks     │    │                      │              │ │
│  │  └──────────┬───────────┘    └──────────┬───────────┘              │ │
│  └─────────────┼───────────────────────────┼──────────────────────────┘ │
│                │                           │                             │
│  ┌─────────────▼───────────────────────────▼──────────────────────────┐ │
│  │                        Service Layer                                │ │
│  │  ┌──────────────────────┐    ┌──────────────────────┐              │ │
│  │  │   ContractService    │    │     RiskService      │              │ │
│  │  │  - uploadAndAnalyze  │    │  - findByContractId  │              │ │
│  │  │  - extractText       │    │  - findById          │              │ │
│  │  │  - analyzeContract   │    │                      │              │ │
│  │  └──────────┬───────────┘    └──────────────────────┘              │ │
│  └─────────────┼──────────────────────────────────────────────────────┘ │
│                │                                                         │
│  ┌─────────────▼──────────────────────────────────────────────────────┐ │
│  │                        Common Layer                                 │ │
│  │  ┌──────────────────────┐    ┌──────────────────────┐              │ │
│  │  │     OpenAiClient     │    │     TextChunker      │              │ │
│  │  │  - createEmbedding   │    │  - chunk(text)       │              │ │
│  │  │  - analyzeRisk       │    │                      │              │ │
│  │  └──────────┬───────────┘    └──────────────────────┘              │ │
│  └─────────────┼──────────────────────────────────────────────────────┘ │
│                │                                                         │
│  ┌─────────────▼──────────────────────────────────────────────────────┐ │
│  │                      Repository Layer                               │ │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────┐  │ │
│  │  │ ContractRepo   │ │   RiskRepo     │ │   RegulationRepo       │  │ │
│  │  │                │ │                │ │  - findSimilar()       │  │ │
│  │  │                │ │                │ │    (pgvector cosine)   │  │ │
│  │  └───────┬────────┘ └───────┬────────┘ └───────────┬────────────┘  │ │
│  └──────────┼──────────────────┼──────────────────────┼───────────────┘ │
└─────────────┼──────────────────┼──────────────────────┼─────────────────┘
              │                  │                      │
              ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL + pgvector                               │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────────┐   │
│  │    contract    │ │      risk      │ │        regulation          │   │
│  │ - id           │ │ - id           │ │ - id                       │   │
│  │ - filename     │ │ - contract_id  │ │ - name                     │   │
│  │ - content      │ │ - clause       │ │ - description              │   │
│  │ - created_at   │ │ - level        │ │ - embedding (vector 1536)  │   │
│  │                │ │ - reason       │ │                            │   │
│  └────────────────┘ └────────────────┘ └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Flow: Contract Risk Detection

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Upload  │────▶│ Text Extract │────▶│   Chunk     │────▶│  Embedding   │
│  (PDF/   │     │  (PDFBox)    │     │ (500 chars) │     │  (OpenAI)    │
│   TXT)   │     │              │     │             │     │              │
└──────────┘     └──────────────┘     └─────────────┘     └──────┬───────┘
                                                                  │
                                                                  ▼
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Store   │◀────│ GPT-4o       │◀────│  Match      │◀────│  pgvector    │
│  Risk    │     │ Risk Analyze │     │ Regulations │     │  Similarity  │
│          │     │              │     │             │     │  Search      │
└──────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

## Package Structure

```
com.earlywarning/
│
├── EarlyWarningApplication.java      # Spring Boot Entry
│
├── contract/                         # 계약서 도메인
│   ├── Contract.java                 # Entity
│   ├── ContractRepository.java       # JPA Repository
│   ├── ContractService.java          # 업로드 + 분석 로직
│   └── ContractController.java       # REST API
│
├── risk/                             # 리스크 도메인
│   ├── Risk.java                     # Entity (level: HIGH/MEDIUM/LOW)
│   ├── RiskRepository.java           # JPA Repository
│   ├── RiskService.java              # 조회 로직
│   └── RiskController.java           # REST API
│
├── regulation/                       # 규정 도메인
│   ├── Regulation.java               # Entity (with vector embedding)
│   ├── RegulationRepository.java     # pgvector 유사도 검색
│   └── RegulationInitializer.java    # 앱 시작 시 규정 로드
│
└── common/                           # 공통 유틸
    ├── OpenAiClient.java             # OpenAI API 호출
    └── TextChunker.java              # 텍스트 청크 분할
```

## API Endpoints

| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/api/contracts` | `multipart/form-data` (file) | `{id, filename, message}` |
| GET | `/api/contracts/{id}/risks` | - | `[{id, clause, level}]` |
| GET | `/api/risks/{id}` | - | `{id, clause, level, reason}` |

## Data Flow Example

### 1. Upload Contract
```http
POST /api/contracts
Content-Type: multipart/form-data

file=@service-agreement.pdf
```

### 2. Get Risk List (for UI: red = HIGH)
```http
GET /api/contracts/1/risks

Response:
[
  {"id": 1, "clause": "collect all available data...", "level": "HIGH"},
  {"id": 2, "clause": "irrevocable consent...", "level": "HIGH"},
  {"id": 3, "clause": "sub-processors located...", "level": "MEDIUM"}
]
```

### 3. Click Risk → Get Detail
```http
GET /api/risks/1

Response:
{
  "id": 1,
  "clause": "collect all available data from User's devices...",
  "level": "HIGH",
  "reason": "GDPR Article 5 – data minimization violation possible"
}
```

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Spring Boot 3.2 | REST API, DI |
| ORM | Spring Data JPA | Database access |
| Database | PostgreSQL 16 | Data persistence |
| Vector Search | pgvector | Similarity search |
| AI - Embedding | text-embedding-3-small | Text → Vector |
| AI - Analysis | GPT-4o | Risk classification |
| PDF Parsing | Apache PDFBox 3.0 | PDF → Text |
| HTTP Client | OkHttp | OpenAI API calls |

## Configuration

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/earlywarning

# OpenAI
openai.api-key=${OPENAI_API_KEY}
openai.embedding-model=text-embedding-3-small
openai.chat-model=gpt-4o

# Risk Detection
risk.similarity-threshold=0.75    # cosine similarity threshold
risk.chunk-size=500               # characters per chunk
```

## Vector Search (pgvector)

```sql
-- 유사도 검색 쿼리 (cosine distance)
SELECT * FROM regulation
WHERE embedding <=> CAST(:embedding AS vector) < 0.75
ORDER BY embedding <=> CAST(:embedding AS vector)
LIMIT 3;
```

- `<=>` : cosine distance operator
- threshold 0.75 = 75% 이상 유사도
- 상위 3개 규정 매칭

## Sequence Diagram

```
Client          Controller       Service          OpenAI         Database
  │                 │               │                │               │
  │ POST /contracts │               │                │               │
  │────────────────▶│               │                │               │
  │                 │ uploadAndAnalyze              │               │
  │                 │──────────────▶│                │               │
  │                 │               │ extractText    │               │
  │                 │               │───────┐        │               │
  │                 │               │◀──────┘        │               │
  │                 │               │                │               │
  │                 │               │ chunk(text)    │               │
  │                 │               │───────┐        │               │
  │                 │               │◀──────┘        │               │
  │                 │               │                │               │
  │                 │               │ for each chunk:│               │
  │                 │               │ createEmbedding│               │
  │                 │               │───────────────▶│               │
  │                 │               │◀───────────────│               │
  │                 │               │                │               │
  │                 │               │ findSimilar    │               │
  │                 │               │───────────────────────────────▶│
  │                 │               │◀───────────────────────────────│
  │                 │               │                │               │
  │                 │               │ analyzeRisk    │               │
  │                 │               │───────────────▶│               │
  │                 │               │◀───────────────│               │
  │                 │               │                │               │
  │                 │               │ save(risk)     │               │
  │                 │               │───────────────────────────────▶│
  │                 │               │◀───────────────────────────────│
  │                 │◀──────────────│                │               │
  │◀────────────────│               │                │               │
  │  {id, filename} │               │                │               │
```