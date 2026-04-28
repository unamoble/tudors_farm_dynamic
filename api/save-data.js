const ALLOWED_PATHS = new Set([
  'data/rooms.json',
  'data/gallery.json',
  'data/config.json'
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !owner || !repo) {
      return res.status(500).json({ error: 'Missing GitHub environment variables' });
    }

    const { path, content, message } = req.body || {};

    if (!ALLOWED_PATHS.has(path)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    if (typeof content === 'undefined') {
      return res.status(400).json({ error: 'Missing content' });
    }

    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'tudor-farm-vercel-cms'
    };

    const getResponse = await fetch(`${apiBase}?ref=${branch}`, {
      headers: authHeaders
    });

    if (!getResponse.ok) {
      return res.status(getResponse.status).json({
        error: `Failed to read existing file: ${await getResponse.text()}`
      });
    }

    const existing = await getResponse.json();
    const sha = existing.sha;

    const jsonString = JSON.stringify(content, null, 2) + '\n';
    const encodedContent = Buffer.from(jsonString, 'utf8').toString('base64');

    const updateResponse = await fetch(apiBase, {
      method: 'PUT',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message || `Update ${path}`,
        content: encodedContent,
        sha,
        branch
      })
    });

    if (!updateResponse.ok) {
      return res.status(updateResponse.status).json({
        error: `Failed to update file: ${await updateResponse.text()}`
      });
    }

    const result = await updateResponse.json();
    return res.status(200).json({
      ok: true,
      commitSha: result.commit?.sha || null
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unknown server error' });
  }
}
