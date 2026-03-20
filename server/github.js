/**
 * GitHub API Service
 * 自动化 GitHub 仓库操作
 */

const GITHUB_API = 'https://api.github.com'

/**
 * 获取 GitHub API Headers
 */
function getHeaders(token) {
  return {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
}

/**
 * 验证 Token 是否有效
 */
export async function validateToken(token) {
  try {
    const response = await fetch(`${GITHUB_API}/user`, {
      headers: getHeaders(token),
    })
    return response.ok ? await response.json() : null
  } catch (error) {
    console.error('Token validation failed:', error)
    return null
  }
}

/**
 * 创建新仓库
 */
export async function createRepository(token, name, description, isPrivate = true) {
  try {
    const response = await fetch(`${GITHUB_API}/user/repos`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({
        name,
        description: description || `Project: ${name}`,
        private: isPrivate,
        auto_init: true,
        gitignore_template: 'Node',
      }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create repository')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Create repository failed:', error)
    throw error
  }
}

/**
 * 获取用户所有仓库
 */
export async function listRepositories(token) {
  try {
    const response = await fetch(`${GITHUB_API}/user/repos?per_page=100&sort=updated`, {
      headers: getHeaders(token),
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch repositories')
    }
    
    return await response.json()
  } catch (error) {
    console.error('List repositories failed:', error)
    throw error
  }
}

/**
 * 获取仓库详情
 */
export async function getRepository(token, owner, repo) {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: getHeaders(token),
    })
    
    if (!response.ok) {
      throw new Error('Repository not found')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Get repository failed:', error)
    throw error
  }
}

/**
 * 创建或更新文件
 */
export async function createOrUpdateFile(token, owner, repo, path, content, message, branch = 'main') {
  try {
    // 先尝试获取文件（检查是否存在）
    let sha = null
    try {
      const getResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
        headers: getHeaders(token),
      })
      if (getResponse.ok) {
        const data = await getResponse.json()
        sha = data.sha
      }
    } catch (e) {
      // 文件不存在，继续创建
    }
    
    // 编码内容
    const encodedContent = Buffer.from(content).toString('base64')
    
    const body = {
      message,
      content: encodedContent,
      branch,
    }
    
    if (sha) {
      body.sha = sha // 更新已存在的文件需要sha
    }
    
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to write file')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Create/update file failed:', error)
    throw error
  }
}

/**
 * 获取目录内容
 */
export async function getContents(token, owner, repo, path = '', branch = 'main') {
  try {
    const url = path 
      ? `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      : `${GITHUB_API}/repos/${owner}/${repo}/contents?ref=${branch}`
    
    const response = await fetch(url, {
      headers: getHeaders(token),
    })
    
    if (!response.ok) {
      throw new Error('Path not found')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Get contents failed:', error)
    throw error
  }
}

/**
 * 获取文件内容
 */
export async function getFileContent(token, owner, repo, path, branch = 'main') {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
      headers: getHeaders(token),
    })
    
    if (!response.ok) {
      throw new Error('File not found')
    }
    
    const data = await response.json()
    return {
      content: Buffer.from(data.content, 'base64').toString('utf8'),
      sha: data.sha,
      path: data.path,
    }
  } catch (error) {
    console.error('Get file content failed:', error)
    throw error
  }
}

/**
 * 创建分支
 */
export async function createBranch(token, owner, repo, newBranch, fromBranch = 'main') {
  try {
    // 先获取源分支的 SHA
    const refResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`, {
      headers: getHeaders(token),
    })
    
    if (!refResponse.ok) {
      throw new Error('Source branch not found')
    }
    
    const refData = await refResponse.json()
    
    // 创建新分支
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({
        ref: `refs/heads/${newBranch}`,
        sha: refData.object.sha,
      }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create branch')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Create branch failed:', error)
    throw error
  }
}

/**
 * 创建 Pull Request
 */
export async function createPullRequest(token, owner, repo, title, body, headBranch, baseBranch = 'main') {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({
        title,
        body,
        head: headBranch,
        base: baseBranch,
      }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create pull request')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Create PR failed:', error)
    throw error
  }
}

/**
 * 获取提交历史
 */
export async function getCommits(token, owner, repo, limit = 30) {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=${limit}`, {
      headers: getHeaders(token),
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch commits')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Get commits failed:', error)
    throw error
  }
}

/**
 * 解析仓库URL获取owner和repo名
 */
export function parseRepoUrl(url) {
  // 支持格式:
  // https://github.com/owner/repo
  // git@github.com:owner/repo.git
  // owner/repo
  
  let match
  
  if (url.includes('github.com')) {
    // HTTPS URL
    match = url.match(/github\.com\/([^/]+)\/([^/.]+)/)
  } else if (url.includes(':')) {
    // SSH URL
    match = url.match(/:([^/]+)\/([^/.]+)/)
  } else if (url.includes('/')) {
    // Short format owner/repo
    match = url.match(/([^/]+)\/([^/]+)/)
  }
  
  if (match) {
    return {
      owner: match[1],
      repo: match[2].replace('.git', ''),
    }
  }
  
  return null
}
