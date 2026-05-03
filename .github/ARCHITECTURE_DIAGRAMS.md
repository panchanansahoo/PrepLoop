# PrepLoop Architecture Diagrams

This document contains visual representations of PrepLoop's architecture, data flows, and system interactions.

## System Overview

```mermaid
graph TB
    User["👤 User<br/>Browser"]
    Vercel["📦 Vercel<br/>Frontend<br/>React + Vite"]
    CDN["🌐 CDN<br/>Static Assets"]
    
    Backend["🖥️ Backend<br/>Express.js<br/>Cloud Platform"]
    Health["💚 Health Check<br/>/health"]
    
    Supabase["🗄️ Supabase<br/>PostgreSQL +<br/>Auth"]
    Redis["⚡ Redis Cache<br/>Upstash"]
    
    Groq["🤖 Groq API<br/>AI Models<br/>Whisper/Chat"]
    TTS["🔊 TTS Providers<br/>Kokoro/Edge/Groq"]
    
    Jobs["🏢 Job APIs<br/>RapidAPI<br/>Adzuna<br/>Naukri"]
    Payment["💳 Razorpay<br/>Payment<br/>Gateway"]
    
    User -->|Loads| Vercel
    User -->|Fetches assets| CDN
    Vercel -->|API calls| Backend
    Vercel -->|Auth| Supabase
    
    Backend -->|Health check| Health
    Backend -->|Query/Insert| Supabase
    Backend -->|Cache| Redis
    Backend -->|AI Inference| Groq
    Backend -->|Synthesis| TTS
    Backend -->|Job Search| Jobs
    Backend -->|Process Payment| Payment
```

## Interview Suite Flow

```mermaid
graph LR
    Start["🚀 Start Interview"] --> Intake["📋 Intake & Setup"]
    Intake -->|Gather Context| Context["📊 Build Context<br/>- Profile<br/>- Weakness Areas<br/>- Difficulty"]
    
    Context --> Warmup["🔥 Warmup Round"]
    Warmup --> Technical["💻 Technical Round<br/>DSA/System Design"]
    Technical --> FollowUp["🔍 Follow-up Probing"]
    FollowUp --> Challenge["⚡ Challenge Round<br/>Edge Cases"]
    Challenge --> Feedback["📈 Feedback & Wrap-up"]
    
    Feedback --> Score["🎯 Scoring<br/>- Response Quality<br/>- Communication<br/>- Problem-Solving"]
    Score --> Plan["📋 Improvement Plan<br/>Generated"]
    Plan --> End["✅ Complete"]
    
    Technical -->|Real-time| AI["🤖 Groq AI<br/>- Generate Questions<br/>- Analyze Responses<br/>- Score Answers"]
    Technical -->|Voice| Voice["🔊 Voice I/O<br/>- TTS (Kokoro)<br/>- STT (Whisper)<br/>- Realtime Sync"]
    
    AI --> Technical
    Voice --> Technical
```

## Data Flow: Interview Session

```mermaid
graph TD
    User1["👤 User Starts<br/>Interview"]
    
    subgraph Frontend["Frontend (React)"]
        UI["Interview UI<br/>Display Question"]
        Record["🎤 Record<br/>User Response"]
        Display["Display Real-time<br/>Feedback"]
    end
    
    subgraph Backend["Backend (Express)"]
        Recv["Receive<br/>Response"]
        Cache["Cache in<br/>Redis"]
        AI["Score via<br/>Groq AI"]
        Gen["Generate<br/>Follow-up"]
        Telemetry["📊 Track<br/>Telemetry"]
    end
    
    subgraph Database["Supabase"]
        Interview["interviews<br/>Table"]
        History["conversation<br/>history"]
        Feedback["feedback<br/>Table"]
    end
    
    WebSocket["🔌 WebSocket<br/>Real-time<br/>Channel"]
    
    User1 --> UI
    UI --> Record
    Record -->|Send to| Backend
    
    Recv -->|Parallel| Cache
    Recv -->|Parallel| AI
    
    AI --> Gen
    Gen -->|Broadcast| WebSocket
    WebSocket -->|Display| Display
    
    Cache -->|Store Session| Database
    AI -->|Store Score| Feedback
    Gen -->|Store Conversation| History
    
    Feedback -->|Send| Display
    
    Telemetry -->|Track| Database
```

## Voice Provider Chain (Fallback)

