import React, { useState, useEffect, useRef } from 'react';
import { useAtlas } from './context/AtlasContext';
import {
  Folder,
  Bot,
  Users,
  PlayCircle,
  Settings,
  Plus,
  RefreshCw,
  Trash2,
  BookOpen,
  Sliders,
  Activity,
  History,
  FileText,
  Database,
  Copy,
  Clock,
  Shield,
  Search,
  Send,
  Code2,
  MessageSquare,
  Terminal,
  Paperclip,
  X,
  Download,
  Eye,
  ChevronDown,
  ArrowRight,
  type LucideIcon
} from 'lucide-react';

type AgentChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  timestamp: Date;
};

type WorkspaceFile = {
  path: string;
  content: string;
};

type WorkspaceFileMeta = {
  path: string;
  size: number;
  modifiedAt: number;
};

type WorkspaceCommand = {
  command: string;
  cwd?: string;
};

type AgentWindowPosition = {
  x: number;
  y: number;
};

type AgentWindowSize = {
  width: number;
  height: number;
};

type ResizingAgent = {
  id: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

type AgentModelOptions = {
  overrideSystem?: string;
  jsonMode?: boolean;
  maxTokens?: number;
};

type AgentToolCall = {
  name: 'write_file' | 'run_command';
  arguments: Record<string, any>;
};

type ToolExecutionSummary = {
  writtenFiles: string[];
  commandResults: Array<{ command: string; cwd: string; output: string }>;
};

const AtlasBrand: React.FC<{ large?: boolean }> = ({ large = false }) => (
  <div className={`atlas-brand ${large ? 'large' : ''}`}>
    <span className="atlas-mark" aria-hidden="true">
      <img src="/logo.png" alt="" />
    </span>
    <span className="atlas-wordmark">ATLAS</span>
  </div>
);

const landingFeatures: Array<{ title: string; body: string; Icon: LucideIcon }> = [
  {
    title: 'Run many agents at once',
    body: 'Launch frontend, backend, QA, and research agents in the same project without losing control.',
    Icon: Bot
  },
  {
    title: 'Use any model or API',
    body: 'Connect OpenRouter, OpenAI, Anthropic, Groq, Ollama, or a custom compatible endpoint per agent.',
    Icon: Sliders
  },
  {
    title: 'Real files, real commands',
    body: 'Agents can edit workspace files, run terminal commands, preview output, and package results.',
    Icon: FileText
  },
  {
    title: 'Project memory built in',
    body: 'Supabase and Supermemory keep projects, agents, settings, and long-running context available.',
    Icon: Database
  }
];

const LandingPage: React.FC<{ onLaunch: () => void }> = ({ onLaunch }) => (
  <div className="landing-page">
    <header className="landing-nav">
      <AtlasBrand />
      <nav>
        <a href="#product">Product</a>
        <a href="#features">Features</a>
        <a href="#faq">FAQ</a>
      </nav>
      <button className="landing-nav-cta" onClick={onLaunch}>
        Open App
        <ArrowRight size={15} />
      </button>
    </header>

    <main>
      <section className="landing-hero" id="product">
        <h1>The AI workspace for coding agents.</h1>
        <p>
          Orchestrate specialist agents in parallel. Give them one project, real files,
          terminal access, live preview, and memory that survives refresh.
        </p>
        <div className="landing-actions">
          <button className="landing-primary" onClick={onLaunch}>
            Launch Atlas
            <ArrowRight size={17} />
          </button>
          <a className="landing-secondary" href="https://github.com/Yashrathore05/Project_Atlas" target="_blank" rel="noreferrer">
            View GitHub
          </a>
        </div>
      </section>

      <section className="landing-product-shot" aria-label="Atlas product preview">
        <div className="landing-window">
          <div className="landing-window-bar">
            <span />
            <span />
            <span />
            <strong>Atlas / Mission Control</strong>
          </div>
          <div className="landing-demo-grid">
            <aside className="landing-demo-sidebar">
              <span className="active">Workspace</span>
              <span>Files</span>
              <span>Agents</span>
              <span>Memory</span>
              <span>Providers</span>
            </aside>
            <div className="landing-run-list">
              <div className="landing-run active">
                <strong>healthtech-landing</strong>
                <small>3 agents running</small>
              </div>
              <div className="landing-run">
                <strong>supabase-auth</strong>
                <small>ready for review</small>
              </div>
              <div className="landing-run">
                <strong>pricing-page</strong>
                <small>preview on :3000</small>
              </div>
              <div className="landing-run muted">
                <strong>mobile-fixes</strong>
                <small>queued</small>
              </div>
            </div>
            <div className="landing-terminal-card">
              <div className="landing-terminal-title">
                <Terminal size={15} />
                <span>React Engineer</span>
                <small>OPENROUTER / SONNET</small>
              </div>
              <pre>{`> Build a landing page
→ read workspace files
→ write src/App.tsx
→ write src/styles.css
→ run npm test
✓ preview ready`}</pre>
            </div>
            <div className="landing-review-panel">
              <div className="landing-file-tabs">
                <span>Changes</span>
                <span>+412 -36</span>
              </div>
              <div className="landing-change-list">
                <div>
                  <strong>src/App.tsx</strong>
                  <small>+188</small>
                </div>
                <div>
                  <strong>src/index.css</strong>
                  <small>+224</small>
                </div>
                <pre>{`+ <AgentWindow role="frontend" />
+ <LivePreview file="index.html" />
- <PlaceholderPanel />`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-logo-strip" aria-label="Supported providers and tools">
        {['OpenRouter', 'Claude', 'OpenAI', 'Codex', 'Supabase', 'Supermemory', 'VS Code', 'Ollama'].map(item => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section className="landing-showcases" id="features">
        {landingFeatures.map(({ title, body, Icon }, index) => (
          <article className="landing-showcase" key={title}>
            <div>
              <span className="landing-section-label">{index === 0 ? 'Parallel execution' : index === 1 ? 'Universal models' : index === 2 ? 'Real workspace' : 'Persistent context'}</span>
              <h2>{title}</h2>
              <p>{body}</p>
            </div>
            <div className="landing-mini-ui">
              <Icon size={24} />
              <div className="landing-mini-lines">
                <span />
                <span />
                <span />
              </div>
              <button>{index === 2 ? 'Run command' : 'Open run'}</button>
            </div>
          </article>
        ))}
      </section>

      <section className="landing-testimonials">
        <h2>Built for people who want AI agents to actually ship.</h2>
        <div className="landing-quote-grid">
          {[
            ['Finally, agents that create files instead of dumping code into chat.', 'Frontend founder'],
            ['The per-agent model setup makes this usable for real teams.', 'Full-stack engineer'],
            ['Mission Control feels like the missing layer between chat and IDE.', 'Product builder']
          ].map(([quote, name]) => (
            <figure key={quote}>
              <blockquote>{quote}</blockquote>
              <figcaption>{name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="landing-faq" id="faq">
        <h2>Frequently asked questions</h2>
        <div>
          {[
            ['Can I use my own API keys?', 'Yes. Atlas supports global provider settings and custom keys per agent.'],
            ['Does it write real files?', 'Yes. Agents can write, rename, delete, preview, and download workspace files.'],
            ['Can multiple agents work together?', 'Yes. You can create different specialists and run collaboration tasks under one project.'],
            ['Is memory connected?', 'Yes. Supabase stores workspace state and Supermemory is used for long-term context.']
          ].map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-final-cta">
        <h2>Try Atlas now.</h2>
        <button className="landing-primary" onClick={onLaunch}>
          Open Workspace
          <ArrowRight size={17} />
        </button>
      </section>
    </main>
  </div>
);

export const App: React.FC = () => {
  const {
    user,
    session,
    authLoading,
    persistenceStatus,
    persistenceError,
    isSupabaseConfigured,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject,
    agents,
    templates,
    createAgent,
    deleteAgent,
    projectAgentIdsByProject,
    setProjectAgentIdsForProject,
    teams,
    createTeam,
    deleteTeam,
    providerSettings,
    updateProviderSettings,
    knowledge,
    addKnowledge,
    deleteKnowledge,
    // Missions MVPs
    missions,
    activeMissionId,
    decisions,
    addDecision,
    deleteDecision,
    replayMission,
    duplicateMission,
    deleteMission,
    renameMission,
    archiveMission
  } = useAtlas();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'mission_control' | 'files' | 'teams' | 'agents' | 'history' | 'memory' | 'decisions' | 'providers' | 'settings'>('mission_control');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('tmpl_1');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [projectNameInput, setProjectNameInput] = useState('');
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentCreateMode, setAgentCreateMode] = useState<'custom' | 'prebuilt'>('custom');
  const [showLanding, setShowLanding] = useState(() => window.location.hash !== '#app');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Agent Builder States
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('');
  const [newAgentPrompt, setNewAgentPrompt] = useState('');
  const [newAgentProvider, setNewAgentProvider] = useState('openrouter');
  const [newAgentModel, setNewAgentModel] = useState('anthropic/claude-sonnet-4.6');
  const [newAgentTemp, setNewAgentTemp] = useState(0.5);
  const [newAgentBudget, setNewAgentBudget] = useState(50.0);
  const [newAgentCapabilities, setNewAgentCapabilities] = useState('React, CSS');
  const [newAgentTags, setNewAgentTags] = useState('frontend');
  const [newAgentApiKey, setNewAgentApiKey] = useState('');
  const [newAgentBaseUrl, setNewAgentBaseUrl] = useState('');
  const [newAgentMcpServers, setNewAgentMcpServers] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>(['file_reader', 'file_writer']);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read_file', 'write_file']);

  // Team Builder States
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>(['tmpl_1', 'tmpl_2']);
  const [newTeamWorkflow, setNewTeamWorkflow] = useState<'sequential' | 'hierarchical' | 'mesh'>('sequential');

  // Knowledge States
  const [newKTitle, setNewKTitle] = useState('');
  const [newKContent, setNewKContent] = useState('');
  const [newKType, setNewKType] = useState<'markdown' | 'note' | 'pdf' | 'git'>('markdown');
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [memorySearchResults, setMemorySearchResults] = useState<string[]>([]);
  const [memoryStatus, setMemoryStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [memoryError, setMemoryError] = useState('');

  // Mission History States
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<'all' | 'success' | 'failed' | 'running' | 'idle'>('all');
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [editingMissionGoal, setEditingMissionGoal] = useState('');
  const [newDecisionTitle, setNewDecisionTitle] = useState('');
  const [newDecisionReason, setNewDecisionReason] = useState('');
  const [providerTestStatus, setProviderTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [providerTestMessage, setProviderTestMessage] = useState('');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => (localStorage.getItem('atlas-theme') as 'dark' | 'light') || 'dark');
  const [telemetryEnabled, setTelemetryEnabled] = useState(() => localStorage.getItem('atlas-telemetry') !== 'off');

  // Memory Inspect States
  const [selectedMemoryTab, setSelectedMemoryTab] = useState<'files' | 'knowledge' | 'agent_memory' | 'timeline'>('files');
  const [selectedMemoryFile, setSelectedMemoryFile] = useState<string | null>(null);
  const [selectedWorkspaceFile, setSelectedWorkspaceFile] = useState<string | null>(null);
  const [agentDrafts, setAgentDrafts] = useState<Record<string, string>>({});
  const [manualAgentMessages, setManualAgentMessages] = useState<Record<string, AgentChatMessage[]>>({});
  const [agentReplying, setAgentReplying] = useState<Record<string, boolean>>({});
  const [agentWindowPositions, setAgentWindowPositions] = useState<Record<string, AgentWindowPosition>>({});
  const [agentWindowSizes, setAgentWindowSizes] = useState<Record<string, AgentWindowSize>>({});
  const [agentWindowZ, setAgentWindowZ] = useState<Record<string, number>>({});
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [draggingAgent, setDraggingAgent] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizingAgent, setResizingAgent] = useState<ResizingAgent | null>(null);
  const [agentImageDrafts, setAgentImageDrafts] = useState<Record<string, string[]>>({});
  const [workspaceFileList, setWorkspaceFileList] = useState<WorkspaceFileMeta[]>([]);
  const [workspaceFileCache, setWorkspaceFileCache] = useState<Record<string, string>>({});
  const [workspaceFileVersion, setWorkspaceFileVersion] = useState<Record<string, number>>({});
  const [fileViewMode, setFileViewMode] = useState<'code' | 'preview'>('code');
  const [fileEditorContent, setFileEditorContent] = useState('');
  const [renameFilePath, setRenameFilePath] = useState('');
  const [fileSaveStatus, setFileSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [fileSaveError, setFileSaveError] = useState('');
  const [collaborationGoal, setCollaborationGoal] = useState('');
  const [collaborationRunning, setCollaborationRunning] = useState(false);
  const [collaborationFeed, setCollaborationFeed] = useState<string[]>([]);
  const agentChatRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const zIndexCounter = useRef(20);

  // Command Palette Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    localStorage.setItem('atlas-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('atlas-telemetry', telemetryEnabled ? 'on' : 'off');
  }, [telemetryEnabled]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const activeAgent = agents.find(a => a.id === selectedAgentId) || agents[0];
  const activeMission = missions.find(m => m.id === activeMissionId) || null;
  const projectAgentIds = activeProject ? (projectAgentIdsByProject[activeProject.id] || []) : [];
  const updateProjectAgentIds = (updater: string[] | ((ids: string[]) => string[])) => {
    if (!activeProject?.id) return;
    const nextIds = typeof updater === 'function' ? updater(projectAgentIds) : updater;
    setProjectAgentIdsForProject(activeProject.id, nextIds);
  };
  const tabLabels: Record<typeof activeTab, string> = {
    mission_control: 'Workspace',
    files: 'Files',
    teams: 'Teams',
    agents: 'Agents',
    history: 'History',
    memory: 'Memory',
    decisions: 'Decisions',
    providers: 'Providers',
    settings: 'Settings'
  };
  const workspaceAgents = projectAgentIds
    .map(id => agents.find(a => a.id === id))
    .filter(Boolean)
    .slice(0, 8) as typeof agents;
  const workspaceFiles = workspaceFileList.map(file => file.path);
  const workspaceFileMetaByPath = Object.fromEntries(workspaceFileList.map(file => [file.path, file]));
  const atlasApiBase = String(import.meta.env.VITE_ATLAS_API_URL || '').replace(/\/$/, '');
  const atlasWorkspaceBase = atlasApiBase ? `${atlasApiBase}/api/workspace` : '/__atlas_workspace';
  const atlasMemoryBase = atlasApiBase ? `${atlasApiBase}/api/memory` : '/__atlas_memory';
  const atlasAuthHeaders: Record<string, string> = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  const currentWorkspaceFile = selectedWorkspaceFile || workspaceFiles[0] || null;
  const currentWorkspaceFileName = currentWorkspaceFile?.split('/').pop() || currentWorkspaceFile;
  const currentWorkspaceFileContent = currentWorkspaceFile ? workspaceFileCache[currentWorkspaceFile] || '' : '';
  const currentWorkspaceFileMeta = currentWorkspaceFile ? workspaceFileMetaByPath[currentWorkspaceFile] : null;
  const previewEntryFile =
    (currentWorkspaceFile?.toLowerCase().endsWith('.html') ? currentWorkspaceFile : null) ||
    workspaceFiles.find(file => file.toLowerCase() === 'index.html') ||
    workspaceFiles.find(file => file.toLowerCase().endsWith('/index.html')) ||
    workspaceFiles.find(file => file.toLowerCase().endsWith('.html')) ||
    null;
  const previewUrl = activeProject?.id && previewEntryFile
    ? `${atlasWorkspaceBase}/preview?projectId=${encodeURIComponent(activeProject.id)}&path=${encodeURIComponent(previewEntryFile)}&v=${encodeURIComponent(String(workspaceFileMetaByPath[previewEntryFile]?.modifiedAt || Date.now()))}${session?.access_token && atlasApiBase ? `&access_token=${encodeURIComponent(session.access_token)}` : ''}`
    : '';

  const messagesForAgent = (agentName: string) => {
    const manualMessages = manualAgentMessages[agentName] || [];
    return { manualMessages };
  };

  const workspaceApi = async (endpoint: string, options?: RequestInit) => {
    const projectId = activeProject?.id || 'default';
    const separator = endpoint.includes('?') ? '&' : '?';
    const headers = new Headers(options?.headers);
    Object.entries(atlasAuthHeaders).forEach(([key, value]) => headers.set(key, value));
    const res = await fetch(`${atlasWorkspaceBase}${endpoint}${separator}projectId=${encodeURIComponent(projectId)}`, {
      ...options,
      headers
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || 'Workspace request failed');
    }
    return res.json();
  };

  const refreshWorkspaceFiles = async () => {
    if (!activeProject?.id) return;
    const data = await workspaceApi('/files');
    const files: WorkspaceFileMeta[] = (data.files || []).map((file: any) => (
      typeof file === 'string'
        ? { path: file, size: 0, modifiedAt: 0 }
        : { path: file.path, size: file.size || 0, modifiedAt: file.modifiedAt || 0 }
    ));
    setWorkspaceFileList(prev => {
      const previousVersions = Object.fromEntries(prev.map(file => [file.path, file.modifiedAt]));
      const nextVersions = Object.fromEntries(files.map(file => [file.path, file.modifiedAt]));
      const changed = files.filter(file => previousVersions[file.path] !== undefined && previousVersions[file.path] !== file.modifiedAt);
      if (changed.length > 0) {
        setWorkspaceFileCache(cache => {
          const next = { ...cache };
          changed.forEach(file => delete next[file.path]);
          return next;
        });
      }
      setWorkspaceFileVersion(nextVersions);
      return files;
    });
  };

  const readWorkspaceFile = async (filePath: string) => {
    const data = await workspaceApi(`/read?path=${encodeURIComponent(filePath)}`);
    setWorkspaceFileCache(prev => ({ ...prev, [filePath]: data.content || '' }));
    return data.content || '';
  };

  const writeWorkspaceFile = async (file: WorkspaceFile) => {
    const data = await workspaceApi('/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file)
    });
    const writtenPath = data.path || file.path;
    setWorkspaceFileCache(prev => ({ ...prev, [writtenPath]: file.content }));
    setSelectedWorkspaceFile(writtenPath);
    await refreshWorkspaceFiles();
    return writtenPath;
  };

  const renameWorkspaceFile = async (fromPath: string, toPath: string) => {
    const data = await workspaceApi('/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromPath, toPath })
    });
    const renamedPath = data.path || toPath;
    setWorkspaceFileCache(prev => {
      const next = { ...prev };
      if (next[fromPath] !== undefined) {
        next[renamedPath] = next[fromPath];
        delete next[fromPath];
      }
      return next;
    });
    setSelectedWorkspaceFile(renamedPath);
    await refreshWorkspaceFiles();
    return renamedPath;
  };

  const deleteWorkspaceFile = async (filePath: string) => {
    await workspaceApi('/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    });
    setWorkspaceFileCache(prev => {
      const next = { ...prev };
      delete next[filePath];
      return next;
    });
    setWorkspaceFileVersion(prev => {
      const next = { ...prev };
      delete next[filePath];
      return next;
    });
    setSelectedWorkspaceFile(prev => prev === filePath ? null : prev);
    await refreshWorkspaceFiles();
  };

  const handleSaveWorkspaceEditor = async () => {
    if (!currentWorkspaceFile) return;
    setFileSaveStatus('saving');
    setFileSaveError('');
    try {
      await writeWorkspaceFile({ path: currentWorkspaceFile, content: fileEditorContent });
      setFileSaveStatus('saved');
    } catch (err: any) {
      setFileSaveStatus('error');
      setFileSaveError(err?.message || 'Failed to save file.');
    }
  };

  const handleRenameWorkspaceFile = async () => {
    if (!currentWorkspaceFile || !renameFilePath.trim() || renameFilePath.trim() === currentWorkspaceFile) return;
    setFileSaveStatus('saving');
    setFileSaveError('');
    try {
      if (workspaceFiles.includes(renameFilePath.trim())) {
        throw new Error(`Cannot rename: "${renameFilePath.trim()}" already exists`);
      }
      await renameWorkspaceFile(currentWorkspaceFile, renameFilePath.trim());
      setFileSaveStatus('saved');
    } catch (err: any) {
      setFileSaveStatus('error');
      setFileSaveError(err?.message || 'Failed to rename file.');
    }
  };

  const handleDeleteWorkspaceFile = async (filePath = currentWorkspaceFile || '') => {
    if (!filePath) return;
    const confirmed = window.confirm(`Delete ${filePath}? This cannot be undone.`);
    if (!confirmed) return;
    setFileSaveStatus('saving');
    setFileSaveError('');
    try {
      await deleteWorkspaceFile(filePath);
      setFileSaveStatus('idle');
    } catch (err: any) {
      setFileSaveStatus('error');
      setFileSaveError(err?.message || 'Failed to delete file.');
    }
  };

  const runWorkspaceCommand = async (command: WorkspaceCommand) => {
    const data = await workspaceApi('/terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    });
    await refreshWorkspaceFiles();
    return {
      command: data.command || command.command,
      cwd: data.cwd || command.cwd || '.',
      output: data.output || ''
    };
  };

  const downloadWorkspaceZip = () => {
    if (!activeProject?.id) return;
    const url = `${atlasWorkspaceBase}/download.zip?projectId=${encodeURIComponent(activeProject.id)}`;
    const link = document.createElement('a');
    link.href = session?.access_token && atlasApiBase
      ? `${url}&access_token=${encodeURIComponent(session.access_token)}`
      : url;
    link.download = `${activeProject.name || activeProject.id}-workspace.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const repairWrappedWorkspaceFile = async (filePath: string, content: string) => {
    if (!/atlas-files|"files"\s*:/.test(content)) return;
    const repaired = recoverAtlasFilesBlock(content);
    const target = repaired.find(file => file.path === filePath) || repaired[0];
    if (!target?.content || target.content === content) return;
    await writeWorkspaceFile({ path: filePath, content: target.content });
  };

  const inferFilePath = (prompt: string, code: string, language = ''): string => {
    const explicitPath = prompt.match(/(?:at|in|to|file)\s+([A-Za-z0-9_./-]+\.(tsx|ts|jsx|js|css|html|json|md|py|sql))/i)?.[1];
    if (explicitPath) return explicitPath;

    const text = `${prompt}\n${language}\n${code}`.toLowerCase();
    if (text.includes('<!doctype html') || language === 'html') return 'index.html';
    if (language === 'css') return 'src/styles.css';
    if (language === 'python' || language === 'py') return 'main.py';
    if (language === 'sql') return 'schema.sql';
    if (language === 'json') return 'data.json';
    if (code.includes('export default function App') || code.includes('function App(') || code.includes('useState(')) return 'src/App.tsx';
    if (text.includes('react') || text.includes('calculator')) return 'src/App.tsx';
    return 'src/index.ts';
  };

  const cleanCodeBlock = (code: string): string => {
    const trimmed = code.trim();
    if (trimmed.includes('\\n') && !trimmed.includes('\n')) {
      return trimmed.replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
    return trimmed;
  };

  const decodeFileContent = (content: string): string =>
    content
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\`/g, '`');

  const normalizeWorkspaceFiles = (value: any): WorkspaceFile[] => {
    const files = Array.isArray(value) ? value : value?.files;
    if (!Array.isArray(files)) return [];
    return files
      .filter((file: any) => typeof file?.path === 'string' && typeof file?.content === 'string')
      .map((file: any) => ({
        path: file.path,
        content: decodeFileContent(file.content).trim()
      }));
  };

  const normalizeWorkspaceCommands = (value: any): WorkspaceCommand[] => {
    const commands = Array.isArray(value) ? value : value?.commands;
    if (!Array.isArray(commands)) return [];
    return commands
      .map((item: any) => {
        if (typeof item === 'string') return { command: item };
        if (typeof item?.command === 'string') return { command: item.command, cwd: typeof item.cwd === 'string' ? item.cwd : undefined };
        return null;
      })
      .filter(Boolean) as WorkspaceCommand[];
  };

  const parseJsonStringAt = (text: string, quoteIndex: number): { value: string; end: number } | null => {
    if (text[quoteIndex] !== '"') return null;
    let escaped = false;
    for (let index = quoteIndex + 1; index < text.length; index += 1) {
      const char = text[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        const raw = text.slice(quoteIndex, index + 1);
        try {
          return { value: JSON.parse(raw), end: index + 1 };
        } catch {
          return { value: decodeFileContent(raw.slice(1, -1)), end: index + 1 };
        }
      }
    }
    return null;
  };

  const recoverAtlasFilesBlock = (text: string): WorkspaceFile[] => {
    const pathMatch = text.match(/"path"\s*:\s*"([^"]+)"/);
    const contentKeyIndex = text.search(/"content"\s*:/);
    if (!pathMatch || contentKeyIndex === -1) return [];

    const afterContentKey = text.slice(contentKeyIndex).match(/"content"\s*:\s*"/);
    if (!afterContentKey || afterContentKey.index === undefined) return [];

    const quoteIndex = contentKeyIndex + afterContentKey.index + afterContentKey[0].length - 1;
    const parsed = parseJsonStringAt(text, quoteIndex);
    if (!parsed?.value) return [];

    return [{
      path: pathMatch[1],
      content: parsed.value.trim()
    }];
  };

  const extractBalancedJsonObjects = (text: string): string[] => {
    const results: string[] = [];
    for (let start = text.indexOf('{"files"'); start !== -1; start = text.indexOf('{"files"', start + 1)) {
      let depth = 0;
      let inString = false;
      let escaped = false;
      for (let index = start; index < text.length; index += 1) {
        const char = text[index];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === '\\') {
          escaped = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (inString) continue;
        if (char === '{') depth += 1;
        if (char === '}') depth -= 1;
        if (depth === 0) {
          results.push(text.slice(start, index + 1));
          break;
        }
      }
    }
    return results;
  };

  const isFileWorkPrompt = (prompt: string): boolean =>
    /(create|build|make|write|edit|update|implement|generate|fix|change|modify|replace)/i.test(prompt);

  const isUpdatePrompt = (prompt: string): boolean =>
    /(edit|update|fix|change|modify|replace|already|existing|given code)/i.test(prompt);

  const isCommandPrompt = (prompt: string): boolean =>
    /(run|execute|install|test|build|start|terminal|command|npm|pnpm|yarn|git)/i.test(prompt);

  const containsInternalToolBlock = (text: string): boolean =>
    /```?\s*atlas-(files|commands)|"files"\s*:|"commands"\s*:/.test(text);

  const targetFileForPrompt = (prompt: string, code: string, language = ''): string =>
    isUpdatePrompt(prompt) && currentWorkspaceFile
      ? currentWorkspaceFile
      : inferFilePath(prompt, code, language);

  const extractWorkspaceFiles = (reply: string, prompt: string): WorkspaceFile[] => {
    for (const jsonObject of extractBalancedJsonObjects(reply)) {
      try {
        const files = normalizeWorkspaceFiles(JSON.parse(jsonObject));
        if (files.length > 0) return files;
      } catch {
        // Continue to fenced JSON parsing.
      }
    }

    const fenceMatches = [...reply.matchAll(/```([A-Za-z0-9_-]+)?\s*([\s\S]*?)```/g)];
    const jsonFences = fenceMatches
      .filter(match => !match[1] || ['atlas-files', 'json'].includes(match[1].toLowerCase()))
      .map(match => match[2].trim());
    const candidates = [reply.trim(), ...jsonFences];

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate);
        const files = normalizeWorkspaceFiles(parsed);
        if (files.length > 0) return files;
      } catch {
        // Keep scanning other candidate blocks.
      }
    }

    if (/atlas-files|"files"\s*:/.test(reply)) {
      const recovered = recoverAtlasFilesBlock(reply);
      if (recovered.length > 0) return recovered;
      return [];
    }

    const codeFiles = fenceMatches
      .filter(match => !['atlas-files', 'atlas-commands', 'json'].includes((match[1] || '').toLowerCase()))
      .map(match => {
        const language = (match[1] || '').toLowerCase();
        const content = cleanCodeBlock(match[2]);
        return { path: targetFileForPrompt(prompt, content, language), content };
      })
      .filter(file => file.content.length > 0);

    if (codeFiles.length > 0) return codeFiles;

    const raw = cleanCodeBlock(reply);
    const looksLikeCode = /(import\s+.*from|export\s+default|function\s+\w+\s*\(|const\s+\w+\s*=|<!doctype html|<html|create table|def\s+\w+\s*\()/i.test(raw);
    if (looksLikeCode && isFileWorkPrompt(prompt)) {
      return [{ path: targetFileForPrompt(prompt, raw), content: raw }];
    }

    return [];
  };

  const extractWorkspaceCommands = (reply: string, prompt: string): WorkspaceCommand[] => {
    const fenceMatches = [...reply.matchAll(/```([A-Za-z0-9_-]+)?\s*([\s\S]*?)```/g)];
    const commandFences = fenceMatches
      .filter(match => ['atlas-commands', 'json'].includes((match[1] || '').toLowerCase()))
      .map(match => match[2].trim());

    for (const candidate of [reply.trim(), ...commandFences]) {
      try {
        const commands = normalizeWorkspaceCommands(JSON.parse(candidate));
        if (commands.length > 0) return commands;
      } catch {
        // Keep scanning command blocks.
      }
    }

    const shellBlocks = fenceMatches
      .filter(match => ['bash', 'sh', 'shell', 'terminal'].includes((match[1] || '').toLowerCase()))
      .map(match => cleanCodeBlock(match[2]))
      .filter(Boolean);

    if (shellBlocks.length > 0) return shellBlocks.map(command => ({ command }));

    if (isCommandPrompt(prompt) && /^\s*(npm|pnpm|yarn|git|node|npx|python|pip|ls|cat|mkdir|touch|rm|cp|mv)\b/m.test(reply)) {
      return [{ command: reply.trim().split('\n')[0] }];
    }

    return [];
  };

  const extractExplicitUserCommands = (prompt: string): WorkspaceCommand[] => {
    const quoted = [...prompt.matchAll(/`([^`]+)`/g)]
      .map(match => match[1].trim())
      .filter(Boolean);
    if (quoted.length > 0) return quoted.map(command => ({ command }));

    const runMatch = prompt.match(/\b(?:run|execute)\s+(.+)$/i);
    if (!runMatch) return [];

    const commandText = runMatch[1]
      .replace(/\b(after|then)\b.*$/i, '')
      .trim();
    const allowedStart = /^(npm|pnpm|yarn|git|node|npx|python|python3|pip|ls|cat|pwd|mkdir|touch|cp|mv)\b/;
    return commandText
      .split(/\s+(?:and then|then|&&)\s+/i)
      .map(command => command.trim())
      .filter(command => allowedStart.test(command))
      .map(command => ({ command }));
  };

  useEffect(() => {
    refreshWorkspaceFiles().catch(err => console.error('Failed to load workspace files:', err));
  }, [activeProject?.id]);

  useEffect(() => {
    if (!activeProject?.id) return;
    const timer = window.setInterval(() => {
      refreshWorkspaceFiles().catch(err => console.error('Failed to refresh workspace files:', err));
    }, 2000);
    return () => window.clearInterval(timer);
  }, [activeProject?.id]);

  useEffect(() => {
    if (currentWorkspaceFile && (!workspaceFileCache[currentWorkspaceFile] || workspaceFileVersion[currentWorkspaceFile] !== currentWorkspaceFileMeta?.modifiedAt)) {
      readWorkspaceFile(currentWorkspaceFile).catch(err => console.error('Failed to read workspace file:', err));
    }
  }, [currentWorkspaceFile, currentWorkspaceFileMeta?.modifiedAt]);

  useEffect(() => {
    setFileEditorContent(currentWorkspaceFileContent);
    setRenameFilePath(currentWorkspaceFile || '');
    setFileSaveStatus('idle');
    setFileSaveError('');
  }, [currentWorkspaceFile, currentWorkspaceFileContent]);

  useEffect(() => {
    if (!currentWorkspaceFile || !currentWorkspaceFileContent) return;
    repairWrappedWorkspaceFile(currentWorkspaceFile, currentWorkspaceFileContent)
      .catch(err => console.error('Failed to repair wrapped workspace file:', err));
  }, [currentWorkspaceFile, currentWorkspaceFileContent]);

  useEffect(() => {
    if (!draggingAgent) return;

    const onMove = (event: MouseEvent) => {
      const size = agentWindowSizes[draggingAgent.id] || { width: 440, height: 330 };
      setAgentWindowPositions(prev => ({
        ...prev,
        [draggingAgent.id]: {
          x: Math.min(Math.max(0, event.clientX - draggingAgent.offsetX), Math.max(0, window.innerWidth - size.width)),
          y: Math.min(Math.max(0, event.clientY - draggingAgent.offsetY), Math.max(0, window.innerHeight - size.height))
        }
      }));
    };

    const onUp = () => setDraggingAgent(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingAgent, agentWindowSizes]);

  useEffect(() => {
    if (!resizingAgent) return;

    const onMove = (event: MouseEvent) => {
      const nextWidth = Math.min(Math.max(320, resizingAgent.startWidth + event.clientX - resizingAgent.startX), window.innerWidth - 24);
      const nextHeight = Math.min(Math.max(260, resizingAgent.startHeight + event.clientY - resizingAgent.startY), window.innerHeight - 24);
      setAgentWindowSizes(prev => ({
        ...prev,
        [resizingAgent.id]: { width: nextWidth, height: nextHeight }
      }));
    };

    const onUp = () => setResizingAgent(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizingAgent]);

  const callAgentModel = async (
    agent: typeof agents[number],
    content: string,
    history: AgentChatMessage[],
    images: string[],
    options: AgentModelOptions = {}
  ): Promise<string> => {
    const config = getAgentProviderConfig(agent);
    const userContent = buildUserContent(content, images);
    const messages = buildAgentMessages(agent, userContent, history, options.overrideSystem);

    const res = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: buildProviderHeaders(config.provider, config.apiKey),
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: agent.temperature,
        max_tokens: options.maxTokens || 1600,
        ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {})
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText);
      throw new Error(`${config.provider} request failed: ${body || res.statusText}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || 'No response returned.';
  };

  const getAgentProviderConfig = (agent: typeof agents[number]) => {
    const openRouterFallbackKey = providerSettings.openRouterApiKey || import.meta.env.VITE_ATLAS_OPENROUTER_API_KEY || '';
    const apiKey = agent.apiKey?.trim() || openRouterFallbackKey.trim();
    const useFallbackOpenRouter = !agent.apiKey?.trim();
    const provider = useFallbackOpenRouter ? 'openrouter' : agent.provider;
    const defaultOpenRouterModel = providerSettings.openRouterModel === 'openrouter/auto'
      ? 'anthropic/claude-sonnet-4.6'
      : (providerSettings.openRouterModel || 'anthropic/claude-sonnet-4.6');
    const model = useFallbackOpenRouter
      ? defaultOpenRouterModel
      : (agent.model || defaultOpenRouterModel);
    const baseUrl = (useFallbackOpenRouter || provider === 'openrouter')
      ? 'https://openrouter.ai/api/v1'
      : (agent.baseUrl || providerSettings.endpoint || 'https://api.openai.com/v1');

    if (!apiKey) {
      throw new Error('No OpenRouter key is available. Add one in Provider settings or .env.local.');
    }

    if (!['openrouter', 'openai', 'groq', 'openai-compatible'].includes(provider)) {
      throw new Error(`${provider} direct chat is not wired here yet. Use OpenRouter for this agent or leave its key empty to use the OpenRouter fallback.`);
    }

    return { apiKey, provider, model, baseUrl };
  };

  const buildProviderHeaders = (provider: string, apiKey: string): HeadersInit => ({
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...(provider === 'openrouter' ? {
      'HTTP-Referer': 'https://atlas.local',
      'X-OpenRouter-Title': 'Atlas AI Workspace'
    } : {})
  });

  const buildUserContent = (content: string, images: string[]) =>
    images.length > 0
      ? [
          { type: 'text', text: content },
          ...images.map(image => ({ type: 'image_url', image_url: { url: image } }))
        ]
      : content;

  const buildWorkspaceContext = () => {
    const files = workspaceFiles.length > 0
      ? workspaceFiles.slice(0, 80).map(file => `- ${file}`).join('\n')
      : '- No files yet';
    return [
      `Active project: ${activeProject?.name || 'Untitled'}`,
      `Selected file: ${currentWorkspaceFile || 'none'}`,
      `Workspace files:\n${files}`
    ].join('\n');
  };

  const buildQualitySystemPrompt = (agent: typeof agents[number], overrideSystem?: string) => [
    agent.systemPrompt,
    '',
    `You are working inside one real Atlas project workspace. Stay inside your role: ${agent.role}.`,
    `Skills: ${agent.capabilities.join(', ') || 'general coding'}. Tags: ${agent.tags?.join(', ') || 'none'}.`,
    '',
    'Quality bar:',
    '- Produce complete, runnable, maintainable code, not snippets.',
    '- Match the existing file structure and update existing files instead of creating duplicates.',
    '- For a new React/Vite app, create a coherent scaffold: package.json, index.html, src/main.tsx, src/App.tsx, and CSS when missing.',
    '- Use semantic HTML, accessible labels, responsive layout, and real state/handlers where expected.',
    '- Avoid placeholder copy, TODO comments, fake APIs, unused imports, dead code, and broken formatting.',
    '- Keep code clean and idiomatic for the stack already present in the workspace.',
    '- If a request implies validation, edge cases, or error states, implement them.',
    '- Use file and terminal tools for real work. Do not paste code in chat when a tool can write the file.',
    '',
    buildWorkspaceContext(),
    overrideSystem ? `\nMode-specific instructions:\n${overrideSystem}` : ''
  ].filter(Boolean).join('\n');

  const buildAgentMessages = (
    agent: typeof agents[number],
    userContent: any,
    history: AgentChatMessage[],
    overrideSystem?: string
  ) => [
      {
        role: 'system',
        content: buildQualitySystemPrompt(agent, overrideSystem)
      },
      ...history.slice(-8).map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: userContent }
    ];

  const callAgentToolModel = async (
    agent: typeof agents[number],
    content: string,
    history: AgentChatMessage[],
    images: string[]
  ): Promise<AgentToolCall[]> => {
    const config = getAgentProviderConfig(agent);
    const userContent = buildUserContent(content, images);
    const messages = buildAgentMessages(
      agent,
      userContent,
      history,
      [
        'You are an Atlas coding agent with real file tools.',
        'For file creation or edits, call write_file with complete final file content.',
        'For terminal work, call run_command only when the user explicitly asks or when verification is clearly required.',
        'Before writing, choose the minimum coherent set of files needed for a runnable result.',
        'Do not return code in chat. Use tool calls only for actions.',
        'Never write markdown explanations into source files.'
      ].join('\n')
    );

    const res = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: buildProviderHeaders(config.provider, config.apiKey),
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: agent.temperature,
        max_tokens: 12000,
        tools: [
          {
            type: 'function',
            function: {
              name: 'write_file',
              description: 'Create or overwrite a complete, production-quality file in the current project workspace. Content must be only the real file content, with no markdown wrapper or explanation.',
              parameters: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'Relative file path, for example src/App.tsx' },
                  content: { type: 'string', description: 'Complete file content to write' }
                },
                required: ['path', 'content']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'run_command',
              description: 'Run a terminal command inside the current project workspace.',
              parameters: {
                type: 'object',
                properties: {
                  command: { type: 'string', description: 'Shell command to run' },
                  cwd: { type: 'string', description: 'Relative working directory, defaults to .' }
                },
                required: ['command']
              }
            }
          }
        ],
        tool_choice: 'auto'
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText);
      throw new Error(`${config.provider} tool request failed: ${body || res.statusText}`);
    }

    const data = await res.json();
    const calls = data?.choices?.[0]?.message?.tool_calls || [];
    return calls
      .map((call: any) => {
        const name = call.function?.name;
        if (name !== 'write_file' && name !== 'run_command') return null;
        try {
          return { name, arguments: JSON.parse(call.function?.arguments || '{}') };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as AgentToolCall[];
  };

  const buildAgentPrompt = (content: string, loadedFileContent?: string): string => {
    if (!isUpdatePrompt(content) || !currentWorkspaceFile) return content;
    const fileContent = loadedFileContent ?? workspaceFileCache[currentWorkspaceFile] ?? '';
    return `${content}\n\nTarget file: ${currentWorkspaceFile}\nCurrent file content:\n\`\`\`\n${fileContent}\n\`\`\`\nReturn the complete updated file content for ${currentWorkspaceFile}.`;
  };

  const generateFileJson = async (agent: typeof agents[number], prompt: string, fallbackPath?: string): Promise<string> => {
    const targetPath = isUpdatePrompt(prompt) && currentWorkspaceFile ? currentWorkspaceFile : (fallbackPath || inferFilePath(prompt, prompt));
    return callAgentModel(
      agent,
      [
        `User request:\n${prompt}`,
        '',
        buildWorkspaceContext(),
        '',
        `Create or update the requested project file. Target path: ${targetPath}.`,
        'The result must be complete, runnable, well-structured file content.',
        'Do not include markdown, prose, or partial snippets inside file content.'
      ].join('\n'),
      [],
      [],
      {
        jsonMode: true,
        maxTokens: 12000,
        overrideSystem: [
          'You are an Atlas file-writing tool.',
          'Return valid JSON only. No markdown. No backticks. No explanation.',
          `Schema: {"files":[{"path":"${targetPath}","content":"complete file content"}]}.`,
          'The content must be complete final file content, not a diff.',
          'Never put explanation text, markdown fences, or JSON strings inside the file content.',
          'Code quality requirements: readable structure, no unused imports, no placeholder TODOs, responsive UI for frontend, and no fake implementation when real behavior can be implemented.'
        ].join('\n')
      }
    );
  };

  const generateCommandJson = async (agent: typeof agents[number], prompt: string): Promise<string> => {
    return callAgentModel(
      agent,
      `User request:\n${prompt}\n\nReturn the terminal command or commands needed for this request.`,
      [],
      [],
      {
        jsonMode: true,
        maxTokens: 1000,
        overrideSystem: 'You are an Atlas terminal tool. Return valid JSON only. No markdown. No backticks. No explanation. Schema: {"commands":[{"command":"ls -la","cwd":"."}]}. If the user named an exact command, return that exact command. Do not invent npm test unless the user explicitly asks to test.'
      }
    );
  };

  const executeAgentToolCalls = async (toolCalls: AgentToolCall[]): Promise<ToolExecutionSummary> => {
    const summary: ToolExecutionSummary = { writtenFiles: [], commandResults: [] };

    for (const call of toolCalls) {
      if (call.name === 'write_file') {
        const path = typeof call.arguments.path === 'string' ? call.arguments.path : '';
        const content = typeof call.arguments.content === 'string' ? call.arguments.content : '';
        if (!path || !content) continue;
        summary.writtenFiles.push(await writeWorkspaceFile({ path, content }));
      }

      if (call.name === 'run_command') {
        const command = typeof call.arguments.command === 'string' ? call.arguments.command : '';
        const cwd = typeof call.arguments.cwd === 'string' ? call.arguments.cwd : undefined;
        if (!command) continue;
        summary.commandResults.push(await runWorkspaceCommand({ command, cwd }));
      }
    }

    return summary;
  };

  const appendAgentMessage = (agentName: string, message: AgentChatMessage) => {
    setManualAgentMessages(prev => ({
      ...prev,
      [agentName]: [
        ...(prev[agentName] || []),
        message
      ]
    }));
  };

  const bringAgentWindowToFront = (agentId: string) => {
    zIndexCounter.current += 1;
    setActiveWindowId(agentId);
    setAgentWindowZ(prev => ({ ...prev, [agentId]: zIndexCounter.current }));
  };

  const scrollAgentChatToLatest = (agentId: string, smooth = true) => {
    const node = agentChatRefs.current[agentId];
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  const removeAgentFromWorkspace = (agentId: string) => {
    updateProjectAgentIds(prev => prev.filter(id => id !== agentId));
    setAgentWindowPositions(prev => {
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
    setAgentWindowSizes(prev => {
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      workspaceAgents.forEach(agent => scrollAgentChatToLatest(agent.id, false));
    }, 50);
    return () => window.clearTimeout(timer);
  }, [manualAgentMessages, agentReplying, workspaceAgents.map(agent => agent.id).join('|')]);

  const searchRelevantMemory = async (agentName: string, query: string): Promise<string> => {
    if (!user || !activeProject?.id || !query.trim()) return '';
    const url = `${atlasMemoryBase}/search?q=${encodeURIComponent(`${activeProject.name} ${agentName} ${query}`)}&limit=5`;
    const res = await fetch(url, { headers: atlasAuthHeaders }).catch(() => null);
    if (!res?.ok) return '';
    const data = await res.json().catch(() => null);
    const results = Array.isArray(data?.results) ? data.results : Array.isArray(data?.documents) ? data.documents : [];
    return results
      .map((item: any) => {
        if (Array.isArray(item?.chunks)) {
          return item.chunks.map((chunk: any) => chunk?.content || '').filter(Boolean).join('\n');
        }
        return item?.content || item?.document?.content || item?.title || '';
      })
      .filter(Boolean)
      .slice(0, 5)
      .join('\n---\n');
  };

  const runAgentWork = async (
    agent: typeof agents[number],
    content: string,
    images: string[],
    previousMessages: AgentChatMessage[]
  ): Promise<string> => {
    const relevantMemory = await searchRelevantMemory(agent.name, content);
    const contentWithMemory = relevantMemory
      ? `${content}\n\nRelevant long-term memory from earlier workspace work:\n${relevantMemory}`
      : content;
    const loadedFileContent = isUpdatePrompt(content) && currentWorkspaceFile && !workspaceFileCache[currentWorkspaceFile]
      ? await readWorkspaceFile(currentWorkspaceFile)
      : undefined;
    const modelPrompt = buildAgentPrompt(contentWithMemory, loadedFileContent);
    const shouldUseTools = isFileWorkPrompt(content) || isCommandPrompt(content);
    const explicitCommands = extractExplicitUserCommands(content);
    const toolPrompt = explicitCommands.length > 0
      ? modelPrompt.replace(/\b(?:run|execute)\s+.+$/i, 'Do not run terminal commands in this step. Only create or edit files if needed.')
      : modelPrompt;
    const toolSummary = shouldUseTools
      ? await executeAgentToolCalls(await callAgentToolModel(agent, toolPrompt, previousMessages, images))
      : { writtenFiles: [], commandResults: [] };
    let reply = shouldUseTools && (toolSummary.writtenFiles.length > 0 || toolSummary.commandResults.length > 0)
      ? ''
      : isFileWorkPrompt(content)
      ? await generateFileJson(agent, modelPrompt)
      : await callAgentModel(agent, modelPrompt, previousMessages, images);
    let files = extractWorkspaceFiles(reply, content);
    let commandReply = isCommandPrompt(content) && toolSummary.commandResults.length === 0
      ? await generateCommandJson(agent, modelPrompt)
      : reply;
    let commands = explicitCommands.length > 0 ? explicitCommands : extractWorkspaceCommands(commandReply, content);
    if (files.length === 0 && isFileWorkPrompt(content)) {
      const forcedReply = await generateFileJson(agent, modelPrompt, inferFilePath(content, reply));
      const forcedFiles = extractWorkspaceFiles(forcedReply, content);
      if (forcedFiles.length > 0) {
        reply = forcedReply;
        files = forcedFiles;
      }
    }
    if (commands.length === 0 && isCommandPrompt(content)) {
      const forcedCommandReply = await generateCommandJson(agent, modelPrompt);
      commands = extractWorkspaceCommands(forcedCommandReply, content);
    }

    const writtenFiles: string[] = [...toolSummary.writtenFiles];
    for (const file of files) {
      writtenFiles.push(await writeWorkspaceFile(file));
    }

    const commandResults = [...toolSummary.commandResults];
    for (const command of commands) {
      commandResults.push(await runWorkspaceCommand(command));
    }

    const summaryParts = [
      writtenFiles.length > 0 ? `Created/updated files: ${writtenFiles.join(', ')}` : '',
      commandResults.length > 0
        ? commandResults.map(result => `$ ${result.command}\n${result.output || '(no output)'}`).join('\n\n')
        : ''
    ].filter(Boolean);

    if (writtenFiles.length > 0) setActiveTab('files');
    return summaryParts.length > 0
      ? summaryParts.join('\n\n')
      : containsInternalToolBlock(reply)
        ? 'I received a tool response, but Atlas could not safely apply it. Please retry with a specific file path or command.'
        : reply;
  };

  const handleSendAgentMessage = async (agent: typeof agents[number]) => {
    const agentName = agent.name;
    const content = (agentDrafts[agentName] || '').trim();
    const images = agentImageDrafts[agent.id] || [];
    if ((!content && images.length === 0) || agentReplying[agent.id]) return;

    const previousMessages = manualAgentMessages[agentName] || [];
    const userMessage: AgentChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content || '[Image attached]',
      images,
      timestamp: new Date()
    };

    appendAgentMessage(agentName, userMessage);
    setAgentDrafts(prev => ({ ...prev, [agentName]: '' }));
    setAgentImageDrafts(prev => ({ ...prev, [agent.id]: [] }));
    setAgentReplying(prev => ({ ...prev, [agent.id]: true }));

    try {
      const displayContent = await runAgentWork(agent, content, images, previousMessages);
      rememberAgentContext(agentName, content || '[Image attached]', displayContent);
      appendAgentMessage(agentName, {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: displayContent,
        timestamp: new Date()
      });
    } catch (err: any) {
      appendAgentMessage(agentName, {
        id: `error_${Date.now()}`,
        role: 'system',
        content: err?.message || 'Agent request failed.',
        timestamp: new Date()
      });
    } finally {
      setAgentReplying(prev => ({ ...prev, [agent.id]: false }));
    }
  };

  const handleAgentImages = (agentId: string, files: FileList | null) => {
    if (!files?.length) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        setAgentImageDrafts(prev => ({
          ...prev,
          [agentId]: [...(prev[agentId] || []), reader.result as string].slice(0, 4)
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const defaultAgentWindowPosition = (index: number): AgentWindowPosition => ({
    x: 260 + (index % 3) * 48,
    y: 132 + (index % 3) * 38
  });

  const defaultAgentWindowSize = (index: number): AgentWindowSize => ({
    width: Math.min(480, Math.max(340, window.innerWidth - 320 - index * 20)),
    height: 360
  });

  const collaborationRoleInstruction = (agent: typeof agents[number], goal: string): string => {
    const roleText = `${agent.name} ${agent.role} ${agent.capabilities.join(' ')} ${agent.tags?.join(' ') || ''}`.toLowerCase();
    const goalText = goal.toLowerCase();
    if (/front|react|ui|css|design|typescript/.test(roleText)) {
      return 'You are responsible for frontend/UI files. Create or edit React, CSS, HTML, or client-side files. Run only explicit user-requested commands.';
    }
    if (/back|api|server|sql|db|database|python|devops/.test(roleText)) {
      return /api|backend|server|database|sql|auth|supabase|docker/.test(goalText)
        ? 'You are responsible for backend/API/database/setup files. Create or edit only backend-relevant files. Run only explicit user-requested commands.'
        : 'This task appears frontend-only. Do not create unrelated backend files. If the user requested an explicit terminal command, run that command; otherwise summarize that no backend change is needed.';
    }
    return 'Work only on the part that fits your role. Do not duplicate another agent. Run only explicit user-requested commands.';
  };

  const handleRunCollaboration = async () => {
    const goal = collaborationGoal.trim();
    if (!goal || workspaceAgents.length === 0 || collaborationRunning) return;

    setCollaborationRunning(true);
    setCollaborationFeed([]);
    const sharedContext: string[] = [];

    for (const agent of workspaceAgents) {
      const agentName = agent.name;
      setAgentReplying(prev => ({ ...prev, [agent.id]: true }));
      const prompt = [
        `Shared project task: ${goal}`,
        sharedContext.length > 0 ? `Previous agent work:\n${sharedContext.join('\n\n')}` : '',
        `Your role is ${agent.role}. ${collaborationRoleInstruction(agent, goal)}`
      ].filter(Boolean).join('\n\n');

      const userMessage: AgentChatMessage = {
        id: `collab_user_${agent.id}_${Date.now()}`,
        role: 'user',
        content: `Collaboration task:\n${goal}`,
        timestamp: new Date()
      };
      appendAgentMessage(agentName, userMessage);
      setCollaborationFeed(prev => [...prev, `${agentName} started`]);

      try {
        const previousMessages = manualAgentMessages[agentName] || [];
        const result = await runAgentWork(agent, prompt, [], previousMessages);
        rememberAgentContext(agentName, goal, result);
        appendAgentMessage(agentName, {
          id: `collab_assistant_${agent.id}_${Date.now()}`,
          role: 'assistant',
          content: result,
          timestamp: new Date()
        });
        sharedContext.push(`${agentName} (${agent.role}): ${result}`);
        setCollaborationFeed(prev => [...prev, `${agentName} completed`]);
      } catch (err: any) {
        const error = err?.message || 'Agent collaboration step failed.';
        appendAgentMessage(agentName, {
          id: `collab_error_${agent.id}_${Date.now()}`,
          role: 'system',
          content: error,
          timestamp: new Date()
        });
        sharedContext.push(`${agentName} failed: ${error}`);
        setCollaborationFeed(prev => [...prev, `${agentName} failed`]);
      } finally {
        setAgentReplying(prev => ({ ...prev, [agent.id]: false }));
      }
    }

    setCollaborationRunning(false);
  };

  const handlePaletteSelect = (tab: any) => {
    setActiveTab(tab);
    setCommandPaletteOpen(false);
    setPaletteQuery('');
  };

  const handleCreateProjectOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectNameInput.trim()) return;
    createProject(projectNameInput.trim(), 'User workspace project');
    setProjectNameInput('');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'signin') await signIn(authEmail.trim(), authPassword);
      else await signUp(authEmail.trim(), authPassword);
      setAuthPassword('');
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed.');
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in failed.');
    }
  };

  const rememberAgentContext = async (agentName: string, userContent: string, assistantContent: string) => {
    if (!user || !activeProject?.id) return;
    await fetch(`${atlasMemoryBase}/add`, {
      method: 'POST',
      headers: { ...atlasAuthHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: [
          `Project: ${activeProject.name}`,
          `Agent: ${agentName}`,
          `User: ${userContent}`,
          `Agent result: ${assistantContent}`
        ].join('\n'),
        customId: `${activeProject.id}:${agentName}:${Date.now()}`,
        metadata: {
          userId: user.id,
          projectId: activeProject.id,
          agentName
        },
        containerTags: [`user:${user.id}`, `project:${activeProject.id}`, `agent:${agentName}`]
      })
    }).catch(() => null);
  };

  const handleCreateAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    const created = await createAgent({
      name: newAgentName,
      role: newAgentRole || 'General Assistant',
      description: newAgentPrompt || 'Custom built AI coding agent.',
      avatar: 'custom_avatar.png',
      capabilities: newAgentCapabilities.split(',').map(c => c.trim()).filter(Boolean),
      systemPrompt: newAgentPrompt || 'You are a senior software engineer. Build complete, clean, runnable implementations with strong UX, clear structure, and no placeholder behavior.',
      model: newAgentModel,
      provider: newAgentProvider,
      temperature: newAgentTemp,
      permissions: selectedPermissions,
      tools: selectedTools,
      tags: newAgentTags.split(',').map(t => t.trim()).filter(Boolean),
      apiKey: newAgentApiKey.trim() || undefined,
      baseUrl: newAgentBaseUrl.trim() || undefined,
      mcpServers: newAgentMcpServers.split('\n').map(s => s.trim()).filter(Boolean),
      budgetLimit: newAgentBudget,
      currentSpend: 0.0,
      preferredTasks: ['coding']
    });

    updateProjectAgentIds(prev => prev.includes(created.id) ? prev : [...prev, created.id]);
    // Reset Form
    setNewAgentName('');
    setNewAgentRole('');
    setNewAgentPrompt('');
    setNewAgentCapabilities('React, CSS');
    setNewAgentTags('frontend');
    setNewAgentApiKey('');
    setNewAgentBaseUrl('');
    setNewAgentMcpServers('');
    setSelectedAgentId(created.id);
    setAgentModalOpen(false);
  };

  const handleUsePrebuiltAgent = async (templateId: string) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return;

    const created = await createAgent({
      name: tmpl.name,
      role: tmpl.role,
      description: tmpl.description,
      avatar: tmpl.avatar,
      capabilities: tmpl.capabilities,
      systemPrompt: tmpl.systemPrompt,
      model: tmpl.model,
      provider: tmpl.provider,
      temperature: tmpl.temperature,
      permissions: tmpl.permissions,
      tools: tmpl.tools,
      tags: tmpl.preferredTasks,
      budgetLimit: tmpl.budgetLimit,
      currentSpend: 0,
      preferredTasks: tmpl.preferredTasks
    });

    updateProjectAgentIds(prev => prev.includes(created.id) ? prev : [...prev, created.id]);
    setSelectedAgentId(created.id);
    setAgentModalOpen(false);
  };

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    createTeam(newTeamName, newTeamDesc, selectedTeamMembers, newTeamWorkflow);
    setNewTeamName('');
    setNewTeamDesc('');
  };

  const handleCreateKnowledgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKTitle.trim()) return;

    addKnowledge(newKTitle, newKContent, newKType);
    setNewKTitle('');
    setNewKContent('');
  };

  const handleMemorySearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = memorySearchQuery.trim() || activeProject?.name || 'atlas';
    setMemoryStatus('checking');
    setMemoryError('');
    try {
      const res = await fetch(`${atlasMemoryBase}/search?q=${encodeURIComponent(query)}&limit=8`, { headers: atlasAuthHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Supermemory search failed.');
      const results = Array.isArray(data.results) ? data.results : [];
      setMemorySearchResults(results.map((item: any) => {
        if (Array.isArray(item?.chunks)) {
          return item.chunks.map((chunk: any) => chunk?.content || '').filter(Boolean).join('\n');
        }
        return item?.content || item?.document?.content || JSON.stringify(item);
      }).filter(Boolean));
      setMemoryStatus('connected');
    } catch (err: any) {
      setMemoryStatus('error');
      setMemoryError(err?.message || 'Supermemory is not reachable.');
    }
  };

  const handleCreateDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecisionTitle.trim()) return;
    addDecision(newDecisionTitle.trim(), newDecisionReason.trim() || 'No reason provided.');
    setNewDecisionTitle('');
    setNewDecisionReason('');
  };

  const handleProviderTest = async () => {
    const key = providerSettings.openRouterApiKey || import.meta.env.VITE_ATLAS_OPENROUTER_API_KEY || providerSettings.apiKey;
    const baseUrl = providerSettings.openRouterApiKey || import.meta.env.VITE_ATLAS_OPENROUTER_API_KEY
      ? 'https://openrouter.ai/api/v1'
      : providerSettings.endpoint;

    setProviderTestStatus('testing');
    setProviderTestMessage('');
    try {
      if (!key) throw new Error('No provider key configured.');
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
        headers: buildProviderHeaders(baseUrl.includes('openrouter') ? 'openrouter' : 'openai', key)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Provider check failed.');
      setProviderTestStatus('success');
      setProviderTestMessage(`Connected. ${Array.isArray(data.data) ? data.data.length : 0} models visible.`);
    } catch (err: any) {
      setProviderTestStatus('error');
      setProviderTestMessage(err?.message || 'Provider check failed.');
    }
  };

  const handleRenameMissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMissionId && editingMissionGoal.trim()) {
      renameMission(editingMissionId, editingMissionGoal);
      setEditingMissionId(null);
    }
  };

  // Filtered History
  const filteredMissions = missions.filter(m => {
    const matchesSearch = m.goal.toLowerCase().includes(historySearchQuery.toLowerCase());
    const matchesFilter = historyFilterStatus === 'all' || m.status === historyFilterStatus;
    return matchesSearch && matchesFilter;
  });
  const agentActivityHistory = Object.entries(manualAgentMessages)
    .flatMap(([agentName, messages]) => messages.map(message => ({ agentName, message })))
    .sort((a, b) => b.message.timestamp.getTime() - a.message.timestamp.getTime())
    .filter(item => item.message.content.toLowerCase().includes(historySearchQuery.toLowerCase()));

  if (showLanding) {
    return (
      <LandingPage
        onLaunch={() => {
          window.location.hash = 'app';
          setShowLanding(false);
        }}
      />
    );
  }

  if (authLoading) {
    return (
      <div className="project-start-screen">
        <div className="project-start-panel">
          <AtlasBrand large />
          <h1>Loading</h1>
          <p>Checking your saved workspace session.</p>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="project-start-screen">
        <div className="project-start-panel">
          <AtlasBrand large />
          <h1>Database Setup Needed</h1>
          <p>Add `VITE_SUPABASE_ANON_KEY` to `.env.local`, restart the dev server, then Atlas can save login and workspace state.</p>
          <div className="auth-env-box">
            <code>VITE_SUPABASE_URL=https://ecyblmykuhadhzsexzgi.supabase.co</code>
            <code>VITE_SUPABASE_ANON_KEY=your_supabase_anon_key</code>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="project-start-screen">
        <form className="project-start-panel auth-panel" onSubmit={handleAuthSubmit}>
          <AtlasBrand large />
          <h1>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</h1>
          <p>Use an account so projects, agents, settings, and memory survive refresh.</p>
          <button className="google-auth-button" type="button" onClick={handleGoogleAuth}>
            <span>G</span>
            Continue with Google
          </button>
          <div className="auth-divider"><span>or</span></div>
          <input
            className="form-input"
            type="email"
            autoFocus
            placeholder="Email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            required
          />
          <input
            className="form-input"
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            required
          />
          {authError && <div className="auth-error">{authError}</div>}
          <button className="btn" type="submit">{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</button>
          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setAuthMode(prev => prev === 'signin' ? 'signup' : 'signin');
              setAuthError('');
            }}
          >
            {authMode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </form>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="project-start-screen">
        <form className="project-start-panel" onSubmit={handleCreateProjectOnly}>
          <AtlasBrand large />
          <h1>Create Project</h1>
          <p>Start with a project name. You will add agents and tools inside the workspace.</p>
          <input
            className="form-input"
            autoFocus
            placeholder="Project name"
            value={projectNameInput}
            onChange={(e) => setProjectNameInput(e.target.value)}
          />
          <button className="btn" type="submit">Enter Workspace</button>
        </form>
      </div>
    );
  }

  return (
    <div className={`app-container ${activeTab === 'agents' ? 'has-inspector' : ''}`}>
      {/* 1. Left Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <AtlasBrand />
        </div>

        {/* Project Selector - keeping tests green */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>PROJECT</label>
          <select
            className="form-select"
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            style={{ padding: '6px 8px', fontSize: '12px', background: 'var(--bg-app)' }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <nav className="sidebar-menu">
          <div
            className={`menu-item ${activeTab === 'mission_control' ? 'active' : ''}`}
            onClick={() => setActiveTab('mission_control')}
          >
            <PlayCircle size={16} />
            <span>Workspace</span>
          </div>
          <div
            className={`menu-item ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <Code2 size={16} />
            <span>Files</span>
          </div>
          <div
            className={`menu-item ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            <Users size={16} />
            <span>Teams</span>
          </div>
          <div
            className={`menu-item ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            <Bot size={16} />
            <span>Agents</span>
          </div>
          <div
            className={`menu-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} />
            <span>History</span>
          </div>
          <div
            className={`menu-item ${activeTab === 'memory' ? 'active' : ''}`}
            onClick={() => setActiveTab('memory')}
          >
            <Database size={16} />
            <span>Memory</span>
          </div>
          <div
            className={`menu-item ${activeTab === 'decisions' ? 'active' : ''}`}
            onClick={() => setActiveTab('decisions')}
          >
            <FileText size={16} />
            <span>Decisions</span>
          </div>
          <div
            className={`menu-item ${activeTab === 'providers' ? 'active' : ''}`}
            onClick={() => setActiveTab('providers')}
          >
            <Sliders size={16} />
            <span>Providers</span>
          </div>
          <div
            className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            <span>Settings</span>
          </div>
        </nav>

        {/* Command shortcut hint */}
        <div style={{ padding: '16px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
          Press <kbd style={{ background: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>Ctrl+K</kbd> to search
        </div>
      </aside>

      {/* 2. Main Workspace Panel */}
      <main className="main-workspace">
        <header className="workspace-header">
          <div className="workspace-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-main)' }}>{activeProject?.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-primary)' }}>{tabLabels[activeTab]}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-success)' }}>
              <span style={{ width: '6px', height: '6px', background: 'var(--text-success)', borderRadius: '50%' }}></span>
              <span>{persistenceStatus === 'synced' ? 'Saved' : persistenceStatus === 'saving' ? 'Saving' : persistenceStatus}</span>
            </div>
            {persistenceError && <span style={{ color: 'var(--text-error)', fontSize: '11px' }}>{persistenceError}</span>}
            <button className="btn btn-secondary" onClick={() => signOut()} style={{ minHeight: 30, padding: '5px 10px', fontSize: 12 }}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="workspace-content">
          {/* A. MISSION CONTROL TAB */}
          {activeTab === 'mission_control' && (
            <div className="agent-workspace">
              <div className="agent-workspace-header">
                <div>
                  <span className="form-label">Project Workspace</span>
                  <h2>{activeProject?.name}</h2>
                </div>
                <button className="btn" onClick={() => setAgentModalOpen(true)}>
                  <Plus size={15} />
                  <span>Add Agent</span>
                </button>
              </div>

              {workspaceAgents.length === 0 ? (
                <div className="empty-agent-stage">
                  <button className="add-agent-orb" onClick={() => setAgentModalOpen(true)}>
                    <Plus size={28} />
                  </button>
                  <h3>Add Agent</h3>
                  <p>Create a custom specialist or choose a prebuilt agent. Agents added here work inside this single project workspace.</p>
                </div>
              ) : (
                <>
                <div className="collaboration-bar">
                  <div>
                    <span className="form-label">Multi-Agent Collaboration</span>
                    <strong>{workspaceAgents.length} agents in this workspace</strong>
                  </div>
                  <input
                    value={collaborationGoal}
                    onChange={(e) => setCollaborationGoal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRunCollaboration();
                    }}
                    placeholder="Give all agents one shared task, e.g. build a health tech landing page and run tests"
                    disabled={collaborationRunning}
                  />
                  <button className="btn" onClick={handleRunCollaboration} disabled={collaborationRunning || !collaborationGoal.trim()}>
                    <Users size={14} />
                    <span>{collaborationRunning ? 'Working...' : 'Run Together'}</span>
                  </button>
                </div>
                {collaborationFeed.length > 0 && (
                  <div className="collaboration-feed">
                    {collaborationFeed.map((item, idx) => (
                      <span key={`${item}_${idx}`}>{item}</span>
                    ))}
                  </div>
                )}
                <div className="agent-desktop">
                    {workspaceAgents.map((agent, index) => {
                      const { manualMessages } = messagesForAgent(agent.name);
                      const position = agentWindowPositions[agent.id] || defaultAgentWindowPosition(index);
                      const size = agentWindowSizes[agent.id] || defaultAgentWindowSize(index);
                      return (
                        <div
                          className={`agent-window terminal-window ${activeWindowId === agent.id ? 'active' : ''}`}
                          key={agent.id}
                          style={{
                            left: position.x,
                            top: position.y,
                            width: size.width,
                            height: size.height,
                            zIndex: agentWindowZ[agent.id] || 20 + index
                          }}
                          onMouseDown={() => bringAgentWindowToFront(agent.id)}
                        >
                          <div
                            className="agent-window-titlebar"
                            onMouseDown={(event) => {
                              const rect = event.currentTarget.parentElement?.getBoundingClientRect();
                              if (!rect) return;
                              bringAgentWindowToFront(agent.id);
                              setDraggingAgent({
                                id: agent.id,
                                offsetX: event.clientX - rect.left,
                                offsetY: event.clientY - rect.top
                              });
                            }}
                          >
                            <div className="agent-window-identity">
                              <Terminal size={15} />
                              <div>
                                <strong>{agent.name}</strong>
                                <span>{agent.role}</span>
                              </div>
                            </div>
                            <div className="agent-window-controls">
                              <span className="agent-window-state">{agent.provider}/{agent.model}</span>
                              <button
                                title={`Remove ${agent.name} from workspace`}
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={() => removeAgentFromWorkspace(agent.id)}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="agent-window-body">
                            <div className="agent-scope-row">
                              <span>{agent.capabilities.join(', ') || 'General'}</span>
                              <span>{agent.tags?.join(', ') || 'No tags'}</span>
                            </div>
                            <div
                              className="agent-chat-log"
                              ref={(node) => {
                                agentChatRefs.current[agent.id] = node;
                              }}
                            >
                              {manualMessages.length === 0 ? (
                                <div className="agent-empty-state">
                                  <MessageSquare size={16} />
                                  <span>Start talking to {agent.name}.</span>
                                </div>
                              ) : (
                                manualMessages.map(msg => (
                                  <div className={`agent-chat-message ${msg.role === 'assistant' ? 'assistant-note' : msg.role === 'system' ? 'system-note' : 'user-note'}`} key={msg.id}>
                                    <span>{msg.role === 'assistant' ? agent.name : msg.role === 'system' ? 'System' : 'You'}</span>
                                    <p>{msg.content}</p>
                                    {msg.images && msg.images.length > 0 && (
                                      <div className="agent-image-strip">
                                        {msg.images.map((image, imageIndex) => (
                                          <img key={imageIndex} src={image} alt={`Attachment ${imageIndex + 1}`} />
                                        ))}
                                      </div>
                                    )}
                                    <time>{msg.timestamp.toLocaleTimeString()}</time>
                                  </div>
                                ))
                              )}
                              {agentReplying[agent.id] && (
                                <div className="agent-chat-message assistant-note">
                                  <span>{agent.name}</span>
                                  <p>Thinking...</p>
                                </div>
                              )}
                              {manualMessages.length > 0 && (
                                <button
                                  className="agent-jump-latest"
                                  title="Jump to latest message"
                                  onClick={() => scrollAgentChatToLatest(agent.id)}
                                >
                                  <ChevronDown size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                          {(agentImageDrafts[agent.id] || []).length > 0 && (
                            <div className="agent-image-drafts">
                              {(agentImageDrafts[agent.id] || []).map((image, imageIndex) => (
                                <div className="agent-image-draft" key={imageIndex}>
                                  <img src={image} alt={`Draft ${imageIndex + 1}`} />
                                  <button
                                    onClick={() => setAgentImageDrafts(prev => ({
                                      ...prev,
                                      [agent.id]: (prev[agent.id] || []).filter((_, idx) => idx !== imageIndex)
                                    }))}
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="agent-input-row">
                            <label className="agent-attach-button" title="Attach image">
                              <Paperclip size={14} />
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  handleAgentImages(agent.id, e.target.files);
                                  e.currentTarget.value = '';
                                }}
                              />
                            </label>
                            <input
                              value={agentDrafts[agent.name] || ''}
                              onChange={(e) => setAgentDrafts(prev => ({ ...prev, [agent.name]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendAgentMessage(agent);
                              }}
                              placeholder={`Message ${agent.name}`}
                              disabled={agentReplying[agent.id]}
                            />
                            <button onClick={() => handleSendAgentMessage(agent)} title={`Send to ${agent.name}`} disabled={agentReplying[agent.id]}>
                              <Send size={14} />
                            </button>
                          </div>
                          <div
                            className="agent-resize-grip"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              bringAgentWindowToFront(agent.id);
                              setResizingAgent({
                                id: agent.id,
                                startX: event.clientX,
                                startY: event.clientY,
                                startWidth: size.width,
                                startHeight: size.height
                              });
                            }}
                          />
                        </div>
                      );
                    })}
                </div>
                </>
              )}
            </div>
          )}

          {/* B. FILES TAB */}
          {activeTab === 'files' && (
            <div className="files-workspace">
              <div className="file-panel-header files-main-header">
                <div>
                  <span className="form-label">Project Files</span>
                  <strong>{activeProject?.name || 'Project'} · Live workspace tracking</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div className="file-view-toggle">
                    <button className={fileViewMode === 'code' ? 'active' : ''} onClick={() => setFileViewMode('code')}>
                      <Code2 size={14} />
                      Code
                    </button>
                    <button className={fileViewMode === 'preview' ? 'active' : ''} onClick={() => setFileViewMode('preview')}>
                      <Eye size={14} />
                      Preview
                    </button>
                  </div>
                  <button className="btn btn-secondary" onClick={downloadWorkspaceZip} disabled={workspaceFiles.length === 0}>
                    <Download size={14} />
                    <span>Download ZIP</span>
                  </button>
                  <button className="btn btn-secondary" onClick={() => refreshWorkspaceFiles()}>
                    <RefreshCw size={14} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {workspaceFiles.length === 0 ? (
                <div className="empty-agent-stage">
                  <Code2 size={28} />
                  <h3>No files yet</h3>
                  <p>Ask an agent to create or edit files. New files will appear here automatically.</p>
                </div>
              ) : (
                <div className="workspace-file-panel files-vscode-panel">
                  <div className="file-panel-body">
                    <div className="file-tree">
                      {workspaceFiles.map(file => (
                        <button
                          key={file}
                          className={currentWorkspaceFile === file ? 'active' : ''}
                          onClick={() => {
                            setSelectedWorkspaceFile(file);
                            readWorkspaceFile(file).catch(err => console.error('Failed to read workspace file:', err));
                          }}
                        >
                          <FileText size={13} />
                          <span>{file}</span>
                          <small>{workspaceFileMetaByPath[file]?.size || 0}b</small>
                          <span
                            className="file-delete-inline"
                            title={`Delete ${file}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteWorkspaceFile(file);
                            }}
                          >
                            <Trash2 size={12} />
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="code-pane">
                      <div className="code-pane-tabs">
                        <div className="file-editor-title">
                          <span>{fileViewMode === 'preview' ? (previewEntryFile || 'Preview') : (currentWorkspaceFileName || 'No file selected')}</span>
                          {fileViewMode === 'code' && currentWorkspaceFile && (
                            <input
                              className="file-rename-input"
                              value={renameFilePath}
                              onChange={(e) => setRenameFilePath(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameWorkspaceFile();
                              }}
                              title="Rename file path"
                            />
                          )}
                        </div>
                        <span>
                          {fileViewMode === 'preview'
                            ? previewEntryFile ? `Live preview · ${previewEntryFile}` : 'No HTML entry file found'
                            : `${currentWorkspaceFile || 'workspace'}${currentWorkspaceFileMeta?.modifiedAt ? ` · ${new Date(currentWorkspaceFileMeta.modifiedAt).toLocaleTimeString()}` : ''}`}
                        </span>
                        {fileViewMode === 'code' && currentWorkspaceFile && (
                          <div className="file-editor-actions">
                            <button className="btn btn-secondary" onClick={handleRenameWorkspaceFile} disabled={!renameFilePath.trim() || renameFilePath === currentWorkspaceFile || fileSaveStatus === 'saving'}>
                              Rename
                            </button>
                            <button className="btn btn-secondary danger" onClick={() => handleDeleteWorkspaceFile()} disabled={fileSaveStatus === 'saving'}>
                              <Trash2 size={13} />
                              Delete
                            </button>
                            <button className="btn" onClick={handleSaveWorkspaceEditor} disabled={fileSaveStatus === 'saving'}>
                              {fileSaveStatus === 'saving' ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        )}
                      </div>
                      {fileViewMode === 'preview' ? (
                        previewUrl ? (
                          <iframe className="workspace-preview-frame" src={previewUrl} title="Workspace live preview" />
                        ) : (
                          <div className="workspace-preview-empty">
                            <Eye size={24} />
                            <h3>No HTML preview found</h3>
                            <p>Create an `index.html` file or select any `.html` file to preview it live.</p>
                          </div>
                        )
                      ) : (
                        <div className="file-editor-wrap">
                          {fileSaveError && <div className="auth-error">{fileSaveError}</div>}
                          {fileSaveStatus === 'saved' && <div className="file-save-note">Saved</div>}
                          <textarea
                            className="file-code-editor"
                            value={fileEditorContent}
                            onChange={(e) => {
                              setFileEditorContent(e.target.value);
                              setFileSaveStatus('idle');
                              setFileSaveError('');
                            }}
                            spellCheck={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. TEAM BUILDER TAB */}
          {activeTab === 'teams' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                {/* Team Creator */}
                <div className="card">
                  <h3 style={{ fontSize: '14px', marginBottom: '16px', fontWeight: 700 }}>Group Agents into Engineering Teams</h3>
                  <form onSubmit={handleCreateTeamSubmit}>
                    <div className="form-group">
                      <label className="form-label">Team Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Frontend Squad"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-input"
                        placeholder="Purpose of this squad..."
                        value={newTeamDesc}
                        onChange={(e) => setNewTeamDesc(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Select Members</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-app)', padding: '10px', borderRadius: '6px' }}>
                        {agents.map(a => (
                          <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedTeamMembers.includes(a.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTeamMembers(prev => [...prev, a.id]);
                                } else {
                                  setSelectedTeamMembers(prev => prev.filter(id => id !== a.id));
                                }
                              }}
                            />
                            <span>{a.name} ({a.role})</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Workflow Architecture</label>
                      <select
                        className="form-select"
                        value={newTeamWorkflow}
                        onChange={(e: any) => setNewTeamWorkflow(e.target.value)}
                      >
                        <option value="sequential">Sequential Pipeline</option>
                        <option value="hierarchical">Hierarchical Supervisor</option>
                        <option value="mesh">Decentralized Mesh</option>
                      </select>
                    </div>

                    <button type="submit" className="btn" style={{ marginTop: '10px' }}>
                      <Plus size={14} />
                      <span>Assemble Team</span>
                    </button>
                  </form>
                </div>

                {/* Team Registry list */}
                <div>
                  <h4 className="form-label" style={{ marginBottom: '10px' }}>Configured Teams ({teams.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {teams.map(t => (
                      <div className="card" key={t.id} style={{ margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '13px', color: '#fff' }}>{t.name}</strong>
                          <button style={{ color: 'var(--text-error)' }} onClick={() => deleteTeam(t.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>{t.description}</p>
                        
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {t.members.map(mid => {
                            const found = agents.find(a => a.id === mid) || templates.find(a => a.id === mid);
                            return (
                              <span className="badge badge-primary" key={mid}>
                                👤 {found?.name || mid}
                              </span>
                            );
                          })}
                        </div>
                        <span className="badge" style={{ display: 'inline-block' }}>Workflow: {t.workflow}</span>
                        <button
                          className="btn btn-secondary"
                          style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
                          onClick={() => {
                            const realMemberIds = t.members.filter(memberId => agents.some(agent => agent.id === memberId));
                            updateProjectAgentIds(prev => [...prev, ...realMemberIds]);
                            setActiveTab('mission_control');
                          }}
                        >
                          <Users size={13} />
                          Use Team in Workspace
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* C. AGENT BUILDER TAB */}
          {activeTab === 'agents' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
              <div className="card">
                <h3 style={{ fontSize: '14px', marginBottom: '16px', fontWeight: 700 }}>Register New Workspace Agent</h3>
                <form onSubmit={handleCreateAgentSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Agent Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Database Architect"
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role Title</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. DBA Auditor"
                        value={newAgentRole}
                        onChange={(e) => setNewAgentRole(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Capabilities (comma separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newAgentCapabilities}
                      onChange={(e) => setNewAgentCapabilities(e.target.value)}
                      placeholder="React, SQL, DevOps"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">System Guidelines / Prompt</label>
                    <textarea
                      className="form-textarea"
                      placeholder="State rules, priorities, and boundaries for the agent..."
                      value={newAgentPrompt}
                      onChange={(e) => setNewAgentPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">LLM Provider</label>
                      <select
                        className="form-select"
                        value={newAgentProvider}
                        onChange={(e) => setNewAgentProvider(e.target.value)}
                      >
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="openai">OpenAI (GPT)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Model Endpoint</label>
                      <select
                        className="form-select"
                        value={newAgentModel}
                        onChange={(e) => setNewAgentModel(e.target.value)}
                      >
                        {newAgentProvider === 'anthropic' ? (
                          <>
                            <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                            <option value="claude-3-opus">claude-3-opus</option>
                          </>
                        ) : (
                          <>
                            <option value="gpt-4o">gpt-4o</option>
                            <option value="o1-preview">o1-preview</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Temperature: {newAgentTemp}</label>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.1"
                        className="form-input"
                        value={newAgentTemp}
                        onChange={(e) => setNewAgentTemp(parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Budget Limit ($)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={newAgentBudget}
                        onChange={(e) => setNewAgentBudget(parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Permissions</label>
                      <div style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {['read_file', 'write_file', 'execute_command'].map(p => (
                          <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(p)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedPermissions(prev => [...prev, p]);
                                else setSelectedPermissions(prev => prev.filter(x => x !== p));
                              }}
                            />
                            <span>{p}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tools</label>
                      <div style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {['file_reader', 'file_writer', 'terminal_execute', 'web_search'].map(t => (
                          <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedTools.includes(t)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedTools(prev => [...prev, t]);
                                else setSelectedTools(prev => prev.filter(x => x !== t));
                              }}
                            />
                            <span>{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn" style={{ marginTop: '10px' }}>
                    <Plus size={14} />
                    <span>Create Agent</span>
                  </button>
                </form>
              </div>

              <div>
                <h4 className="form-label" style={{ marginBottom: '10px' }}>Active Agents ({agents.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {agents.map(a => (
                    <div
                      className={`card ${selectedAgentId === a.id ? 'active' : ''}`}
                      key={a.id}
                      onClick={() => setSelectedAgentId(a.id)}
                      style={{ cursor: 'pointer', margin: 0 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="flow-avatar">{a.name[0]}</div>
                          <div>
                            <strong style={{ fontSize: '12px', color: '#fff', display: 'block' }}>{a.name}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.role}</span>
                          </div>
                        </div>
                        <button
                          style={{ color: 'var(--text-error)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAgent(a.id);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* D. MISSION HISTORY TAB */}
          {activeTab === 'history' && (
            <div>
              <div className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search goals..."
                  style={{ border: 'none', background: 'transparent', padding: 0 }}
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                />
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['all', 'success', 'failed', 'running', 'idle'].map(status => (
                    <button
                      key={status}
                      className={`btn btn-secondary ${historyFilterStatus === status ? 'active' : ''}`}
                      style={{ padding: '4px 10px', fontSize: '11px', textTransform: 'capitalize' }}
                      onClick={() => setHistoryFilterStatus(status as any)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '13px' }}>Recent Agent Activity</strong>
                  <span className="badge">{agentActivityHistory.length} messages</span>
                </div>
                {agentActivityHistory.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No agent chat activity yet. Messages and tool results will appear here after you talk to agents.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflow: 'auto' }}>
                    {agentActivityHistory.slice(0, 20).map(({ agentName, message }) => (
                      <div key={`${agentName}_${message.id}`} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', background: 'var(--bg-app)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>{message.role === 'user' ? 'You' : agentName}</span>
                          <span>{message.timestamp.toLocaleString()}</span>
                        </div>
                        <p style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{message.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredMissions.map(m => (
                  <div className="card" key={m.id} style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <strong style={{ fontSize: '14px', color: '#fff' }}>{m.goal}</strong>
                          <span className={`status-sleeping flow-node-status status-${m.status}`} style={{ position: 'static' }}>
                            {m.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>ID: <strong>{m.id}</strong></span>
                          <span>Duration: <strong>{((m.durationMs || 0) / 1000).toFixed(1)}s</strong></span>
                          <span>Cost: <strong>${(m.cost || 0).toFixed(4)}</strong></span>
                          <span>Created: <strong>{m.createdAt.toLocaleTimeString()}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => {
                            replayMission(m.id);
                            setActiveTab('mission_control');
                          }}
                        >
                          <RefreshCw size={12} />
                          <span>Replay</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => duplicateMission(m.id)}
                        >
                          <Copy size={12} />
                          <span>Duplicate</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => {
                            setEditingMissionId(m.id);
                            setEditingMissionGoal(m.goal);
                          }}
                        >
                          <span>Rename</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => archiveMission(m.id)}
                        >
                          <span>Archive</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ color: 'var(--text-error)', borderColor: 'var(--text-error)', padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => deleteMission(m.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredMissions.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No missions found matching query.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* E. WORKSPACE MEMORY TAB */}
          {activeTab === 'memory' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '8px' }}>
                <button
                  className={`btn btn-secondary ${selectedMemoryTab === 'files' ? 'active' : ''}`}
                  onClick={() => setSelectedMemoryTab('files')}
                >
                  <Folder size={14} />
                  <span>Workspace Files ({workspaceFiles.length})</span>
                </button>
                <button
                  className={`btn btn-secondary ${selectedMemoryTab === 'knowledge' ? 'active' : ''}`}
                  onClick={() => setSelectedMemoryTab('knowledge')}
                >
                  <BookOpen size={14} />
                  <span>System Guidelines ({knowledge.length})</span>
                </button>
                <button
                  className={`btn btn-secondary ${selectedMemoryTab === 'agent_memory' ? 'active' : ''}`}
                  onClick={() => setSelectedMemoryTab('agent_memory')}
                >
                  <Database size={14} />
                  <span>Supermemory</span>
                </button>
                <button
                  className={`btn btn-secondary ${selectedMemoryTab === 'timeline' ? 'active' : ''}`}
                  onClick={() => setSelectedMemoryTab('timeline')}
                >
                  <Clock size={14} />
                  <span>Trace Timeline Logs ({activeMission?.timelineEvents.length || 0})</span>
                </button>
              </div>

              {/* FILES INSIGHT */}
              {selectedMemoryTab === 'files' && (
                <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px' }}>
                  <div className="card" style={{ padding: '12px' }}>
                    <span className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Live Project Files</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {workspaceFiles.map(f => (
                        <div
                          key={f}
                          className={`menu-item ${selectedMemoryFile === f ? 'active' : ''}`}
                          style={{ margin: 0, padding: '8px 12px' }}
                          onClick={() => {
                            setSelectedMemoryFile(f);
                            readWorkspaceFile(f).catch(err => console.error('Failed to read memory file:', err));
                          }}
                        >
                          <FileText size={13} /> {f}
                        </div>
                      ))}
                      {workspaceFiles.length === 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px' }}>No workspace files yet. Ask an agent to create one.</span>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ margin: 0 }}>
                    <h4 style={{ fontSize: '13px', marginBottom: '10px', color: '#fff' }}>{selectedMemoryFile || 'Select a workspace file'}</h4>
                    {selectedMemoryFile ? (
                      <pre style={{ background: '#050505', padding: '16px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
                        <code>{workspaceFileCache[selectedMemoryFile] || 'Loading file content...'}</code>
                      </pre>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '20px', textAlign: 'center' }}>
                        Select a file on the left to inspect the real workspace content.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* KNOWLEDGE INSIGHT */}
              {selectedMemoryTab === 'knowledge' && (
                <div>
                  <div className="card">
                    <h4 style={{ fontSize: '13px', marginBottom: '12px' }}>Add Knowledge Context Document</h4>
                    <form onSubmit={handleCreateKnowledgeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Document Title (e.g. PostgreSQL Config)"
                          value={newKTitle}
                          onChange={(e) => setNewKTitle(e.target.value)}
                          required
                        />
                        <select
                          className="form-select"
                          value={newKType}
                          onChange={(e: any) => setNewKType(e.target.value)}
                        >
                          <option value="markdown">Markdown File</option>
                          <option value="note">Developer Note</option>
                          <option value="pdf">External Specifications PDF</option>
                          <option value="git">Git Commit Logs</option>
                        </select>
                      </div>
                      <textarea
                        className="form-textarea"
                        placeholder="Paste document content or instructions..."
                        value={newKContent}
                        onChange={(e) => setNewKContent(e.target.value)}
                        rows={2}
                      />
                      <button type="submit" className="btn" style={{ alignSelf: 'flex-start' }}>
                        <Plus size={14} /> Add to Knowledge
                      </button>
                    </form>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {knowledge.map(k => (
                      <div className="card" key={k.id} style={{ margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '13px', color: '#fff' }}>📝 {k.title}</strong>
                          <button style={{ color: 'var(--text-error)' }} onClick={() => deleteKnowledge(k.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <span className="badge" style={{ marginBottom: '8px', display: 'inline-block' }}>Type: {k.type}</span>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{k.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AGENT MEMORY BANKS */}
              {selectedMemoryTab === 'agent_memory' && (
                <div>
                  <form className="card" onSubmit={handleMemorySearch} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Database size={16} color="var(--text-primary)" />
                    <input
                      className="form-input"
                      value={memorySearchQuery}
                      onChange={(e) => setMemorySearchQuery(e.target.value)}
                      placeholder="Search long-term memory for this workspace..."
                      style={{ flex: 1 }}
                    />
                    <button className="btn" type="submit" disabled={memoryStatus === 'checking'}>
                      {memoryStatus === 'checking' ? 'Searching...' : 'Search'}
                    </button>
                  </form>

                  <div className="card" style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <strong style={{ fontSize: '13px' }}>Supermemory Connection</strong>
                      <span className={`badge ${memoryStatus === 'connected' ? 'badge-primary' : ''}`}>
                        {memoryStatus === 'idle' ? 'Ready' : memoryStatus}
                      </span>
                    </div>
                    {memoryError && <div className="auth-error">{memoryError}</div>}
                    {memorySearchResults.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Agent conversations are saved here after replies. Use search to inspect what long-term memory returns.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {memorySearchResults.map((result, index) => (
                          <pre key={index} style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', fontSize: '12px', maxHeight: '180px', overflow: 'auto' }}>
                            {result}
                          </pre>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TIMELINE */}
              {selectedMemoryTab === 'timeline' && (
                <div className="card">
                  <h4 style={{ fontSize: '13px', marginBottom: '12px' }}>Workspace Event Trace Logs</h4>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#050505', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    {activeMission?.timelineEvents.map((ev, idx) => (
                      <div key={idx} style={{ marginBottom: '8px', borderBottom: '1px solid #111', paddingBottom: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                        <span style={{ color: 'var(--text-success)' }}>[{ev.timestamp.toLocaleTimeString()}]</span>{' '}
                        <span style={{ color: 'var(--text-primary)' }}>&gt;</span> {ev.title} (Type: {ev.type})
                      </div>
                    )) || <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No logs loaded. Run a mission first.</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* F. DECISION LOG TAB */}
          {activeTab === 'decisions' && (
            <div>
              <form className="card" onSubmit={handleCreateDecisionSubmit} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Shield size={16} color="var(--text-primary)" />
                  <strong style={{ fontSize: '13px' }}>Record Workspace Decision</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr auto', gap: '10px', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    value={newDecisionTitle}
                    onChange={(e) => setNewDecisionTitle(e.target.value)}
                    placeholder="Decision title"
                    required
                  />
                  <input
                    className="form-input"
                    value={newDecisionReason}
                    onChange={(e) => setNewDecisionReason(e.target.value)}
                    placeholder="Why this decision was made"
                  />
                  <button className="btn" type="submit">
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {decisions.map(d => (
                  <div className="card" key={d.id} style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#fff' }}>{d.title}</strong>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="badge badge-primary">Approved By: {d.approvedBy}</span>
                        <button style={{ color: 'var(--text-error)' }} onClick={() => deleteDecision(d.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>{d.reason}</p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Proposer: <strong>{d.madeBy}</strong></span>
                      <span>Log ID: <strong>{d.id}</strong></span>
                      <span>Recorded: <strong>{d.timestamp.toLocaleTimeString()}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* G. PROVIDERS TAB */}
          {activeTab === 'providers' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', margin: 0 }}>Provider Keys & Health Metrics</h3>
                <button className="btn btn-secondary" onClick={handleProviderTest} disabled={providerTestStatus === 'testing'}>
                  <Activity size={14} />
                  {providerTestStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              
              <div className="form-group">
                <label className="form-label">Default API Key</label>
                <input
                  type="password"
                  className="form-input"
                  value={providerSettings.apiKey}
                  onChange={(e) => updateProviderSettings({ apiKey: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Endpoint base URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={providerSettings.endpoint}
                  onChange={(e) => updateProviderSettings({ endpoint: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Model Fallback Rule</label>
                <input
                  type="text"
                  className="form-input"
                  value={providerSettings.fallbackModel}
                  onChange={(e) => updateProviderSettings({ fallbackModel: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">OpenRouter API Key</label>
                <input
                  type="password"
                  className="form-input"
                  value={providerSettings.openRouterApiKey}
                  onChange={(e) => updateProviderSettings({ openRouterApiKey: e.target.value })}
                  placeholder="Uses app-level OpenRouter key when configured"
                />
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">OpenRouter Router Model</label>
                <input
                  type="text"
                  className="form-input"
                  value={providerSettings.openRouterModel}
                  onChange={(e) => updateProviderSettings({ openRouterModel: e.target.value })}
                />
              </div>

              <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Real-time Gateway Status</h4>
                <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
                  <div>Status: <strong style={{ color: providerTestStatus === 'error' ? 'var(--text-error)' : 'var(--text-success)' }}>{providerTestStatus === 'idle' ? providerSettings.health.status : providerTestStatus}</strong></div>
                  <div>Avg Latency: <strong>{providerSettings.health.latencyMs} ms</strong></div>
                  <div>Circuit Breaker: <strong>Inactive</strong></div>
                  <div>Fallback: <strong>{providerSettings.openRouterModel}</strong></div>
                </div>
                {providerTestMessage && (
                  <p style={{ marginTop: '10px', color: providerTestStatus === 'error' ? 'var(--text-error)' : 'var(--text-muted)', fontSize: '12px' }}>
                    {providerTestMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* H. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="card">
              <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>Application Settings</h3>
              <div className="form-group">
                <label className="form-label">Theme Mode</label>
                <select
                  className="form-select"
                  style={{ background: 'var(--bg-app)' }}
                  value={themeMode}
                  onChange={(e) => setThemeMode(e.target.value as 'dark' | 'light')}
                >
                  <option value="dark">Dark Theme</option>
                  <option value="light">Light Theme</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Telemetry Status</label>
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={telemetryEnabled}
                    onChange={(e) => setTelemetryEnabled(e.target.checked)}
                  />
                  <span>{telemetryEnabled ? 'Anonymous analytics allowed' : 'Anonymous analytics disabled'}</span>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Cloud Persistence</label>
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <span className="badge">{persistenceStatus}</span>
                  <span>{persistenceError || 'Workspace state is saved after changes when Supabase table exists.'}</span>
                </div>
              </div>

              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Keyboard Shortcuts</h4>
                <ul style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><kbd style={{ background: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>Ctrl+K</kbd> / <kbd style={{ background: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>Cmd+K</kbd> - Open Command Palette</li>
                  <li><kbd style={{ background: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>Esc</kbd> - Close Modal panels</li>
                </ul>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 3. Right Inspector panel (Conditional for Agent Builder) */}
      {activeTab === 'agents' && (
        <aside className="inspector">
          <div className="inspector-title">Agent Profile Inspector</div>
          {activeAgent ? (
            <div>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{activeAgent.name}</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activeAgent.role}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>PROVIDER & MODEL</span>
                  <strong>{activeAgent.provider.toUpperCase()} ({activeAgent.model})</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>TEMPERATURE</span>
                  <strong>{activeAgent.temperature}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>BUDGET LIMIT</span>
                  <strong>${activeAgent.budgetLimit}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>CURRENT SPEND</span>
                  <strong>${activeAgent.currentSpend.toFixed(4)}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>SYSTEM INSTRUCTIONS</span>
                  <p style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {activeAgent.systemPrompt}
                  </p>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>CAPABILITY TAGS</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {activeAgent.capabilities.map((c: string) => (
                      <span key={c} style={{ background: 'var(--bg-active)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Select an agent to inspect details.</div>
          )}
        </aside>
      )}

      {/* 4. Bottom Status Panel */}
      <footer className="bottom-panel">
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Workspace: <strong>{activeProject?.name}</strong></span>
          <span>Active Agents: <strong>{agents.length}</strong></span>
        </div>
        <div>
          <span>Status: <strong>Connected</strong></span>
        </div>
      </footer>

      {/* 5. Command Palette Modal */}
      {commandPaletteOpen && (
        <div className="modal-overlay" onClick={() => setCommandPaletteOpen(false)}>
          <div className="command-palette" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="command-input"
              placeholder="Search workspaces, actions, and settings..."
              autoFocus
              value={paletteQuery}
              onChange={(e) => setPaletteQuery(e.target.value)}
            />
            <div className="command-list">
              <div className="command-item" onClick={() => handlePaletteSelect('mission_control')}>
                <span>Go to Workspace</span>
                <kbd style={{ background: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>1</kbd>
              </div>
              <div className="command-item" onClick={() => handlePaletteSelect('files')}>
                <span>Go to Files</span>
                <kbd style={{ background: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>2</kbd>
              </div>
              <div className="command-item" onClick={() => handlePaletteSelect('teams')}>
                <span>Go to Teams</span>
                <kbd style={{ background: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>3</kbd>
              </div>
              <div className="command-item" onClick={() => handlePaletteSelect('agents')}>
                <span>Go to Agents</span>
                <kbd style={{ background: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>4</kbd>
              </div>
              <div className="command-item" onClick={() => handlePaletteSelect('history')}>
                <span>Go to History</span>
                <kbd style={{ background: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>5</kbd>
              </div>
              <div className="command-item" onClick={() => handlePaletteSelect('memory')}>
                <span>Go to Memory</span>
                <kbd style={{ background: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>6</kbd>
              </div>
              <div className="command-item" onClick={() => handlePaletteSelect('decisions')}>
                <span>Go to Decisions</span>
                <kbd style={{ background: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>7</kbd>
              </div>
              <div className="command-item" onClick={() => handlePaletteSelect('providers')}>
                <span>Go to Providers</span>
                <kbd style={{ background: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>8</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {agentModalOpen && (
        <div className="modal-overlay" onClick={() => setAgentModalOpen(false)}>
          <div className="agent-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title"><Bot size={16} /> Add Agent</span>
              <button className="btn btn-secondary" onClick={() => setAgentModalOpen(false)}>Close</button>
            </div>

            <div className="agent-create-tabs">
              <button className={agentCreateMode === 'custom' ? 'active' : ''} onClick={() => setAgentCreateMode('custom')}>Create Custom</button>
              <button className={agentCreateMode === 'prebuilt' ? 'active' : ''} onClick={() => setAgentCreateMode('prebuilt')}>Use Prebuilt</button>
            </div>

            {agentCreateMode === 'custom' ? (
              <form onSubmit={handleCreateAgentSubmit} className="agent-create-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Agent Name</label>
                    <input className="form-input" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} placeholder="Lucy" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="form-input" value={newAgentRole} onChange={(e) => setNewAgentRole(e.target.value)} placeholder="Frontend Engineer" />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Skills</label>
                    <input className="form-input" value={newAgentCapabilities} onChange={(e) => setNewAgentCapabilities(e.target.value)} placeholder="React, CSS, UI, TypeScript" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags</label>
                    <input className="form-input" value={newAgentTags} onChange={(e) => setNewAgentTags(e.target.value)} placeholder="frontend, landing-page" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">System Prompt / Behavior</label>
                  <textarea className="form-textarea" rows={3} value={newAgentPrompt} onChange={(e) => setNewAgentPrompt(e.target.value)} placeholder="Define what this agent should do and what it should avoid." />
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Provider</label>
                    <select className="form-select" value={newAgentProvider} onChange={(e) => setNewAgentProvider(e.target.value)}>
                      <option value="openrouter">OpenRouter</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="groq">Groq</option>
                      <option value="ollama">Ollama</option>
                      <option value="openai-compatible">OpenAI Compatible</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <input className="form-input" value={newAgentModel} onChange={(e) => setNewAgentModel(e.target.value)} placeholder="anthropic/claude-sonnet-4.6" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Budget</label>
                    <input type="number" className="form-input" value={newAgentBudget} onChange={(e) => setNewAgentBudget(Number(e.target.value))} />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Custom API Key</label>
                    <input type="password" className="form-input" value={newAgentApiKey} onChange={(e) => setNewAgentApiKey(e.target.value)} placeholder="Optional per-agent key" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Base URL</label>
                    <input className="form-input" value={newAgentBaseUrl} onChange={(e) => setNewAgentBaseUrl(e.target.value)} placeholder="Optional custom endpoint" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">MCP Servers / Connectors</label>
                  <textarea className="form-textarea" rows={2} value={newAgentMcpServers} onChange={(e) => setNewAgentMcpServers(e.target.value)} placeholder="One MCP server or connector per line, e.g. supabase, github, filesystem" />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Tools</label>
                    <div className="option-row-wrap">
                      {['file_reader', 'file_writer', 'terminal_execute', 'web_search'].map(t => (
                        <label key={t}><input type="checkbox" checked={selectedTools.includes(t)} onChange={(e) => setSelectedTools(prev => e.target.checked ? [...prev, t] : prev.filter(x => x !== t))} /> {t}</label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Permissions</label>
                    <div className="option-row-wrap">
                      {['read_file', 'write_file', 'execute_command', 'require_approval'].map(p => (
                        <label key={p}><input type="checkbox" checked={selectedPermissions.includes(p)} onChange={(e) => setSelectedPermissions(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))} /> {p}</label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setAgentModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn">Add Agent to Project</button>
                </div>
              </form>
            ) : (
              <div className="prebuilt-agent-grid">
                {templates.map(t => (
                  <button key={t.id} className="prebuilt-agent-card" onClick={() => handleUsePrebuiltAgent(t.id)}>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                    <p>{t.description}</p>
                    <small>{t.provider}/{t.model}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Rename Mission Modal */}
      {editingMissionId && (
        <div className="modal-overlay" onClick={() => setEditingMissionId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '14px', marginBottom: '16px', fontWeight: 700 }}>Rename Mission Goal</h3>
            <form onSubmit={handleRenameMissionSubmit}>
              <div className="form-group">
                <label className="form-label">Mission Goal</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingMissionGoal}
                  onChange={(e) => setEditingMissionGoal(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingMissionId(null)}>Cancel</button>
                <button type="submit" className="btn">Save Rename</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
