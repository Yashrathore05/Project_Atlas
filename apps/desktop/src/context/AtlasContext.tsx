import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AgentRegistry, AgentProfile } from '@atlas/agent-registry';
import { CapabilityEngine } from '@atlas/capability-engine';
import { MessageStore, AgentMessage } from '@atlas/agent-communication';
import { ContextEngine } from '@atlas/context-engine';
import { TaskOrchestrator, Plan } from '@atlas/task-orchestrator';
import { ProviderRouter } from '@atlas/provider-router';
import { ModelRegistry } from '@atlas/model-registry';
import { ProviderRegistry } from '@atlas/provider-registry';
import { ProviderHealth } from '@atlas/provider-health';
import { ProviderCache } from '@atlas/provider-cache';
import { ConsoleLogger } from '@atlas/logger';
import { InMemoryMetrics } from '@atlas/metrics';
import { AnthropicAdapter, GroqAdapter, OpenaiAdapter, OpenRouterAdapter } from '@atlas/provider-adapters';
import { TauriToolExecutor } from '../tauri-tool-executor';
import { supabase, isSupabaseConfigured } from '../supabase-client';
import type { Session, User } from '@supabase/supabase-js';

// Core interfaces for React State
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: string[]; // Agent IDs
  workflow: 'sequential' | 'hierarchical' | 'mesh';
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'markdown' | 'note' | 'pdf' | 'git';
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  circuitBreakerActive: boolean;
}

export interface Decision {
  id: string;
  title: string;
  reason: string;
  madeBy: string;
  approvedBy: string;
  timestamp: Date;
  missionId?: string;
}

export interface MissionEvent {
  id: string;
  timestamp: Date;
  title: string;
  agent?: string;
  model?: string;
  details?: string;
  type: 'planner' | 'agent' | 'tool' | 'memory' | 'security' | 'system' | 'completed';
}

export interface CollaborationMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

export interface MissionMetrics {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  currentStep: string;
  currentModel: string;
  currentProvider: string;
  stepsCompleted: number;
  totalSteps: number;
  runtimeMs: number;
}

export interface Mission {
  id: string;
  goal: string;
  status: 'idle' | 'planning' | 'running' | 'paused' | 'success' | 'failed';
  teamId: string;
  createdAt: Date;
  completedAt?: Date;
  durationMs?: number;
  cost?: number;
  filesChanged?: string[];
  decisionsCount?: number;
  risks?: string[];
  recommendations?: string[];
  lessonsLearned?: string[];
  timelineEvents: MissionEvent[];
  collaborationFeed: CollaborationMessage[];
  agentStatus: Record<string, 'Waiting' | 'Planning' | 'Working' | 'Sleeping' | 'Completed' | 'Error'>;
  pendingApproval?: {
    taskId: string;
    agentName: string;
    action: string;
  } | null;
  metrics: MissionMetrics;
}

interface AtlasContextType {
  user: User | null;
  session: Session | null;
  authLoading: boolean;
  persistenceStatus: 'local' | 'loading' | 'synced' | 'saving' | 'error';
  persistenceError: string | null;
  isSupabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  createProject: (name: string, description: string) => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  archiveProject: (id: string) => void;

