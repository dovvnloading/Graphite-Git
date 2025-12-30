

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string | null;
    node_id: string;
  } | null;
  allow_forking: boolean;
  is_template: boolean;
  topics: string[];
  visibility: string;
  default_branch: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir' | 'submodule' | 'symlink';
  content?: string;
  encoding?: string;
}

export interface GitHubEvent {
  id: string;
  type: string;
  actor: {
    id: number;
    login: string;
    display_login: string;
    gravatar_id: string;
    url: string;
    avatar_url: string;
  };
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: any;
  public: boolean;
  created_at: string;
}

export interface UserUpdatePayload {
  name?: string;
  email?: string;
  blog?: string;
  company?: string;
  location?: string;
  hireable?: boolean;
  bio?: string;
}

export interface RepoUpdatePayload {
  name?: string;
  description?: string;
  homepage?: string;
  private?: boolean;
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
  color?: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface HeatmapTheme {
  label: string;
  colors: string[];
  glow: string;
}

// Notifications
export interface GitHubNotification {
  id: string;
  repository: {
    full_name: string;
    private: boolean;
    html_url: string;
    owner: {
      avatar_url: string;
    }
  };
  subject: {
    title: string;
    url: string;
    latest_comment_url: string;
    type: string; // "Issue", "PullRequest", "Release", "Commit"
  };
  reason: string; // "mention", "subscribed", "review_requested"
  unread: boolean;
  updated_at: string;
  last_read_at: string | null;
  url: string;
}

// Gists
export interface GistFile {
  filename: string;
  type: string;
  language: string;
  raw_url: string;
  size: number;
  truncated?: boolean;
  content?: string;
}

export interface GitHubGist {
  url: string;
  forks_url: string;
  commits_url: string;
  id: string;
  node_id: string;
  git_pull_url: string;
  git_push_url: string;
  html_url: string;
  files: Record<string, GistFile>;
  public: boolean;
  created_at: string;
  updated_at: string;
  description: string | null;
  comments: number;
  user: GitHubUser | null;
  owner: GitHubUser | null;
  truncated: boolean;
}

// Actions & Workflows
export interface GitHubWorkflow {
  id: number;
  node_id: string;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  node_id: string;
  head_branch: string;
  head_sha: string;
  path: string;
  display_title: string;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  workflow_id: number;
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  actor: GitHubUser;
  run_number: number;
  run_attempt: number;
}

// Issues
export interface GitHubIssue {
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  id: number;
  node_id: string;
  number: number;
  title: string;
  user: GitHubUser;
  labels: {
    id: number;
    node_id: string;
    url: string;
    name: string;
    color: string;
    default: boolean;
    description: string;
  }[];
  state: 'open' | 'closed';
  locked: boolean;
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  milestone: any | null;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  author_association: string;
  active_lock_reason: string | null;
  body: string;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
}

// Agent Types

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system' | 'function';
  text?: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolResponse?: { name: string; response: any };
}

export interface ToolCall {
  id: string;
  name: string;
  args: any;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  result?: string;
}

export interface AgentContextState {
  activeTab: string;
  currentRepo?: GitHubRepo;
  currentPath?: string;
  currentFile?: GitHubFile;
  fileContent?: string;
  currentSelection?: string; // New field for context menu actions
}

export interface AgentContextSettings {
  includeRepoMap: boolean;
  includeFileContent: boolean;
  includeSelection: boolean;
}

export interface AgentContextType {
  isEnabled: boolean;
  enableAgent: () => void;
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  contextState: AgentContextState;
  setContextState: (state: Partial<AgentContextState>) => void;
  contextSettings: AgentContextSettings;
  setContextSettings: (settings: Partial<AgentContextSettings>) => void;
  pendingToolCall: ToolCall | null;
  approveToolCall: () => Promise<void>;
  rejectToolCall: () => void;
  isThinking: boolean;
  isPanelOpen: boolean;
  setPanelOpen: (isOpen: boolean) => void;
  lastActionTimestamp: number;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  htmlSafetyMode: boolean;
  setHtmlSafetyMode: (enabled: boolean) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
}