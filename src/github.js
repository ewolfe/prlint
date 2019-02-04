const got = require('got');

const { GITHUB_URL = 'https://github.com', GITHUB_API_URL = 'https://api.github.com' } = process.env;

class GithubRepo {
  constructor({ pull_request, installation: { id } }) {
    const { head, base, merge_commit_sha } = pull_request;
    const headRepoFullName = head.repo.full_name;

    this.defaultFailureURL = `${GITHUB_URL}/${headRepoFullName}/blob/${head.sha}/.github/prlint.json`;
    this.ref = merge_commit_sha || head.ref;

    // Get the user's prlint.json settings (returned as base64 and decoded later)
    if (head.repo.fork) {
      this.prlintDotJsonUrl = `${GITHUB_API_URL}/repos/${base.repo.full_name}/contents/.github/prlint.json?ref=${
        head.sha
      }`;
    } else {
      this.prlintDotJsonUrl = `${GITHUB_API_URL}/repos/${headRepoFullName}/contents/.github/prlint.json?ref=${
        this.ref
      }`;
    }

    this.statusUrl = pull_request.statuses_url;
    this.installationId = id;
  }

  createBodyPayload({ failureMessages, failureURLs }) {
    let bodyPayload = {};
    if (!failureMessages.length) {
      bodyPayload = {
        state: 'success',
        description: 'Your validation rules passed',
        context: 'PRLint',
      };
    } else {
      let description = failureMessages[0];
      let URL = failureURLs[0];
      if (failureMessages.length > 1) {
        description = `1/${failureMessages.length - 1}: ${description}`;
        URL = this.defaultFailureURL;
      }
      if (description) {
        bodyPayload = {
          state: 'failure',
          description: description.slice(0, 140), // 140 characters is a GitHub limit
          target_url: URL,
          context: 'PRLint',
        };
      } else {
        bodyPayload = {
          state: 'failure',
          description: 'Something went wrong with PRLint - You can help by opening an issue (click details)',
          target_url: 'https://github.com/ewolfe/prlint/issues/new',
          context: 'PRLint',
        };
      }
    }

    return bodyPayload;
  }

  async getAccessToken({ JWT }) {
    return got.post(`${GITHUB_API_URL}/installations/${this.installationId}/access_tokens`, {
      headers: {
        Accept: 'application/vnd.github.machine-man-preview+json',
        Authorization: `Bearer ${JWT}`,
      },
    });
  }

  async fetchPRLintJson({ accessToken }) {
    const failureMessages = [];

    const prlintDotJsonMeta = await got(this.prlintDotJsonUrl, {
      headers: {
        Accept: 'application/vnd.github.machine-man-preview+json',
        Authorization: `token ${accessToken}`,
      },
    });

    // Convert the base64 contents to an actual JSON object
    let prlintDotJson;
    try {
      prlintDotJson = JSON.parse(Buffer.from(JSON.parse(prlintDotJsonMeta.body).content, 'base64'));
    } catch (e) {
      failureMessages.push(e);
    }

    return { prlintDotJson, failureMessages };
  }

  postValidationStatus({ bodyPayload, accessToken }) {
    return got.post(this.statusUrl, {
      headers: {
        Accept: 'application/vnd.github.machine-man-preview+json',
        Authorization: `token ${accessToken}`,
      },
      body: bodyPayload,
      json: true,
    });
  }

  post404Status({ accessToken }) {
    return got.post(this.statusUrl, {
      headers: {
        Accept: 'application/vnd.github.machine-man-preview+json',
        Authorization: `token ${accessToken}`,
      },
      body: {
        state: 'success',
        description: 'No rules are setup for PRLint',
        context: 'PRLint',
        target_url: `${GITHUB_URL}/apps/prlint`,
      },
      json: true,
    });
  }

  post500Status({ accessToken, exception }) {
    return got.post(this.statusUrl, {
      headers: {
        Accept: 'application/vnd.github.machine-man-preview+json',
        Authorization: `token ${accessToken}`,
      },
      body: {
        state: 'error',
        description: 'An error occurred with PRLint. Click details to open an issue',
        context: 'PRLint',
        target_url: `https://github.com/ewolfe/prlint/issues/new?title=Exception Report&body=${encodeURIComponent(
          exception.toString(),
        )}`,
      },
      json: true,
    });
  }
}

module.exports = GithubRepo;