```mermaid
graph LR
    TTS["🎤 Need TTS"]
    
    Kokoro{"Check<br/>Kokoro<br/>Available?"}
    KokoroTry["Try Kokoro<br/>Local Model"]
    KokoroFail["❌ Init Failed<br/>5min Cooldown"]
    KokoroOK["✅ Success"]
    
    Groq{"Groq Key<br/>Set?"}
    GroqTry["Try Groq<br/>Orpheus"]
    GroqOK["✅ Success"]
    
    Edge["Edge TTS<br/>Always Available"]
    EdgeOK["✅ Success"]
    
    Browser["Browser<br/>Web Speech API<br/>Fallback"]
    
    TTS --> Kokoro
    Kokoro -->|Yes| KokoroTry
    Kokoro -->|No| Groq
    
    KokoroTry -->|Success| KokoroOK
    KokoroTry -->|Fail| KokoroFail
    KokoroFail --> Groq
    
    Groq -->|Yes| GroqTry
    Groq -->|No| Edge
    
    GroqTry -->|Success| GroqOK
    GroqTry -->|Fail| Edge
    
    Edge -->|Success| EdgeOK
    Edge -->|Fail| Browser
    
    KokoroOK --> Return["Return Audio"]
    GroqOK --> Return
    EdgeOK --> Return
    Browser --> Return
```

## Authentication Flow

```mermaid
graph LR
    User["👤 User"]
    
    subgraph Auth["Supabase Auth"]
        Login["Login Email/Password"]
        JWT["Generate JWT<br/>+ Refresh Token"]
    end
    
    subgraph Frontend["Frontend"]
        Store["Store Tokens<br/>localStorage"]
        Include["Include JWT in<br/>Authorization Header"]
    end
    
    subgraph Backend["Backend"]
        Verify["Verify JWT<br/>Signature"]
        Attach["Attach user<br/>to req.user"]
        Authorize["Check user<br/>has access"]
    end
    
    DB["Supabase<br/>User Record"]
    
    User -->|Email/Pass| Login
    Login -->|Verify| DB
    DB -->|Valid| JWT
    
    JWT -->|Receive| Store
    Store -->|Next API call| Include
    Include -->|HTTP Header| Verify
    
    Verify -->|Valid| Attach
    Attach -->|Continue| Authorize
    Authorize -->|Yes| Return["✅ Process Request"]
    Authorize -->|No| Deny["❌ 403 Forbidden"]
```

## Coin & Payment System

```mermaid
graph TD
    User["👤 User"]
    
    subgraph Earn["Earn Coins"]
        Problem["Solve Problem"]
        Bonus["Earn Bonus<br/>Challenge Streak"]
        Interview["Complete<br/>Interview"]
    end
    
    subgraph Transaction["Transaction"]
        Record["Record Coin<br/>Transaction<br/>type: earn"]
        Update["Update Balance<br/>in user_coins"]
    end
    
    subgraph Spend["Spend Coins"]
        Shop["Visit Shop"]
        Redeem["Select<br/>Redemption"]
        Validate["Validate<br/>Enough Coins?"]
    end
    
    subgraph Fulfillment["Fulfillment"]
        CreateTxn["Create spend<br/>transaction"]
        Deduct["Deduct Balance"]
        Grant["Grant Benefit<br/>ai_tutor_pass<br/>interview_boost"]
    end
    
    User -->|Complete| Earn
    Earn -->|Accumulate| Record
    Record -->|Update| Update
    Update -->|Balance| User
    
    User -->|Redeem| Shop
    Shop --> Redeem
    Redeem --> Validate
    Validate -->|Yes| Fulfillment
    Validate -->|No| Deny["❌ Insufficient<br/>Coins"]
    
    Fulfillment -->|Atomic| CreateTxn
    CreateTxn -->|And| Deduct
    Deduct -->|And| Grant
    Grant -->|Benefit Active| User
```

## Payment Processing (Razorpay)

```mermaid
graph LR
    User["👤 User"]
    
    subgraph Frontend["Frontend"]
        Checkout["🛒 Checkout Page"]
        RZP["Razorpay<br/>Modal"]
        Pay["Enter Card<br/>Details"]
    end
    
    subgraph Razorpay["Razorpay"]
        Process["Process<br/>Payment"]
        Authorize["Authorize<br/>Transaction"]
        Webhook["POST to<br/>Webhook"]
    end
    
    subgraph Backend["Backend /api/payment"]
        Validate["Validate<br/>Signature"]
        Fulfill["Fulfill Order<br/>Add Coins/Credits"]
        Store["Store Order<br/>in Database"]
    end
    
    DB["Supabase<br/>Transactions"]
    Email["📧 Email<br/>Confirmation"]
    
    User -->|Open| Checkout
    Checkout -->|Modal| RZP
    RZP -->|Enter| Pay
    Pay -->|Submit| Razorpay
    
    Process -->|3D Secure| Authorize
    Authorize -->|Success| Webhook
    Authorize -->|Fail| Deny["❌ Payment Failed"]
    
    Webhook -->|POST| Validate
    Validate -->|Valid Signature| Fulfill
    Fulfill -->|And| Store
    Store -->|And| Email
    Email -->|Confirmation| User
```

## Middleware Execution Order

