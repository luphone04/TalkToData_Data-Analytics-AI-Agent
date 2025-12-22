# Data Analysis Agent - SaaS Implementation Plan

> **Project Purpose**: Transform the CLI data analysis agent into a full-featured SaaS web application with user authentication, file storage, and a modern chat interface.

> **Location**: `/Users/richard/Desktop/llm-app`

> **Base**: Building on existing agent code from Phase 1-7 (CLI version complete)

---

## Architecture Overview

```
llm-app/
├── backend/                 # FastAPI backend
│   ├── main.py              # FastAPI app entry
│   ├── api/
│   │   ├── routes/          # API endpoints
│   │   └── deps.py          # Dependencies (auth, db)
│   ├── core/
│   │   ├── config.py        # Settings & env vars
│   │   └── security.py      # Auth helpers
│   ├── services/
│   │   └── agent_service.py # Adapted agent logic
│   └── requirements.txt     # Backend dependencies
│
├── frontend/                # Next.js frontend
│   ├── app/                 # App router pages
│   │   ├── page.tsx         # Landing page
│   │   ├── login/           # Auth pages
│   │   ├── dashboard/       # Main app
│   │   └── api/             # API routes (proxy)
│   ├── components/          # React components
│   │   ├── Chat/            # Chat interface
│   │   ├── FileUpload/      # File upload
│   │   └── Charts/          # Chart display
│   ├── lib/                 # Utilities
│   │   └── supabase.ts      # Supabase client
│   └── package.json
│
├── tools/                   # (existing) Agent tools
├── agent.py                 # (existing) Agent definition
├── data/                    # (existing) Sample data
└── output/                  # (existing) Generated charts
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 (App Router) | React framework with SSR |
| UI | Tailwind CSS + shadcn/ui | Styling & components |
| Backend | FastAPI | Python API server |
| Auth | Supabase Auth | User management |
| Database | Supabase (PostgreSQL) | Store conversations, metadata |
| Storage | Supabase Storage | User files & generated charts |
| Real-time | WebSocket | Streaming agent responses |
| Deployment | Vercel + Railway | Frontend + Backend hosting |

---

## Phase 1: Backend API Setup
**Goal**: Create FastAPI backend that wraps the existing agent

### Tasks

- [x] **1.1** Create backend directory structure
  ```
  backend/
  ├── main.py
  ├── api/
  │   ├── __init__.py
  │   └── routes/
  │       ├── __init__.py
  │       ├── agent.py       # /api/chat endpoint
  │       ├── files.py       # /api/files endpoints
  │       └── health.py      # /api/health
  ├── core/
  │   ├── __init__.py
  │   └── config.py          # Settings from env
  ├── services/
  │   ├── __init__.py
  │   └── agent_service.py   # Wrap existing agent
  └── requirements.txt
  ```

- [x] **1.2** Create `backend/requirements.txt`
  ```
  fastapi>=0.109.0
  uvicorn>=0.27.0
  python-multipart>=0.0.6
  openai-agents>=0.0.7
  pandas>=2.0.0
  matplotlib>=3.7.0
  openpyxl>=3.1.0
  python-dotenv>=1.0.0
  supabase>=2.3.0
  pydantic-settings>=2.1.0
  ```

- [x] **1.3** Create `backend/core/config.py`
  - Load environment variables
  - Settings class with Pydantic
  - OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY

- [x] **1.4** Create `backend/services/agent_service.py`
  - Import existing agent from parent directory
  - Wrap Runner.run() in async function
  - Handle file operations per-user (isolated storage)
  - Return structured responses (text, chart_paths, data_previews)

- [x] **1.5** Create `backend/api/routes/agent.py`
  - POST `/api/chat` - Send message, get response
  - Request: `{ message: string, conversation_id: string }`
  - Response: `{ response: string, charts: string[], data: object }`

- [x] **1.6** Create `backend/api/routes/files.py`
  - POST `/api/files/upload` - Upload CSV/Excel
  - GET `/api/files` - List user's files
  - DELETE `/api/files/{filename}` - Delete file

- [x] **1.7** Create `backend/main.py`
  - FastAPI app with CORS
  - Include all routers
  - Lifespan for startup/shutdown

- [x] **1.8** Test backend locally
  ```bash
  cd backend
  uvicorn main:app --reload --port 8000
  ```

### Verification
- [x] `GET /api/health` returns `{"status": "ok"}`
- [x] `POST /api/chat` returns response (needs OPENAI_API_KEY in .env)
- [x] `GET /api/files` lists user files

---

## Phase 2: Supabase Setup
**Goal**: Configure Supabase for auth, database, and storage

### Tasks

- [x] **2.1** Create Supabase project
  - Project: `talktodata` (vgwjlxlcmxtavamalwtv)
  - URL: https://vgwjlxlcmxtavamalwtv.supabase.co

- [x] **2.2** Create database tables
  ```sql
  -- Users profile (extends auth.users)
  CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Conversations
  CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Messages
  CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- User files metadata
  CREATE TABLE user_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Generated charts
  CREATE TABLE charts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    title TEXT,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

