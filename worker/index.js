/**
 * Claude Creations - Auto-Submit Worker
 * Moderates submissions with Claude Haiku and auto-adds approved projects to GitHub
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    }

    try {
      const formData = await request.json();

      // Validate required fields
      const { projectName, creatorName, email, projectUrl, category, description, firstProject, imageUrl } = formData;

      if (!projectName || !creatorName || !email || !category || !description) {
        return jsonResponse({ success: false, error: 'Missing required fields' }, 400);
      }

      // Moderate content with Claude Haiku
      console.log('Moderating submission:', projectName);
      const moderationResult = await moderateWithClaude(env.CLAUDE_API_KEY, {
        projectName,
        creatorName,
        description,
        projectUrl
      });

      console.log('Moderation result:', moderationResult);

      if (!moderationResult.approved) {
        return jsonResponse({
          success: false,
          error: 'Submission flagged for review. A human will review it shortly.',
          reason: moderationResult.reason
        }, 400);
      }

      // Add to GitHub
      console.log('Adding to GitHub...');
      await addProjectToGitHub(env.GITHUB_TOKEN, {
        projectName,
        creatorName,
        projectUrl,
        category,
        description,
        firstProject: firstProject === true || firstProject === 'on',
        imageUrl
      });

      return jsonResponse({
        success: true,
        message: 'Project approved and added! It will appear on the site in about 30 seconds.'
      });

    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({ success: false, error: 'Something went wrong. Please try again.' }, 500);
    }
  }
};

async function moderateWithClaude(apiKey, submission) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `You are a content moderator for Claude Creations, a website showcasing projects built with Claude AI.

Review this submission and determine if it should be approved or rejected.

REJECT if ANY of these apply:
- Contains profanity, slurs, hate speech, or offensive language
- Appears to be spam, advertising, or trolling
- Contains suspicious, malicious, or phishing links
- Is clearly not a real project (gibberish, test submission, jokes)
- Contains harmful, illegal, violent, or sexually inappropriate content
- Promotes scams or fraudulent activity
- Is a duplicate or very low-effort submission

APPROVE if:
- It appears to be a legitimate project built with Claude, Claude Code, or AI assistance
- The description makes sense and describes an actual project
- Even simple or small projects are fine if they're genuine

Submission to review:
- Project Name: ${submission.projectName}
- Creator: ${submission.creatorName}
- Description: ${submission.description}
- URL: ${submission.projectUrl || 'Not provided'}

Respond with ONLY a JSON object in this exact format, no other text:
{"approved": true, "reason": "brief reason"}
or
{"approved": false, "reason": "brief reason why rejected"}`
      }]
    })
  });

  if (!response.ok) {
    console.error('Claude API error:', await response.text());
    // Default to requiring manual review if API fails
    return { approved: false, reason: 'Moderation service unavailable' };
  }

  const data = await response.json();
  const content = data.content[0].text.trim();

  try {
    // Handle potential markdown code blocks
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    console.error('Failed to parse moderation response:', content);
    return { approved: false, reason: 'Could not parse moderation response' };
  }
}

async function addProjectToGitHub(token, project) {
  const repo = 'SoloOrTroll/claudecreations';
  const path = 'index.html';

  // Get current file content
  const getResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ClaudeCreations-AutoSubmit'
    }
  });

  if (!getResponse.ok) {
    throw new Error(`Failed to get file: ${await getResponse.text()}`);
  }

  const fileData = await getResponse.json();
  const currentContent = decodeBase64(fileData.content);
  const sha = fileData.sha;

  // Generate new card HTML
  const newCard = generateProjectCard(project);

  // Find the insertion point (before the closing </div> of projects-grid)
  const marker = '</div>\n\n        <div class="load-more-container">';
  const insertPoint = currentContent.lastIndexOf(marker);

  if (insertPoint === -1) {
    throw new Error('Could not find insertion point in HTML');
  }

  const newContent =
    currentContent.slice(0, insertPoint) +
    newCard + '\n\n            ' +
    currentContent.slice(insertPoint);

  // Commit the change
  const updateResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ClaudeCreations-AutoSubmit'
    },
    body: JSON.stringify({
      message: `Add project: ${project.projectName}\n\nSubmitted by ${project.creatorName}\nAuto-approved by Claude Haiku`,
      content: encodeBase64(newContent),
      sha: sha,
      branch: 'main'
    })
  });

  if (!updateResponse.ok) {
    throw new Error(`Failed to update GitHub: ${await updateResponse.text()}`);
  }
}

function generateProjectCard(project) {
  const categoryLabels = {
    visualizer: 'Visualizer',
    game: 'Game',
    tool: 'Tool',
    website: 'Website',
    app: 'App',
    other: 'Project'
  };

  const categoryLabel = categoryLabels[project.category] || 'Project';

  // Format author name
  let authorDisplay = project.creatorName;
  if (!authorDisplay.startsWith('@') && !authorDisplay.startsWith('u/')) {
    authorDisplay = `by ${authorDisplay}`;
  } else {
    authorDisplay = `by ${authorDisplay}`;
  }

  // Determine link text based on URL
  let linkText = 'View Project →';
  let sourceBadge = '';

  if (project.projectUrl) {
    if (project.projectUrl.includes('github.com')) {
      linkText = 'View on GitHub →';
    } else if (project.projectUrl.includes('reddit.com')) {
      linkText = 'View on Reddit →';
      sourceBadge = `<span class="source-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                        </span>`;
    } else if (project.projectUrl.includes('x.com') || project.projectUrl.includes('twitter.com')) {
      linkText = 'View on X →';
      sourceBadge = `<span class="source-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </span>`;
    } else if (project.projectUrl.includes('youtube.com') || project.projectUrl.includes('youtu.be')) {
      linkText = 'Watch on YouTube →';
    }
  }

  // First project badge
  const firstProjectBadge = project.firstProject ? `
                        <span class="experience-badge">
                            <span class="badge-icon">✨</span>
                            First project ever
                        </span>` : '';

  // Image section - use provided URL or placeholder
  let imageSection;
  if (project.imageUrl && project.imageUrl.trim()) {
    imageSection = `<img src="${escapeHtml(project.imageUrl)}" alt="${escapeHtml(project.projectName)}" class="card-img">`;
  } else {
    const gradientNum = Math.floor(Math.random() * 5) + 1;
    imageSection = `<div class="image-placeholder gradient-${gradientNum}">
                            <span class="placeholder-icon">✦</span>
                        </div>`;
  }

  const projectUrl = project.projectUrl || '#';

  return `<!-- Project Card - ${escapeHtml(project.projectName)} (Community Submitted) -->
            <article class="project-card" data-category="${escapeHtml(project.category)}">
                <a href="${escapeHtml(projectUrl)}" target="_blank" rel="noopener" class="card-image-link">
                    <div class="card-image">
                        ${imageSection}
                        ${sourceBadge}
                    </div>
                </a>
                <div class="card-content">
                    <div class="card-meta">
                        <span class="meta-tag">${categoryLabel}</span>
                        <span class="meta-dot">·</span>
                        <span class="meta-author">${escapeHtml(authorDisplay)}</span>
                    </div>
                    <h3 class="card-title">${escapeHtml(project.projectName)}</h3>
                    <p class="card-desc">${escapeHtml(project.description)}</p>
                    <div class="card-footer">${firstProjectBadge}
                        <a href="${escapeHtml(projectUrl)}" target="_blank" rel="noopener" class="card-link">${linkText}</a>
                    </div>
                </div>
            </article>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function decodeBase64(str) {
  // Properly decode base64 with UTF-8 support
  const cleaned = str.replace(/\n/g, '');
  const binaryStr = atob(cleaned);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

function encodeBase64(str) {
  // Properly encode UTF-8 to base64
  const bytes = new TextEncoder().encode(str);
  let binaryStr = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryStr += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryStr);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