```mermaid
graph TD
    Request["🔄 Incoming Request"]
    
    Helmet["🛡️ Helmet<br/>Security Headers"]
    CORS["🌐 CORS<br/>Origin Check"]
    ReqID["🔑 Request ID<br/>Tracing"]
    Proxy["📍 Proxy Validation<br/>X-Forwarded-For Check"]
    RateLimit["⏱️ Rate Limiter<br/>Check Quota"]
    Compression["📦 Compression<br/>Gzip Response"]
    
    JSONParse["📄 JSON Parser<br/>Body Parsing"]
    Sanitize["🧹 Sanitization<br/>Remove XSS"]
    Auth["🔐 Authentication<br/>Verify JWT"]
    
    RouteHandler["🎯 Route Handler<br/>Process Request"]
    Response["✅ Send Response"]
    
    Request -->|First| Helmet
    Helmet --> CORS
    CORS --> ReqID
    ReqID -->|CRITICAL| Proxy
    Proxy -->|BEFORE RateLimit| RateLimit
    RateLimit --> Compression
    
    Compression --> JSONParse
    JSONParse --> Sanitize
    Sanitize -->|Excludes /webhook| Auth
    Auth --> RouteHandler
    
    RouteHandler -->|Success| Response
    RouteHandler -->|Error| ErrorHandler["❌ Error Handler<br/>Format Error"]
    ErrorHandler --> Response
    
    style Proxy fill:#ff9999
    style RateLimit fill:#99ccff
    style Auth fill:#99ff99
```

## Real-Time WebSocket Architecture

```mermaid
graph TB
    Client1["💻 Client 1<br/>Chrome"]
    Client2["💻 Client 2<br/>Safari"]
    Client3["💻 Client 3<br/>Firefox"]
    
    subgraph WSServer["WebSocket Server<br/>PORT 5000"]
        Verify["🔐 Verify JWT<br/>on connect"]
        ClientMap["clients Map<br/>clientId → ws"]
        RoomMap["rooms Map<br/>roomId → [clients]"]
    end
    
    subgraph Message["Message Handling"]
        JoinRoom["Join Room"]
        Broadcast["Broadcast<br/>to Room"]
        Leave["Leave Room"]
    end
    
    Client1 -->|ws://...?token=JWT| Verify
    Client2 -->|ws://...?token=JWT| Verify
    Client3 -->|ws://...?token=JWT| Verify
    
    Verify -->|Success| ClientMap
    ClientMap -->|Store| RoomMap
    
    Client1 -->|{type: join_room}| JoinRoom
    JoinRoom -->|Subscribe| RoomMap
    
    Client1 -->|Send message| Broadcast
    Broadcast -->|To all in room| Client2
    Broadcast -->|To all in room| Client3
    
    Client2 -->|Disconnect| Leave
    Leave -->|Cleanup| RoomMap
```

## Database Schema (Interview Focus)

```mermaid
erDiagram
    USERS ||--o{ INTERVIEWS : creates
    USERS ||--o{ INTERVIEW_CONVERSATIONS : has
    USERS ||--o{ INTERVIEW_FEEDBACK : generates
    USERS ||--o{ USER_COINS : owns
    
    INTERVIEWS ||--o{ INTERVIEW_ROUNDS : contains
    INTERVIEWS ||--o{ INTERVIEW_CONVERSATIONS : has
    INTERVIEWS ||--o{ INTERVIEW_FEEDBACK : generates
    
    INTERVIEW_ROUNDS ||--o{ INTERVIEW_QUESTIONS : asks
    INTERVIEW_QUESTIONS ||--o{ INTERVIEW_RESPONSES : answered_by
    
    INTERVIEW_CONVERSATIONS ||--o{ INTERVIEW_RESPONSES : logs
    
    USERS {
        uuid id PK
        string email UK
        string full_name
        int skill_level
        timestamp created_at
    }
    
    INTERVIEWS {
        uuid id PK
        uuid user_id FK
        string type "technical, behavioral, hr, system_design"
        int total_questions
        int total_turns
        int final_score
        string status "in_progress, completed"
        timestamp created_at
    }
    
    INTERVIEW_ROUNDS {
        uuid id PK
        uuid interview_id FK
        int round_number
        string topic
        int score
        timestamp completed_at
    }
    
    INTERVIEW_CONVERSATIONS {
        uuid id PK
        uuid interview_id FK
        uuid user_id FK
        string role "interviewer, candidate"
        string message
        timestamp created_at
    }
    
    INTERVIEW_FEEDBACK {
        uuid id PK
        uuid interview_id FK
        uuid user_id FK
        text strengths
        text weaknesses
        text improvement_areas
        timestamp generated_at
    }
    
    USER_COINS {
        uuid user_id PK FK
        int balance
        timestamp updated_at
    }
```

---

**Use these diagrams to understand system architecture, data flows, and component interactions.**

For detailed documentation, see `.github/copilot-instructions.md` and `docs/ARCHITECTURE.md`.