- [x] **2.3** Set up Row Level Security (RLS)
  ```sql
  -- Enable RLS
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;
  ALTER TABLE charts ENABLE ROW LEVEL SECURITY;

  -- Profiles: users can only see/edit their own
  CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

  CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

  -- Conversations: users can only access their own
  CREATE POLICY "Users can CRUD own conversations"
    ON conversations FOR ALL
    USING (auth.uid() = user_id);

  -- Messages: users can access messages in their conversations
  CREATE POLICY "Users can CRUD messages in own conversations"
    ON messages FOR ALL
    USING (
      conversation_id IN (
        SELECT id FROM conversations WHERE user_id = auth.uid()
      )
    );

  -- User files: users can only access their own
  CREATE POLICY "Users can CRUD own files"
    ON user_files FOR ALL
    USING (auth.uid() = user_id);

  -- Charts: users can only access their own
  CREATE POLICY "Users can CRUD own charts"
    ON charts FOR ALL
    USING (auth.uid() = user_id);
  ```

- [x] **2.4** Create storage buckets
  - `user-files` - For uploaded CSV/Excel files (private)
  - `charts` - For generated chart images (public)
  - Storage RLS policies configured

- [x] **2.5** Create `.env` file with Supabase credentials
  ```
  OPENAI_API_KEY=sk-...
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_KEY=eyJ...
  ```

