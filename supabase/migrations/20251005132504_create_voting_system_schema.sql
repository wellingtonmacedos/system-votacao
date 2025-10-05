/*
  # Sistema de Votação da Câmara de Vereadores
  
  1. Enums
    - UserRole: Papéis dos usuários (ADMIN, PRESIDENT, COUNCILOR)
    - SessionStatus: Status das sessões
    - VoteType: Tipos de voto (YES, NO, ABSTENTION)
    - MatterStatus: Status das matérias
    - DocumentType: Tipos de documentos
    - SpeechType: Tipos de solicitação de fala
  
  2. Tabelas Principais
    - users: Usuários do sistema (vereadores, presidente, admin)
    - voting_sessions: Sessões de votação
    - matters: Matérias/pautas para votação
    - attendances: Registro de presença
    - votes: Registro de votos
    - documents: Documentos do expediente
    - document_votes: Votos em documentos
    - speech_requests: Solicitações de fala
    - legislative_processes: Processos legislativos
    - session_matters: Relacionamento sessões-matérias
    - session_phases: Histórico de fases das sessões
  
  3. Tabelas NextAuth
    - accounts: Contas de autenticação
    - sessions: Sessões de autenticação
    - verification_tokens: Tokens de verificação
  
  4. Security
    - RLS habilitado em todas as tabelas
    - Políticas de acesso baseadas em autenticação
*/

-- Criar enums
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PRESIDENT', 'COUNCILOR');
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'PEQUENO_EXPEDIENTE', 'GRANDE_EXPEDIENTE', 'ORDEM_DO_DIA', 'CONSIDERACOES_FINAIS', 'TRIBUNA_LIVE', 'CLOSED');
CREATE TYPE "VoteType" AS ENUM ('YES', 'NO', 'ABSTENTION');
CREATE TYPE "MatterStatus" AS ENUM ('PENDING', 'VOTING', 'APPROVED', 'REJECTED', 'ABSTAINED');
CREATE TYPE "DocumentType" AS ENUM ('ATA_ANTERIOR', 'DISPENSA_ATA', 'REQUERIMENTO', 'PROJETO', 'PROCESSO');
CREATE TYPE "SpeechType" AS ENUM ('CONSIDERACOES_FINAIS', 'TRIBUNA_LIVE');

-- Tabela users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  role "UserRole" DEFAULT 'COUNCILOR' NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela voting_sessions
CREATE TABLE IF NOT EXISTS voting_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status "SessionStatus" DEFAULT 'SCHEDULED' NOT NULL,
  "scheduledAt" TIMESTAMPTZ NOT NULL,
  "startedAt" TIMESTAMPTZ,
  "endedAt" TIMESTAMPTZ,
  quorum INTEGER DEFAULT 7 NOT NULL,
  "sessionNumber" TEXT,
  date TIMESTAMPTZ DEFAULT now() NOT NULL,
  "timerStartedAt" TIMESTAMPTZ,
  "timerDuration" INTEGER,
  "timerPhase" TEXT,
  "attendanceStartedAt" TIMESTAMPTZ,
  "attendanceEndedAt" TIMESTAMPTZ,
  "isAttendanceOpen" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "createdBy" TEXT NOT NULL REFERENCES users(id)
);

-- Tabela matters
CREATE TABLE IF NOT EXISTS matters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status "MatterStatus" DEFAULT 'PENDING' NOT NULL,
  "orderIndex" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "createdBy" TEXT NOT NULL REFERENCES users(id)
);

-- Tabela session_matters
CREATE TABLE IF NOT EXISTS session_matters (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  "matterId" TEXT NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  "orderIndex" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE("sessionId", "matterId")
);

-- Tabela attendances
CREATE TABLE IF NOT EXISTS attendances (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "isPresent" BOOLEAN DEFAULT false NOT NULL,
  "arrivedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE("sessionId", "userId")
);

-- Tabela votes
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  "matterId" TEXT NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "voteType" "VoteType" NOT NULL,
  "votedAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE("matterId", "userId")
);

-- Tabela documents
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  author TEXT,
  type "DocumentType" NOT NULL,
  "orderIndex" INTEGER DEFAULT 0 NOT NULL,
  "isApproved" BOOLEAN,
  "isBeingRead" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "createdBy" TEXT NOT NULL REFERENCES users(id)
);

-- Tabela document_votes
CREATE TABLE IF NOT EXISTS document_votes (
  id TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "voteType" "VoteType" NOT NULL,
  "votedAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE("documentId", "userId")
);

-- Tabela speech_requests
CREATE TABLE IF NOT EXISTS speech_requests (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
  "citizenName" TEXT,
  "citizenCpf" TEXT,
  type "SpeechType" NOT NULL,
  subject TEXT NOT NULL,
  "orderIndex" INTEGER DEFAULT 0 NOT NULL,
  "isApproved" BOOLEAN DEFAULT false NOT NULL,
  "hasSpoken" BOOLEAN DEFAULT false NOT NULL,
  "isSpeaking" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela legislative_processes
CREATE TABLE IF NOT EXISTS legislative_processes (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id),
  "speechRequestId" TEXT REFERENCES speech_requests(id),
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'EM_TRAMITACAO' NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela session_phases
CREATE TABLE IF NOT EXISTS session_phases (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  phase "SessionStatus" NOT NULL,
  "startedAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "endedAt" TIMESTAMPTZ
);

-- Tabelas NextAuth
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  UNIQUE(identifier, token)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_voting_sessions_status ON voting_sessions(status);
CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(status);
CREATE INDEX IF NOT EXISTS idx_attendances_session ON attendances("sessionId");
CREATE INDEX IF NOT EXISTS idx_votes_matter ON votes("matterId");
CREATE INDEX IF NOT EXISTS idx_documents_session ON documents("sessionId");

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE speech_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislative_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for authenticated users)
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON voting_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON matters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON session_matters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON attendances FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON votes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON document_votes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON speech_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON legislative_processes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON session_phases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON verification_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public read access to certain tables
CREATE POLICY "Allow public read" ON voting_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read" ON matters FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read" ON attendances FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read" ON votes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read" ON documents FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read" ON speech_requests FOR SELECT TO anon USING (true);