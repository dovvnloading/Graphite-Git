

import { GitHubUser, GitHubRepo, UserUpdatePayload, RepoUpdatePayload, ContributionCalendar, GitHubFile, GitHubNotification, GitHubGist, GitHubWorkflow, GitHubWorkflowRun, GitHubIssue, GitHubEvent } from '../types';

const BASE_URL = 'https://api.github.com';

export class GitHubService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: any = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    };

    // Only attach Content-Type if we are actually sending data
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    // CRITICAL: Force no-store to prevent browser from serving stale data
    const fetchOptions: RequestInit = {
      cache: 'no-store',
      ...options,
      headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid Token');
      }
      if (response.status === 403) {
        throw new Error('Forbidden: Check Token Scopes (needs "user" or "user:follow")');
      }
      // Attach status to error for better handling
      const error: any = new Error(`GitHub API Error: ${response.statusText} (${response.status})`);
      error.status = response.status;
      throw error;
    }

    if (response.status === 204 || response.status === 205) {
        return {} as T;
    }

    return response.json();
  }

  async getAuthenticatedUser(): Promise<GitHubUser> {
    return this.fetch<GitHubUser>('/user');
  }

  async updateAuthenticatedUser(data: UserUpdatePayload): Promise<GitHubUser> {
    return this.fetch<GitHubUser>('/user', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getUserRepos(sort: 'created' | 'updated' | 'pushed' | 'full_name' = 'updated', direction: 'asc' | 'desc' = 'desc'): Promise<GitHubRepo[]> {
    return this.fetch<GitHubRepo[]>(`/user/repos?per_page=100&sort=${sort}&direction=${direction}`);
  }

  async updateRepo(owner: string, repo: string, data: RepoUpdatePayload): Promise<GitHubRepo> {
    return this.fetch<GitHubRepo>(`/repos/${owner}/${repo}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteRepo(owner: string, repo: string): Promise<void> {
    return this.fetch(`/repos/${owner}/${repo}`, { method: 'DELETE' });
  }

  async getRepoContents(owner: string, repo: string, path: string = ''): Promise<GitHubFile[] | GitHubFile> {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return this.fetch<GitHubFile[] | GitHubFile>(`/repos/${owner}/${repo}/contents/${encodedPath}`);
  }

  async updateFile(owner: string, repo: string, path: string, content: string, sha: string | undefined, message: string): Promise<any> {
    const encodedContent = window.btoa(unescape(encodeURIComponent(content)));
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');

    const body: any = {
      message,
      content: encodedContent,
    };
    if (sha) body.sha = sha;

    return this.fetch(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async deleteFile(owner: string, repo: string, path: string, message: string, sha?: string): Promise<any> {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    
    // If SHA is not provided, we must fetch it first
    let fileSha = sha;
    if (!fileSha) {
        try {
            const file = await this.getRepoContents(owner, repo, path) as GitHubFile;
            fileSha = file.sha;
        } catch (e) {
            throw new Error(`Cannot delete file. File not found: ${path}`);
        }
    }

    return this.fetch(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message,
        sha: fileSha
      })
    });
  }

  async checkFollowerStatus(username: string): Promise<boolean> {
    try {
      await this.fetch(`/user/following/${encodeURIComponent(username)}`, { method: 'GET' });
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- Activity & Events ---

  async getUserEvents(username: string): Promise<GitHubEvent[]> {
    return this.fetch<GitHubEvent[]>(`/users/${username}/events?per_page=50`);
  }

  async getReceivedEvents(username: string): Promise<GitHubEvent[]> {
    return this.fetch<GitHubEvent[]>(`/users/${username}/received_events?per_page=50`);
  }

  // --- Notifications ---

  async getNotifications(all = false): Promise<GitHubNotification[]> {
    return this.fetch<GitHubNotification[]>(`/notifications?all=${all}&participating=false`);
  }

  async markNotificationAsRead(threadId: string): Promise<void> {
    return this.fetch(`/notifications/threads/${threadId}`, {
      method: 'PATCH'
    });
  }

  // --- Gists ---

  async getGists(): Promise<GitHubGist[]> {
    return this.fetch<GitHubGist[]>(`/gists`);
  }
  
  async getGist(id: string): Promise<GitHubGist> {
    return this.fetch<GitHubGist>(`/gists/${id}`);
  }

  async createGist(gist: { description: string; public: boolean; files: Record<string, { content: string }> }): Promise<GitHubGist> {
    return this.fetch<GitHubGist>('/gists', {
      method: 'POST',
      body: JSON.stringify(gist)
    });
  }

  async updateGist(id: string, gist: { description?: string; files: Record<string, { content: string | null; filename?: string } | null> }): Promise<GitHubGist> {
    return this.fetch<GitHubGist>(`/gists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(gist)
    });
  }

  async deleteGist(id: string): Promise<void> {
    return this.fetch(`/gists/${id}`, { method: 'DELETE' });
  }

  // --- Workflows (Actions) ---

  async getRepoWorkflows(owner: string, repo: string): Promise<{ total_count: number; workflows: GitHubWorkflow[] }> {
    return this.fetch<{ total_count: number; workflows: GitHubWorkflow[] }>(`/repos/${owner}/${repo}/actions/workflows`);
  }

  async getWorkflowRuns(owner: string, repo: string, per_page = 20): Promise<{ total_count: number; workflow_runs: GitHubWorkflowRun[] }> {
    return this.fetch<{ total_count: number; workflow_runs: GitHubWorkflowRun[] }>(`/repos/${owner}/${repo}/actions/runs?per_page=${per_page}`);
  }

  async dispatchWorkflow(owner: string, repo: string, workflowId: number | string, ref: string): Promise<void> {
    return this.fetch(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
        method: 'POST',
        body: JSON.stringify({ ref })
    });
  }

  // --- Issues ---

  async getIssues(filter: 'assigned' | 'created' | 'mentioned' | 'repos' = 'assigned', state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    return this.fetch<GitHubIssue[]>(`/issues?filter=${filter}&state=${state}&sort=updated`);
  }

  // --- GraphQL Data ---

  async getContributionCalendar(): Promise<ContributionCalendar> {
    const query = `
      query {
        viewer {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.fetch<any>('/graphql', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });

    if (response.errors) {
        console.warn('GraphQL Error:', response.errors);
        throw new Error(response.errors[0].message);
    }

    return response.data.viewer.contributionsCollection.contributionCalendar;
  }

  // --- Network Management ---

  // Fetches a single page of followers
  async getFollowersPage(page: number, per_page = 50): Promise<GitHubUser[]> {
    return this.fetch<GitHubUser[]>(`/user/followers?page=${page}&per_page=${per_page}`);
  }

  // Fetches a single page of following
  async getFollowingPage(page: number, per_page = 50): Promise<GitHubUser[]> {
    return this.fetch<GitHubUser[]>(`/user/following?page=${page}&per_page=${per_page}`);
  }

  // Bulk fetch for audit (tries to get everything)
  async getAllFollowing(): Promise<GitHubUser[]> {
    return this.fetchPaginatedUsers('/user/following');
  }

  // Bulk fetch for audit
  async getAllFollowers(): Promise<GitHubUser[]> {
    return this.fetchPaginatedUsers('/user/followers');
  }

  async followUser(username: string): Promise<void> {
    return this.fetch(`/user/following/${encodeURIComponent(username)}`, {
      method: 'PUT',
      headers: { 'Content-Length': '0' }
    });
  }

  async unfollowUser(username: string): Promise<void> {
    try {
      await this.fetch(`/user/following/${encodeURIComponent(username)}`, { method: 'DELETE' });
    } catch (e: any) {
      // Check for status 404 (Not Found) or 422 (Unprocessable) - if user not followed, it's success
      if (e.status === 404) return;
      
      const msg = (e.message || '').toLowerCase();
      if (msg.includes('404') || msg.includes('not found')) {
        return;
      }
      throw e;
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchPaginatedUsers(endpoint: string, limitPages = 50): Promise<GitHubUser[]> {
    let page = 1;
    let results: GitHubUser[] = [];
    
    while (page <= limitPages) {
      try {
        const data = await this.fetch<GitHubUser[]>(`${endpoint}?per_page=100&page=${page}`);
        if (data.length === 0) break;
        results = [...results, ...data];
        page++;
        
        // Rate Limit Protection: 
        // Pause for 300ms between requests to avoid triggering abuse detection mechanisms.
        if (page <= limitPages) await this.sleep(300);

      } catch (error: any) {
        // If we hit a rate limit (403 Forbidden or 429 Too Many Requests), 
        // stop pagination gracefully and return what we have so far.
        if (error.status === 403 || error.status === 429) {
            console.warn(`Rate limit hit at page ${page}. Returning partial results.`);
            break;
        }
        throw error;
      }
    }
    return results;
  }
}
