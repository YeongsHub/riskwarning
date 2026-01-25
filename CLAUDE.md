# EarlyWarning - Contract Risk Detection System

## Project Overview
계약서에서 법적 리스크를 자동 탐지하는 AI 기반 시스템.
업로드된 계약서를 분석하여 HIGH RISK 조항을 식별하고, 관련 규정 위반 가능성을 표시.

## Tech Stack
| Layer | Technology |
|-------|------------|
| Backend | Spring Boot 3.x, Java 21 |
| API | Spring Web (REST) |
| Database | PostgreSQL + pgvector |
| ORM | Spring Data JPA |
| AI | OpenAI API (text-embedding-3-small, gpt-4o) |
| Build | Gradle (Kotlin DSL) |

## Core Feature Flow
```
[계약서 업로드] → [텍스트 추출] → [청크 분할] → [임베딩 생성]
                                                    ↓
[HIGH RISK 표시] ← [리스크 분류] ← [규정 DB 유사도 검색]
        ↓
   [클릭 시]
        ↓
"GDPR Article 5 – data minimization violation possible"
```

## Project Structure
```
src/main/java/com/earlywarning/
├── EarlyWarningApplication.java
├── contract/
│   ├── ContractController.java      # POST /api/contracts
│   ├── ContractService.java         # 업로드 + 분석 로직
│   ├── Contract.java                # Entity
│   └── ContractRepository.java
├── risk/
│   ├── RiskController.java          # GET /api/risks/{contractId}
│   ├── RiskService.java             # 리스크 판정 로직
│   ├── Risk.java                    # Entity (clause, level, reason)
│   └── RiskRepository.java
├── regulation/
│   ├── Regulation.java              # Entity (GDPR, CCPA 등 규정)
│   └── RegulationRepository.java    # pgvector 유사도 검색
└── common/
    ├── OpenAiClient.java            # 임베딩 + 분류 호출
    └── TextChunker.java             # 계약서 청크 분할
```

## Database Schema
```sql
-- 계약서
CREATE TABLE contract (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 탐지된 리스크
CREATE TABLE risk (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT REFERENCES contract(id),
    clause TEXT,                      -- 위험 조항 원문
    level VARCHAR(20),                -- HIGH, MEDIUM, LOW
    reason TEXT,                      -- "GDPR Article 5 – data minimization..."
    embedding VECTOR(1536)
);

-- 규정 DB (사전 로드)
CREATE TABLE regulation (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100),                -- "GDPR Article 5"
    description TEXT,
    embedding VECTOR(1536)
);
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contracts` | 계약서 업로드 (multipart/form-data) |
| GET | `/api/contracts/{id}/risks` | 리스크 목록 조회 |
| GET | `/api/risks/{id}` | 리스크 상세 (reason 포함) |

## Environment Variables
```properties
# application.yml
spring.datasource.url=jdbc:postgresql://localhost:5432/earlywarning
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}

openai.api-key=${OPENAI_API_KEY}
openai.embedding-model=text-embedding-3-small
openai.chat-model=gpt-4o
```

## Key Commands
```bash
# 실행
./gradlew bootRun

# 테스트
./gradlew test

# Docker (PostgreSQL + pgvector)
docker run -d --name pgvector \
  -e POSTGRES_DB=earlywarning \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# pgvector 확장 활성화
psql -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

## Risk Detection Logic
1. 계약서 텍스트를 500자 단위로 청크 분할
2. 각 청크를 OpenAI 임베딩으로 변환
3. regulation 테이블과 코사인 유사도 검색 (threshold: 0.75)
4. 매칭된 규정 기반으로 GPT-4o가 리스크 레벨 판정
5. HIGH RISK 조항은 빨간색으로 표시

## Minimum Viable Scope
- [x] 계약서 업로드 (PDF/TXT)
- [x] 리스크 탐지 및 분류
- [x] HIGH RISK 클릭 시 규정 위반 사유 표시
- [ ] 인증/인가 (Phase 2)
- [ ] 다국어 지원 (Phase 2)