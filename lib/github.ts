// lib/github.ts — GitHub API wrapper
// Naudoja: blog-gen (createDraftBranch, commitFileToBranch), blog-approve (mergeBranchToMain),
// telegram-webhook (deleteBranch, listBranches)

const REPO_OWNER = 'riko8825';
const REPO_NAME = 'Veriva-geras';
const BASE_BRANCH = 'main';
const GITHUB_TIMEOUT_MS = 8_000;  // Vercel maxDuration=90s, blog-gen makes ~10 calls

async function githubRequest(path: string, method = 'GET', body?: object) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not set');

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`;
  console.log(`[github] ${method} ${url}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GITHUB_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const tag = err instanceof Error && err.name === 'AbortError' ? 'timeout' : 'network';
    console.error(`[github] fetch ${tag} — ${method} ${url}: ${msg}`);
    throw new Error(`[github] fetch ${tag} — ${method} ${url}: ${msg}`);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  console.log(`[github] ${method} ${url} → ${res.status}`);
  if (!res.ok) {
    console.error(`[github] ${method} ${url} → ${res.status}: ${text.slice(0, 300)}`);
    throw new Error(`GitHub API ${res.status} (${method} ${path}): ${text.slice(0, 200)}`);
  }

  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }
  return data as Record<string, unknown>;
}

export async function getMainSha(): Promise<string> {
  const data = await githubRequest(`/git/ref/heads/${BASE_BRANCH}`);
  return (data.object as { sha: string }).sha;
}

export async function createDraftBranch(branchName: string): Promise<void> {
  const sha = await getMainSha();
  await githubRequest('/git/refs', 'POST', {
    ref: `refs/heads/${branchName}`,
    sha,
  });
}

export async function getFileFromBranch(branchName: string, filePath: string): Promise<string> {
  const data = await githubRequest(`/contents/${filePath}?ref=${branchName}`);
  const content = data.content as string;
  if (!content) throw new Error(`[github] getFileFromBranch — no content for ${filePath}@${branchName}`);
  return Buffer.from(content, 'base64').toString('utf-8');
}

export interface DirEntry {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
}

export async function listDirFromBranch(branchName: string, dirPath: string): Promise<DirEntry[]> {
  const data = await githubRequest(`/contents/${dirPath}?ref=${branchName}`);
  if (!Array.isArray(data)) {
    throw new Error(`[github] listDirFromBranch — ${dirPath}@${branchName} is not a directory`);
  }
  return (data as Array<Record<string, unknown>>).map(e => ({
    name: e.name as string,
    path: e.path as string,
    type: e.type as DirEntry['type'],
  }));
}

export async function listBranches(prefix?: string): Promise<string[]> {
  const data = await githubRequest(`/branches?per_page=100`);
  if (!Array.isArray(data)) {
    throw new Error(`[github] listBranches — unexpected response`);
  }
  const names = (data as Array<{ name: string }>).map(b => b.name);
  return prefix ? names.filter(n => n.startsWith(prefix)) : names;
}

export async function commitFileToBranch(
  branchName: string,
  filePath: string,
  content: string,
  commitMessage: string
): Promise<void> {
  const encoded = Buffer.from(content).toString('base64');

  let sha: string | undefined;
  try {
    const existing = await githubRequest(`/contents/${filePath}?ref=${branchName}`);
    sha = existing.sha as string;
  } catch {
    // File doesn't exist yet — create it
  }

  await githubRequest(`/contents/${filePath}`, 'PUT', {
    message: commitMessage,
    content: encoded,
    branch: branchName,
    ...(sha ? { sha } : {}),
  });
}

export async function mergeBranchToMain(branchName: string, title: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not set');

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/merges`;
  console.log(`[github] mergeBranchToMain POST ${url} — head: ${branchName}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GITHUB_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base: BASE_BRANCH, head: branchName, commit_message: title }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  console.log(`[github] mergeBranchToMain → status: ${res.status}, body: ${text.slice(0, 200)}`);

  // 201 = merged, 204 = already merged (no-op) — both OK
  if (res.status === 201 || res.status === 204) return;

  throw new Error(`merge failed — status ${res.status}: ${text.slice(0, 200)}`);
}

export async function deleteBranch(branchName: string): Promise<void> {
  await githubRequest(`/git/refs/heads/${branchName}`, 'DELETE');
}

export async function branchExists(branchName: string): Promise<boolean> {
  try {
    await githubRequest(`/git/refs/heads/${branchName}`);
    return true;
  } catch {
    return false;
  }
}