  agents: AgentProfile[];
  templates: AgentProfile[];
  createAgent: (agent: Omit<AgentProfile, 'id' | 'version' | 'status' | 'statistics'>) => Promise<AgentProfile>;
  updateAgent: (id: string, updates: Partial<AgentProfile>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  cloneAgent: (id: string, name: string) => Promise<void>;
  projectAgentIdsByProject: Record<string, string[]>;
  setProjectAgentIdsForProject: (projectId: string, ids: string[]) => void;

  teams: Team[];
  createTeam: (name: string, description: string, members: string[], workflow?: 'sequential' | 'hierarchical' | 'mesh') => void;
  deleteTeam: (id: string) => void;

  plans: Plan[];
  activePlan: Plan | null;
  executeGoal: (goal: string, mode: string) => Promise<void>;
  resolveApproval: (taskId: string, approved: boolean) => void;
  pausePlanExecution: () => void;
  resumePlanExecution: () => void;
  cancelPlanExecution: () => void;

  messages: AgentMessage[];
  timeline: string[];
  systemLogs: string[];

  // Provider config
  providerSettings: {
    apiKey: string;
    endpoint: string;
    fallbackModel: string;
    openRouterApiKey: string;
    openRouterModel: string;
    budgetLimit: number;
    health: SystemHealth;
  };
  updateProviderSettings: (updates: any) => void;

  // Knowledge
  knowledge: KnowledgeItem[];
  addKnowledge: (title: string, content: string, type: 'markdown' | 'note' | 'pdf' | 'git') => void;
  deleteKnowledge: (id: string) => void;

  // Mission MVP States
  missions: Mission[];
  activeMissionId: string | null;
  setActiveMissionId: (id: string | null) => void;
  decisions: Decision[];
  addDecision: (title: string, reason: string, madeBy?: string, approvedBy?: string) => void;
  deleteDecision: (id: string) => void;
  createMission: (goal: string, teamId: string) => Promise<void>;
  replayMission: (id: string) => Promise<void>;
  duplicateMission: (id: string) => void;
  deleteMission: (id: string) => void;
  renameMission: (id: string, name: string) => void;
  archiveMission: (id: string) => void;
}

const AtlasContext = createContext<AtlasContextType | undefined>(undefined);

type PersistedAtlasState = {
  projects?: Array<Omit<Project, 'createdAt'> & { createdAt: string }>;
  activeProjectId?: string;
  agents?: AgentProfile[];
  teams?: Team[];
  knowledge?: KnowledgeItem[];
  providerSettings?: AtlasContextType['providerSettings'];
  missions?: Array<Omit<Mission, 'createdAt' | 'completedAt' | 'timelineEvents' | 'collaborationFeed'> & {
    createdAt: string;
    completedAt?: string;
    timelineEvents: Array<Omit<MissionEvent, 'timestamp'> & { timestamp: string }>;
    collaborationFeed: Array<Omit<CollaborationMessage, 'timestamp'> & { timestamp: string }>;
  }>;
  decisions?: Array<Omit<Decision, 'timestamp'> & { timestamp: string }>;
  projectAgentIdsByProject?: Record<string, string[]>;
};

const reviveProject = (project: NonNullable<PersistedAtlasState['projects']>[number]): Project => ({
  ...project,
  createdAt: new Date(project.createdAt)
});

const reviveMission = (mission: NonNullable<PersistedAtlasState['missions']>[number]): Mission => ({
  ...mission,
  createdAt: new Date(mission.createdAt),
  completedAt: mission.completedAt ? new Date(mission.completedAt) : undefined,
  timelineEvents: (mission.timelineEvents || []).map(event => ({
    ...event,
    timestamp: new Date(event.timestamp)
  })),
  collaborationFeed: (mission.collaborationFeed || []).map(message => ({
    ...message,
    timestamp: new Date(message.timestamp)
  }))
});

const reviveDecision = (decision: NonNullable<PersistedAtlasState['decisions']>[number]): Decision => ({
  ...decision,
  timestamp: new Date(decision.timestamp)
});

export const AtlasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logger] = useState(() => new ConsoleLogger({ minLevel: 'info', isJsonMode: false }));
  const [metrics] = useState(() => new InMemoryMetrics());
  const [modelRegistry] = useState(() => new ModelRegistry());

  const activeMissionIdRef = useRef<string | null>(null);
  const missionEventType = (eventName: string): MissionEvent['type'] => {
    if (eventName.includes('Approval')) return 'security';
    if (eventName.includes('Provider') || eventName.includes('Model')) return 'system';
    if (eventName.includes('Task')) return 'agent';
    if (eventName.includes('Plan')) return 'planner';
    if (eventName.includes('Finished')) return 'completed';
    return 'system';
  };

  const eventTitle = (event: any): string => {
    const payload = event.payload || {};
    if (event.name === 'TaskStarted') return `Started: ${payload.title}`;
    if (event.name === 'TaskAssigned') return `Assigned ${payload.taskId} to ${payload.agentName}`;
    if (event.name === 'TaskCompleted') return `Completed: ${payload.title}`;
    if (event.name === 'TaskFailed') return `Failed: ${payload.title} (${payload.error})`;
    if (event.name === 'TaskRecovered') return `Recovered: ${payload.title}`;
    if (event.name === 'PlanFinished') return `Plan finished with status: ${payload.status}`;
    if (event.name === 'ApprovalRequested') return `Approval requested: ${payload.toolName || payload.action || payload.taskId}`;
    if (event.name === 'ModelCalled') return `Model call completed: ${payload.model}`;
    if (event.name === 'ProviderRequestFailed') return `Provider failed: ${payload.error}`;
    return event.name;
  };

  const eventMessage = (event: any): CollaborationMessage | null => {
    const payload = event.payload || {};
    if (event.name === 'TaskStarted') {
      return { id: `msg_${Date.now()}_${Math.random()}`, sender: 'Orchestrator', content: payload.title, timestamp: new Date() };
    }
    if (event.name === 'TaskAssigned') {
      return { id: `msg_${Date.now()}_${Math.random()}`, sender: 'Orchestrator', content: `${payload.agentName} is handling ${payload.taskId}.`, timestamp: new Date() };
    }
    if (event.name === 'TaskCompleted') {
      return { id: `msg_${Date.now()}_${Math.random()}`, sender: payload.agentId || 'Agent', content: payload.output || 'Task completed.', timestamp: new Date() };
    }
    if (event.name === 'TaskFailed') {
      return { id: `msg_${Date.now()}_${Math.random()}`, sender: 'Runtime', content: payload.error || 'Task failed.', timestamp: new Date() };
    }
    return null;
  };

  const mockEventBus = {
    publish: async (event: any) => {
      setTimeline(prev => [...prev, `${event.name}: ${JSON.stringify(event.payload)}`]);
      setSystemLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${event.name}: ${JSON.stringify(event.payload)}`]);

      const missionId = event.payload?.planId || activeMissionIdRef.current;
      if (!missionId) return;

      const message = eventMessage(event);
      setMissions(prev => prev.map(m => {
        if (m.id !== missionId) return m;

        const nextStatus: Mission['status'] =
          event.name === 'PlanFinished'
            ? event.payload.status === 'completed' ? 'success' : 'failed'
            : event.name === 'ApprovalRequested'
              ? 'paused'
              : event.name === 'TaskFailed'
                ? 'running'
                : m.status === 'planning' ? 'running' : m.status;

        const promptTokens = event.payload?.tokens?.promptTokens || 0;
        const completionTokens = event.payload?.tokens?.completionTokens || 0;

        return {
          ...m,
          status: nextStatus,
          pendingApproval: event.name === 'ApprovalRequested'
            ? {
                taskId: event.payload.taskId,
                agentName: event.payload.agentId || 'Agent',
                action: event.payload.toolName || event.payload.action || 'approval required'
              }
            : m.pendingApproval,
          timelineEvents: [
            ...m.timelineEvents,
            {
              id: `ev_${Date.now()}_${Math.random()}`,
              timestamp: new Date(),
              title: eventTitle(event),
              agent: event.payload?.agentName || event.payload?.agentId,
              model: event.payload?.model,
              details: event.payload ? JSON.stringify(event.payload) : undefined,
              type: missionEventType(event.name)
            }
          ],
          collaborationFeed: message ? [...m.collaborationFeed, message] : m.collaborationFeed,
          metrics: {
            ...m.metrics,
            totalTokens: m.metrics.totalTokens + promptTokens + completionTokens,
            promptTokens: m.metrics.promptTokens + promptTokens,
            completionTokens: m.metrics.completionTokens + completionTokens,
            currentStep: eventTitle(event),
            currentModel: event.payload?.model || m.metrics.currentModel,
            currentProvider: event.payload?.providerId || m.metrics.currentProvider,
            runtimeMs: Date.now() - m.createdAt.getTime()
          },
          ...(event.name === 'PlanFinished' ? {
            completedAt: new Date(),
            durationMs: Date.now() - m.createdAt.getTime()
          } : {})
        };
      }));
    },
    subscribe: () => {}
  } as any;

  const [providerRegistry] = useState(() => new ProviderRegistry(mockEventBus));
  const [providerHealth] = useState(() => new ProviderHealth(mockEventBus));
  const [providerCache] = useState(() => new ProviderCache());
  const [messageStore] = useState(() => new MessageStore());
  const [contextEngine] = useState(() => new ContextEngine());
  const [toolExecutor] = useState(() => new TauriToolExecutor());

  const [providerRouter] = useState(
    () => new ProviderRouter(providerRegistry, modelRegistry, providerHealth, providerCache, mockEventBus, logger, metrics)
  );

  const [agentRegistry] = useState(() => new AgentRegistry());
  const [capabilityEngine] = useState(() => new CapabilityEngine(agentRegistry));
  const [taskOrchestrator] = useState(() => new TaskOrchestrator(capabilityEngine, messageStore, {
    providerRouter,
    contextEngine,
    eventBus: mockEventBus,
    logger,
    metrics,
    toolExecutor
  }));

  // React UI States
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [persistenceStatus, setPersistenceStatus] = useState<'local' | 'loading' | 'synced' | 'saving' | 'error'>(
    isSupabaseConfigured ? 'loading' : 'local'
  );
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const hasLoadedCloudState = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj_1');
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [templates, setTemplates] = useState<AgentProfile[]>([]);
  const [projectAgentIdsByProject, setProjectAgentIdsByProject] = useState<Record<string, string[]>>({});
  
  const [teams, setTeams] = useState<Team[]>([
    { id: 'team_1', name: 'Startup Engineering Team', description: 'Complete startup engineering squad (CEO, Backend, React, Security, QA).', members: ['tmpl_1', 'tmpl_2', 'tmpl_3', 'tmpl_4', 'tmpl_5'], workflow: 'sequential' },
    { id: 'team_2', name: 'React UI Team', description: 'Frontend engineers and design planners.', members: ['tmpl_1', 'tmpl_3'], workflow: 'hierarchical' },
    { id: 'team_3', name: 'Security Audit Team', description: 'Planners and code security scanners.', members: ['tmpl_1', 'tmpl_4'], workflow: 'mesh' }
  ]);
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [messages, _setMessages] = useState<AgentMessage[]>([]);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([
    { id: 'k_1', title: 'System Specs', content: 'Atlas should run at sub-50ms router latency.', type: 'markdown' },
    { id: 'k_2', title: 'React Aesthetics Guideline', content: 'Use dark modes, HSL variables, fluid typography clamp(), and responsive cards.', type: 'markdown' }
  ]);

  const [providerSettings, setProviderSettings] = useState({
    apiKey: '',
    endpoint: 'https://api.openai.com/v1',
    fallbackModel: 'anthropic/claude-sonnet-4.6',
    openRouterApiKey: import.meta.env.VITE_ATLAS_OPENROUTER_API_KEY || '',
    openRouterModel: 'anthropic/claude-sonnet-4.6',
    budgetLimit: 50.0,
    health: { status: 'healthy', latencyMs: 42, circuitBreakerActive: false } as SystemHealth
  });

  // Mission states
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: 'miss_seeded_1',
      goal: 'Design local SQLite database schema for notes cache',
      status: 'success',
      teamId: 'team_1',
      createdAt: new Date(Date.now() - 3600000 * 24),
      completedAt: new Date(Date.now() - 3600000 * 24 + 15000),
      durationMs: 15400,
      cost: 0.1245,
      filesChanged: ['schema.sql', 'db.ts'],
      decisionsCount: 1,
      risks: ['None detected'],
      recommendations: ['Enable foreign key support in SQLite driver connection hooks.'],
      lessonsLearned: ['SQLite WAL mode significantly decreases concurrent write latencies.'],
      collaborationFeed: [
        { id: 'm1', sender: 'CEO Agent', content: 'Analyze note caching requirements.', timestamp: new Date() },
        { id: 'm2', sender: 'Backend Engineer', content: 'Creating tables for notes and tags.', timestamp: new Date() }
      ],
      timelineEvents: [
        { id: 'ev1', timestamp: new Date(), title: 'Planner created task', type: 'planner' },
        { id: 'ev2', timestamp: new Date(), title: 'Database schema completed', type: 'completed' }
      ],
      agentStatus: { 'CEO Agent': 'Completed', 'Backend Engineer': 'Completed' },
      metrics: { totalTokens: 4820, promptTokens: 3200, completionTokens: 1620, currentStep: 'Completed', currentModel: 'claude-3-5-sonnet', currentProvider: 'anthropic', stepsCompleted: 2, totalSteps: 2, runtimeMs: 15400 }
    }
  ]);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  
  const [decisions, setDecisions] = useState<Decision[]>([
    { id: 'dec_1', title: 'Use SQLite', reason: 'Offline-first architecture requirement', madeBy: 'CEO Agent', approvedBy: 'User', timestamp: new Date() },
    { id: 'dec_2', title: 'Externalize JWT Secret', reason: 'Prevent leaking API keys in repository source code', madeBy: 'Security Engineer', approvedBy: 'User', timestamp: new Date() }
  ]);

  const serializeState = (): PersistedAtlasState => ({
    projects: projects.map(project => ({ ...project, createdAt: project.createdAt.toISOString() })),
    activeProjectId,
    agents,
    teams,
    knowledge,
    providerSettings,
    missions: missions.map(mission => ({
      ...mission,
      createdAt: mission.createdAt.toISOString(),
      completedAt: mission.completedAt?.toISOString(),
      timelineEvents: mission.timelineEvents.map(event => ({ ...event, timestamp: event.timestamp.toISOString() })),
      collaborationFeed: mission.collaborationFeed.map(message => ({ ...message, timestamp: message.timestamp.toISOString() }))
    })),
    decisions: decisions.map(decision => ({ ...decision, timestamp: decision.timestamp.toISOString() })),
    projectAgentIdsByProject
  });

  const applyPersistedState = async (state: PersistedAtlasState | null | undefined) => {
    if (!state) return;
    if (Array.isArray(state.projects)) setProjects(state.projects.map(reviveProject));
    if (state.activeProjectId) setActiveProjectId(state.activeProjectId);
    if (Array.isArray(state.agents)) {
      setAgents(state.agents);
      await Promise.all(state.agents.map(agent => agentRegistry.importAgent(JSON.stringify(agent)).catch(() => null)));
    }
    if (Array.isArray(state.teams)) setTeams(state.teams);
    if (Array.isArray(state.knowledge)) setKnowledge(state.knowledge);
    if (state.providerSettings) setProviderSettings(prev => ({ ...prev, ...state.providerSettings }));
    if (Array.isArray(state.missions)) setMissions(state.missions.map(reviveMission));
    if (Array.isArray(state.decisions)) setDecisions(state.decisions.map(reviveDecision));
    if (state.projectAgentIdsByProject) setProjectAgentIdsByProject(state.projectAgentIdsByProject);
  };

  useEffect(() => {
    activeMissionIdRef.current = activeMissionId;
  }, [activeMissionId]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      setPersistenceStatus('local');
      return;
    }

    let mounted = true;
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) throw error;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .catch((err: any) => {
        if (!mounted) return;
        setPersistenceStatus('error');
        setPersistenceError(err?.message || 'Failed to read Supabase session.');
      })
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      hasLoadedCloudState.current = false;
      setPersistenceStatus(nextSession ? 'loading' : 'local');
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    let cancelled = false;

    const loadState = async () => {
      setPersistenceStatus('loading');
      setPersistenceError(null);
      const { data, error } = await supabase
        .from('atlas_workspace_state')
        .select('state')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setPersistenceStatus('error');
        setPersistenceError(error.message);
        return;
      }

      await applyPersistedState((data?.state || null) as PersistedAtlasState | null);
      hasLoadedCloudState.current = true;
      setPersistenceStatus('synced');
    };

    loadState().catch((err: any) => {
      if (cancelled) return;
      setPersistenceStatus('error');
      setPersistenceError(err?.message || 'Failed to load workspace state.');
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured || !user || !hasLoadedCloudState.current) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(async () => {
      setPersistenceStatus('saving');
      setPersistenceError(null);
      const { error } = await supabase
        .from('atlas_workspace_state')
        .upsert({
          user_id: user.id,
          state: serializeState(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        setPersistenceStatus('error');
        setPersistenceError(error.message);
        return;
      }
      setPersistenceStatus('synced');
    }, 700);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [projects, activeProjectId, agents, teams, knowledge, providerSettings, missions, decisions, projectAgentIdsByProject, user?.id]);

  useEffect(() => {
    const boot = async () => {
      await Promise.all([
        providerRegistry.initialize(),
        modelRegistry.initialize(),
        providerHealth.initialize(),
        providerCache.initialize(),
        providerRouter.initialize()
      ]);
    };
    boot().catch(err => console.error('Failed to initialize Atlas services:', err));
  }, [modelRegistry, providerCache, providerHealth, providerRegistry, providerRouter]);

  useEffect(() => {
    const key = providerSettings.apiKey.trim();
    const validKey = key.length > 0 && key !== 'sk-xxxxxxxx';
    const openRouterKey = providerSettings.openRouterApiKey.trim();
    const hasOpenRouterKey = openRouterKey.length > 0;
    const failingAdapter = {
      execute: async () => {
        throw new Error('No real provider API key configured. Add a provider key or OpenRouter key in Provider settings.');
      },
      embed: async () => {
        throw new Error('No real provider API key configured. Add a provider key or OpenRouter key in Provider settings.');
      }
    };

    providerRouter.registerAdapter('openai', validKey ? new OpenaiAdapter({ apiKey: key, baseUrl: providerSettings.endpoint }) : failingAdapter);
    providerRouter.registerAdapter('anthropic', validKey ? new AnthropicAdapter({ apiKey: key }) : failingAdapter);
    providerRouter.registerAdapter('groq', validKey ? new GroqAdapter({ apiKey: key }) : failingAdapter);
    providerRouter.registerAdapter(
      'openrouter',
      hasOpenRouterKey ? new OpenRouterAdapter({ apiKey: openRouterKey }) : failingAdapter
    );
    providerRouter.registerFallback('claude-3-5-sonnet', [`openrouter/${providerSettings.openRouterModel}`]);
    providerRouter.registerFallback('gpt-4o', [`openrouter/${providerSettings.openRouterModel}`]);
    providerRouter.registerFallback(providerSettings.fallbackModel, [`openrouter/${providerSettings.openRouterModel}`]);
  }, [
    providerRouter,
    providerSettings.apiKey,
    providerSettings.endpoint,
    providerSettings.fallbackModel,
    providerSettings.openRouterApiKey,
    providerSettings.openRouterModel
  ]);

  // Initialize and seed default templates
  useEffect(() => {
    const seed = async () => {
      try {
        const tmpls = await agentRegistry.listTemplates();
        setTemplates(tmpls);

        const list = await agentRegistry.listAgents();
        setAgents(list);
      } catch (err) {
        console.error("Error seeding templates & projects:", err);
      }
    };
    seed();
  }, [agentRegistry]);

  // Project CRUD
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProjects([]);
    setAgents([]);
    setProjectAgentIdsByProject({});
    hasLoadedCloudState.current = false;
  };

  const createProject = (name: string, description: string) => {
    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name,
      description,
      status: 'active',
      createdAt: new Date()
    };
    setProjects(prev => [...prev, newProj]);
    setActiveProjectId(newProj.id);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const renameProject = (id: string, name: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  const archiveProject = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'archived' } : p));
  };

  // Agents CRUD
  const createAgent = async (profile: Omit<AgentProfile, 'id' | 'version' | 'status' | 'statistics'>): Promise<AgentProfile> => {
    const id = `agent_${Date.now()}`;
    const created = await agentRegistry.createAgent({ ...profile, id });
    const list = await agentRegistry.listAgents();
    setAgents(list);
    return created;
  };

  const updateAgent = async (id: string, updates: Partial<AgentProfile>) => {
    try {
      await agentRegistry.updateAgent(id, updates);
      const list = await agentRegistry.listAgents();
      setAgents(list);
    } catch {
      setAgents(prev => prev.map(agent => agent.id === id ? { ...agent, ...updates, id, version: agent.version + 1 } : agent));
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      await agentRegistry.deleteAgent(id);
      const list = await agentRegistry.listAgents();
      setAgents(list);
    } catch {
      setAgents(prev => prev.filter(agent => agent.id !== id));
    }
    setProjectAgentIdsByProject(prev => Object.fromEntries(
      Object.entries(prev).map(([projectId, ids]) => [projectId, ids.filter(agentId => agentId !== id)])
    ));
  };

  const cloneAgent = async (id: string, name: string) => {
    const newId = `agent_${Date.now()}`;
    try {
      await agentRegistry.cloneAgent(id, newId, name);
      const list = await agentRegistry.listAgents();
      setAgents(list);
    } catch {
      const base = agents.find(agent => agent.id === id);
      if (!base) return;
      setAgents(prev => [...prev, {
        ...JSON.parse(JSON.stringify(base)),
        id: newId,
        name,
        version: 1,
        currentSpend: 0,
        statistics: { totalTasks: 0, successRate: 1.0, avgLatencyMs: 0, totalSpend: 0 }
      }]);
    }
  };

  const setProjectAgentIdsForProject = (projectId: string, ids: string[]) => {
    setProjectAgentIdsByProject(prev => ({
      ...prev,
      [projectId]: Array.from(new Set(ids))
    }));
  };

  // Teams CRUD
  const createTeam = (name: string, description: string, members: string[], workflow: 'sequential' | 'hierarchical' | 'mesh' = 'sequential') => {
    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name,
      description,
      members,
      workflow
    };
    setTeams(prev => [...prev, newTeam]);
  };

  const deleteTeam = (id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id));
  };

  // Launch a Mission
  const createMission = async (goal: string, teamId: string) => {
    const missionId = `miss_${Date.now()}`;
    const newMission: Mission = {
      id: missionId,
      goal,
      status: 'planning',
      teamId,
      createdAt: new Date(),
      timelineEvents: [],
      collaborationFeed: [],
      agentStatus: {
        'CEO Agent': 'Waiting',
        'Backend Engineer': 'Sleeping',
        'React Engineer': 'Sleeping',
        'Security Engineer': 'Sleeping',
        'Reviewer Agent': 'Sleeping'
      },
      pendingApproval: null,
      metrics: { totalTokens: 0, promptTokens: 0, completionTokens: 0, currentStep: 'Initializing...', currentModel: 'claude-3-5-sonnet', currentProvider: 'anthropic', stepsCompleted: 0, totalSteps: 0, runtimeMs: 0 }
    };

    setMissions(prev => [newMission, ...prev]);
    setActiveMissionId(missionId);

    activeMissionIdRef.current = missionId;

    try {
      const sharedContext = contextEngine.createSharedContext();
      sharedContext.conversationHistory.push(`User goal: ${goal}`);
      for (const item of knowledge) {
        sharedContext.files[`knowledge/${item.title}.${item.type}`] = item.content;
      }

      const plan = await taskOrchestrator.generatePlan(missionId, goal, 'MultiAgent');
      setPlans(prev => [plan, ...prev.filter(p => p.id !== plan.id)]);
      setActivePlan(plan);
      setMissions(prev => prev.map(m => m.id === missionId ? {
        ...m,
        metrics: {
          ...m.metrics,
          totalSteps: plan.tasks.length,
          currentStep: 'Plan generated'
        }
      } : m));

      await taskOrchestrator.executePlan(missionId, sharedContext);

      const finishedPlan = taskOrchestrator.getPlan(missionId);
      if (finishedPlan) {
        setPlans(prev => prev.map(p => p.id === finishedPlan.id ? finishedPlan : p));
        setActivePlan(finishedPlan);
        setMissions(prev => prev.map(m => m.id === missionId ? {
          ...m,
          status: finishedPlan.status === 'completed' ? 'success' : 'failed',
          pendingApproval: null,
          filesChanged: Object.keys(sharedContext.files),
          recommendations: finishedPlan.status === 'completed' ? ['Review agent outputs before applying code changes.'] : ['Check provider configuration and failed task output.'],
          lessonsLearned: sharedContext.keyDecisions,
          metrics: {
            ...m.metrics,
            stepsCompleted: finishedPlan.tasks.filter(t => t.status === 'completed').length,
            totalSteps: finishedPlan.tasks.length,
            currentStep: `Mission ${finishedPlan.status}`,
            runtimeMs: Date.now() - m.createdAt.getTime()
          }
        } : m));
      }
    } catch (err: any) {
      setMissions(prev => prev.map(m => m.id === missionId ? {
        ...m,
        status: 'failed',
        pendingApproval: null,
        collaborationFeed: [
          ...m.collaborationFeed,
          { id: `msg_${Date.now()}`, sender: 'Runtime', content: err.message || 'Mission failed.', timestamp: new Date() }
        ],
        timelineEvents: [
          ...m.timelineEvents,
          { id: `ev_${Date.now()}`, timestamp: new Date(), title: err.message || 'Mission failed', type: 'system' }
        ],
        metrics: {
          ...m.metrics,
          currentStep: 'Mission failed',
          runtimeMs: Date.now() - m.createdAt.getTime()
        }
      } : m));
    }
  };

  // Replay a mission
  const replayMission = async (id: string) => {
    const old = missions.find(m => m.id === id);
    if (!old) return;
    await createMission(old.goal, old.teamId);
  };

  // Duplicate a mission
  const duplicateMission = (id: string) => {
    const old = missions.find(m => m.id === id);
    if (!old) return;
    const copied: Mission = {
      ...JSON.parse(JSON.stringify(old)),
      id: `miss_${Date.now()}`,
      createdAt: new Date(),
      completedAt: undefined
    };
    setMissions(prev => [copied, ...prev]);
  };

  // Delete a mission
  const deleteMission = (id: string) => {
    setMissions(prev => prev.filter(m => m.id !== id));
    if (activeMissionId === id) setActiveMissionId(null);
  };

  // Rename a mission
  const renameMission = (id: string, name: string) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, goal: name } : m));
  };

  // Archive a mission
  const archiveMission = (id: string) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, status: 'idle' } : m));
  };

  // Execute Goal (Sprint 4 Task Orchestrator fallback)
  const executeGoal = async (goal: string, _mode: string) => {
    await createMission(goal, 'team_1');
  };

  const resolveApproval = (taskId: string, approved: boolean) => {
    taskOrchestrator.resolveApproval(taskId, approved);
    setMissions(prev => prev.map(m => {
      if (m.id === activeMissionId) {
        const updatedTimeline = [
          ...m.timelineEvents,
          { id: `ev_${Date.now()}`, timestamp: new Date(), title: `Human ${approved ? 'Approved' : 'Denied'}: npm install prisma`, type: 'system' }
        ];

        return {
          ...m,
          status: approved ? 'running' : 'failed',
          pendingApproval: null,
          timelineEvents: updatedTimeline
        } as Mission;
      }
      return m;
    }));
  };

  const pausePlanExecution = () => {
    setMissions(prev => prev.map(m => m.id === activeMissionId ? { ...m, status: 'paused' } : m));
  };

  const resumePlanExecution = () => {
    setMissions(prev => prev.map(m => m.id === activeMissionId ? { ...m, status: 'running' } : m));
  };

  const cancelPlanExecution = () => {
    setMissions(prev => prev.map(m => m.id === activeMissionId ? { ...m, status: 'failed' } : m));
  };

  const updateProviderSettings = (updates: any) => {
    setProviderSettings(prev => ({ ...prev, ...updates }));
  };

  const addKnowledge = (title: string, content: string, type: 'markdown' | 'note' | 'pdf' | 'git') => {
    const item: KnowledgeItem = {
      id: `k_${Date.now()}`,
      title,
      content,
      type
    };
    setKnowledge(prev => [...prev, item]);
  };

  const deleteKnowledge = (id: string) => {
    setKnowledge(prev => prev.filter(k => k.id !== id));
  };

  const addDecision = (title: string, reason: string, madeBy = 'User', approvedBy = 'User') => {
    setDecisions(prev => [
      {
        id: `dec_${Date.now()}`,
        title,
        reason,
        madeBy,
        approvedBy,
        timestamp: new Date()
      },
      ...prev
    ]);
  };

  const deleteDecision = (id: string) => {
    setDecisions(prev => prev.filter(decision => decision.id !== id));
  };

  return (
    <AtlasContext.Provider
      value={{
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
        deleteProject,
        renameProject,
        archiveProject,
        agents,
        templates,
        createAgent,
        updateAgent,
        deleteAgent,
        cloneAgent,
        projectAgentIdsByProject,
        setProjectAgentIdsForProject,
        teams,
        createTeam,
        deleteTeam,
        plans,
        activePlan,
        executeGoal,
        resolveApproval,
        pausePlanExecution,
        resumePlanExecution,
        cancelPlanExecution,
        messages,
        timeline,
        systemLogs,
        providerSettings,
        updateProviderSettings,
        knowledge,
        addKnowledge,
        deleteKnowledge,
        // Mission states
        missions,
        activeMissionId,
        setActiveMissionId,
        decisions,
        addDecision,
        deleteDecision,
        createMission,
        replayMission,
        duplicateMission,
        deleteMission,
        renameMission,
        archiveMission
      }}
    >
      {children}
    </AtlasContext.Provider>
  );
};

export const useAtlas = () => {
  const context = useContext(AtlasContext);
  if (!context) throw new Error('useAtlas must be used within AtlasProvider');
  return context;
};