- [x] **2.6** Create trigger for auto-creating profile
  ```sql
  -- Function to create profile on signup
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Trigger on auth.users
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

### Verification
- [x] All 5 tables created with RLS enabled
- [x] Storage buckets created (user-files, charts)
- [x] Profile trigger configured
- [x] Credentials saved to .env

---

## Phase 3: Frontend Setup
**Goal**: Create Next.js frontend with basic structure

### Tasks

- [x] **3.1** Initialize Next.js project
  ```bash
  cd /Users/richard/Desktop/llm-app
  npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
  ```

- [x] **3.2** Install dependencies
  ```bash
  cd frontend
  npm install @supabase/supabase-js @supabase/ssr
  npm install lucide-react
  npx shadcn@latest init
  npx shadcn@latest add button input card avatar scroll-area
  ```

- [x] **3.3** Create `frontend/lib/supabase/client.ts`
  - Browser Supabase client
  - For client components

- [x] **3.4** Create `frontend/lib/supabase/server.ts`
  - Server Supabase client
  - For server components and API routes

- [x] **3.5** Create `frontend/lib/supabase/middleware.ts`
  - Auth middleware helper
  - Refresh session on request

- [x] **3.6** Create `frontend/middleware.ts`
  - Protect routes requiring auth
  - Redirect unauthenticated users to login

- [x] **3.7** Set up environment variables
  ```
  # frontend/.env.local
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```

- [x] **3.8** Create basic page structure
  ```
  frontend/app/
  ├── page.tsx              # Landing page
  ├── layout.tsx            # Root layout
  ├── globals.css           # Global styles
  ├── (auth)/
  │   ├── login/page.tsx    # Login page
  │   └── signup/page.tsx   # Signup page
  └── (protected)/
      ├── layout.tsx        # Protected layout (auth check)
      └── dashboard/
          └── page.tsx      # Main dashboard
  ```

### Verification
- [x] `npm run build` compiles successfully
- [x] Landing page with hero section
- [x] Login & Signup pages with forms
- [x] Dashboard page (protected)

---

## Phase 4: Authentication Flow
**Goal**: Implement user signup, login, logout

### Tasks

- [x] **4.1** Create `frontend/components/Auth/LoginForm.tsx`
  - Email/password login
  - Error handling
  - Redirect to dashboard on success
  - (Embedded in login page)

- [x] **4.2** Create `frontend/components/Auth/SignupForm.tsx`
  - Email/password signup
  - Confirm password field
  - Redirect to login on success
  - (Embedded in signup page)

- [x] **4.3** Create `frontend/app/(auth)/login/page.tsx`
  - Login page layout
  - Link to signup
  - OAuth buttons (optional: Google, GitHub)

- [x] **4.4** Create `frontend/app/(auth)/signup/page.tsx`
  - Signup page layout
  - Link to login

- [x] **4.5** Create `frontend/components/Auth/UserMenu.tsx`
  - Show user email/avatar
  - Logout button
  - Uses client-side signout

- [x] **4.6** Update middleware for auth protection
  - `/dashboard/*` requires auth
  - Redirect to `/login` if not authenticated
  - Redirect to `/dashboard` if authenticated and on `/login`

- [x] **4.7** Create auth context/hook
  - `useUser()` hook for accessing user
  - `useSupabase()` hook for Supabase client

### Verification
- [x] Can sign up new user
- [x] Can log in with existing user
- [x] Can log out
- [x] Protected routes redirect properly
- [x] User menu shows current user

---

## Phase 5: File Upload & Storage
**Goal**: Allow users to upload and manage data files

### Tasks

- [x] **5.1** Create `frontend/components/FileUpload/FileUploader.tsx`
  - Drag-and-drop zone
  - File type validation (CSV, XLSX)
  - Upload progress indicator
  - Max file size check (10MB)

- [x] **5.2** Create `frontend/components/FileUpload/FileList.tsx`
  - List user's uploaded files
  - File name, size, upload date
  - Delete button with confirmation dialog

- [x] **5.3** Create `frontend/app/api/files/route.ts`
  - GET: List files from Supabase
  - POST: Upload file to Supabase Storage
  - Also store metadata in user_files table

- [x] **5.4** Create `frontend/app/api/files/[id]/route.ts`
  - DELETE: Remove file from storage and database
  - GET: Generate signed download URL

- [ ] **5.5** Update backend to read from Supabase Storage
  - Modify `agent_service.py` to download files from Supabase
  - Use user-specific paths: `{user_id}/{filename}`
  - (Deferred to Phase 6 - requires chat integration)

- [ ] **5.6** Create file selection in chat
  - Show available files in chat interface
  - "Use this file" button to reference in conversation
  - (Deferred to Phase 6 - requires chat interface)

### Verification
- [x] Can upload CSV file
- [x] Can upload Excel file
- [x] File appears in file list
- [x] Can delete file
- [x] Files are user-isolated

---

## Phase 6: Chat Interface
**Goal**: Build the main chat UI for interacting with the agent

### Tasks

- [x] **6.1** Create `frontend/components/Chat/ChatContainer.tsx`
  - Main chat wrapper
  - Conversation selector sidebar
  - Chat area with file selection

- [x] **6.2** Create `frontend/components/Chat/MessageList.tsx`
  - Scroll area for messages
  - Auto-scroll to bottom
  - Loading skeleton and typing indicator

- [x] **6.3** Create `frontend/components/Chat/MessageBubble.tsx`
  - User message (right aligned)
  - Assistant message (left aligned)
  - Timestamps on messages
  - (Markdown rendering deferred - npm issue)

- [x] **6.4** Create `frontend/components/Chat/ChatInput.tsx`
  - Text input with send button
  - Enter to send, Shift+Enter for newline
  - Disable while loading

- [x] **6.5** Create `frontend/components/Chat/ConversationList.tsx`
  - List of user's conversations
  - New conversation button
  - Delete conversation option
  - Active conversation highlight

- [x] **6.6** Create `frontend/app/api/chat/route.ts`
  - POST: Proxy to backend /api/chat
  - Include user authentication
  - Pass file info to backend

- [x] **6.7** Create conversation management hooks
  - `useConversations()` - List, create, delete conversations
  - `useMessages(conversationId)` - Get/add messages
  - Messages stored in Supabase

- [x] **6.8** Wire up dashboard page
  - Integrate all chat components
  - Mobile tabs / desktop side-by-side layout
  - File selection indicator

### Verification
- [x] Can create new conversation
- [x] Can send message and receive response
- [x] Messages persist in database
- [x] Can switch between conversations
- [ ] Charts display inline (Phase 7)

---

## Phase 7: Chart Display & Downloads
**Goal**: Display generated charts and allow downloads

### Tasks

- [x] **7.1** Create `frontend/components/Charts/ChartDisplay.tsx`
  - Display chart image from Supabase Storage
  - Lightbox for full-size view
  - Download button

- [x] **7.2** Create `frontend/components/Charts/ChartGallery.tsx`
  - Grid view of all charts in conversation
  - Thumbnail previews

- [x] **7.3** Update backend to upload charts to Supabase
  - After generating chart, upload to Storage
  - Return public URL in response
  - Charts bucket created with public access

- [x] **7.4** Update MessageBubble to render charts
  - Parse chart URLs from agent response
  - Display ChartDisplay component
  - Charts stored in message metadata

- [x] **7.5** Chart download functionality
  - Client-side download via fetch + blob
  - Built into ChartDisplay component

### Verification
- [x] Charts display in chat
- [x] Can view full-size chart
- [x] Can download chart as PNG
- [x] Charts persist across sessions

---

## Phase 8: Dashboard Polish
**Goal**: Improve UX with loading states, errors, and polish

### Tasks

- [x] **8.1** Add loading states
  - Skeleton loaders for conversations (already in MessageList)
  - Typing indicator for agent (already in MessageList)
  - Upload progress bar (already in FileUploader)

- [x] **8.2** Add error handling
  - Toast notifications for errors (sonner)
  - Success toasts for actions
  - Graceful degradation

- [x] **8.3** Create landing page
  - Hero section with badge and CTAs
  - Feature highlights with icons
  - How it works section
  - Benefits section
  - CTA section with gradient

- [x] **8.4** Add responsive design
  - Mobile-friendly chat (already responsive)
  - Collapsible sidebar (already implemented)
  - Touch-friendly buttons

- [x] **8.5** Add keyboard shortcuts
  - `Ctrl+K` / `Cmd+K` - New conversation
  - Enter to send message (already in ChatInput)
  - Escape closes modals (Dialog component)

- [x] **8.6** Add dark mode support
  - System preference detection (next-themes)
  - Manual toggle (ThemeToggle component)
  - Preference persisted in localStorage

### Verification
- [x] No layout shift during loading
- [x] Errors shown gracefully
- [x] Landing page looks professional
- [x] Works on mobile devices

---

## Phase 9: Deployment
**Goal**: Deploy to production

### Tasks

- [x] **9.1** Prepare backend for deployment
  - Created `Dockerfile` (in project root to include agent.py and tools/)
  - Created `railway.json` and `render.yaml`
  - Environment variables configured via platform settings

- [x] **9.2** Deploy backend to Render
  - Connected GitHub repo
  - Set environment variables
  - Production URL: `https://talktodata-api.onrender.com`

- [x] **9.3** Prepare frontend for deployment
  - API URL set to production backend
  - Env vars configured in Vercel

- [x] **9.4** Deploy frontend to Vercel
  - Connected GitHub repo
  - Set environment variables
  - URL: `https://data-scope-ai-agent-mfbt58vgx-lu-phone-maws-projects.vercel.app`

- [x] **9.5** Update Supabase settings
  - Added production URL to Site URL and Redirect URLs
  - CORS configured on Render backend

- [x] **9.6** Test production deployment
  - Full signup → login → upload → chat → chart flow
  - Fixed agent to recognize pre-loaded datasets from Supabase Storage

### Verification
- [x] Backend API accessible at production URL
- [x] Frontend accessible at Vercel URL
- [x] Auth flow works in production
- [x] File upload works in production
- [x] Agent analyzes uploaded files correctly

---

## Phase 10: Usage Tracking & Limits
**Goal**: Track usage for future monetization

### Tasks

- [x] **10.1** Create usage tracking table
  - Created `usage` table with user_id, action, tokens_used, metadata
  - Added RLS policies for user access and service role insert
  - Created helper function `get_daily_usage_count`

- [x] **10.2** Track API calls
  - Created `UsageService` in backend
  - Log each chat message with metadata
  - Track file uploads

- [x] **10.3** Create usage display
  - Created `UsageCard` component
  - Shows daily message/upload counts with progress bars
  - Color-coded warnings (green/yellow/red)

- [x] **10.4** Implement usage limits (soft limits)
  - Free tier: 50 messages/day, 10 uploads/day
  - Check limits before processing requests
  - Graceful error message when limit reached

### Verification
- [x] Usage tracked in database
- [x] Usage displayed to user
- [x] Limits enforced (soft block with message)

---

## Implementation Order

```
Phase 1 (Backend API)
    ↓
Phase 2 (Supabase) ──────────┐
    ↓                        │
Phase 3 (Frontend Setup) ────┤
    ↓                        │
Phase 4 (Auth) ──────────────┤
    ↓                        │
Phase 5 (File Upload) ───────┤
    ↓                        │
Phase 6 (Chat Interface) ────┘
    ↓
Phase 7 (Charts)
    ↓
Phase 8 (Polish)
    ↓
Phase 9 (Deployment)
    ↓
Phase 10 (Usage Tracking)
```

**Critical Path**: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

---

## Environment Variables Summary

### Backend (.env)
```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Current Status

**Last Updated**: 2025-12-23

**Current Phase**: Phase 8 COMPLETE ✅ - Ready for Phase 8 verification and Phase 9

**Blockers**: None

---

## Progress Summary

### Completed
- ✅ **Phase 1: Backend API Setup** - FastAPI backend created and tested
  - To run: `cd backend && python -m uvicorn main:app --reload --port 8000`

- ✅ **Phase 2: Supabase Setup** - Database and storage configured
  - Project: **talktodata** (`vgwjlxlcmxtavamalwtv`)
  - Tables: profiles, conversations, messages, user_files, charts

- ✅ **Phase 3: Frontend Setup** - Next.js app with auth pages
  - To run: `cd frontend && npm run dev`
  - Landing page, Login, Signup, Dashboard pages
  - Supabase client/server/middleware configured
  - shadcn/ui components installed

- ✅ **Phase 4: Authentication Flow** - Login, signup, logout wired up
  - UserMenu component with avatar and signout
  - useUser() and useSupabase() hooks
  - Protected routes via middleware
  - Signout API route

- ✅ **Phase 5: File Upload & Storage** - Upload and manage data files
  - FileUploader with drag-and-drop, validation, progress
  - FileList with delete confirmation dialog
  - FilesPanel combining uploader and list
  - API routes for upload, list, delete, download URL
  - useFiles() hook for file management
  - Storage RLS policies configured

- ✅ **Phase 6: Chat Interface** - Full chat UI with conversations
  - ChatContainer, MessageList, MessageBubble, ChatInput, ConversationList
  - useConversations() and useMessages() hooks
  - Chat API route proxying to backend
  - File selection for context
  - Mobile tabs / desktop side-by-side layout

- ✅ **Phase 7: Chart Display & Downloads** - Display and download generated charts
  - ChartDisplay component with lightbox and download
  - ChartGallery for multiple chart grid layout
  - Backend uploads charts to Supabase Storage (charts bucket)
  - MessageBubble renders charts from metadata
  - Next.js configured for Supabase image domains

- ✅ **Phase 8: Dashboard Polish** - UX improvements and polish
  - Toast notifications with sonner for errors/success
  - Polished landing page with hero, features, how-it-works, CTA
  - Dark mode toggle with next-themes (system/light/dark)
  - Keyboard shortcuts (Ctrl+K for new conversation)
  - Brand updated to TalkToData

### Next Steps
1. ✅ **Phase 8 Verification**: Complete - mobile responsive, toast notifications, dark mode, landing page
2. ⬜ **Phase 9**: Deployment
3. ⬜ **Phase 10**: Usage tracking

### How to Continue
Tell Claude: "Verify Phase 8" or "Start Phase 9 - deployment"
