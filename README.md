<p align="center">
	<img width="248" src="https://cdn.rawgit.com/ewolfe/prlint/master/assets/logomark-stylized.svg" alt="PRLint">
</p>

# PRLint

> GitHub App for linting pull requests

[![Uptime Robot status](https://img.shields.io/uptimerobot/status/m779695827-b37294d12c5f3ad174528d33.svg)](https://stats.uptimerobot.com/ZzYnEf2BW)
[![Greenkeeper badge](https://badges.greenkeeper.io/ewolfe/prlint.svg)](https://greenkeeper.io/)
[![Test Coverage](https://api.codeclimate.com/v1/badges/a99a88d28ad37a79dbf6/test_coverage)](https://codeclimate.com/github/ewolfe/prlint)

This project was created after working on a team that had poor conventions for pull request titles/descriptions and git branch names.

PRLint aims to solves those problems, and more. For example, you can:

- Enforce PR’s to follow a naming convention for titles
- Enforce PR’s to to have certain elements within a description
	- A link to a ticket
	- A link to a dev/qa/staging url
	- An @ mention
- Enforce PR’s to have multiple reviewers before it can be merged
	- Including teams (within an organization)
	- Or just a specific person
- Enforce PR’s to have an assignee before it can be merged
- Enforce PR’s to have a label before it can be merged
- Enforce PR’s to have a milestone before it can be merged
- Enforce PR’s to have comments/commits/additions/deletions/changed files within a certain number range
	- Set a limit on the number of additions/deletions that you can perform within a single PR
- Enforce anything listed in the [pull request object](https://github.com/ewolfe/prlint/wiki/sample-pull-request-object)


It works by reading a configuration file within your project (which consists of regular expressions) and returning a fail/pass status to your pull request. See the screenshots below.

## Sceenshots

[![Success](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-success.png)](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-success.png)

[![Error](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-error.png)](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-error.png)

## Install

[![Install](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-install.png)](https://github.com/apps/prlint)

> [https://github.com/apps/prlint](https://github.com/apps/prlint)

## Usage

1. Install the GitHub app by clicking install above
1. Add this file `.github/prlint.json` to the root of your project:
```javascript
{
  "title": [
    {
      "pattern": "^(feat|fix|docs|style|refactor|perf|test|chore)((.+))?:\\s.+",
      "message": "Your PR title is in a bad format"
    }
  ]
}
```

3. Then open a pull request with the title "chore: add prlint"

<p align="center">
  <img src="https://cdn.rawgit.com/ewolfe/prlint/master/assets/demo.gif" alt="Demo">
</p>

## API

### Keys:

The top level keys are keys that the GitHub API exposes when a pull request is opened, edited, etc.

You can use anything listed in the sample response object here https://developer.github.com/v3/pulls/#get-a-single-pull-request

To target a nested object, you can use dot notation encoded within the key string. i.e.:

```javascript
{
  "assignee.login": [
    {
      "pattern": "octocat"
    }
  ]
}
```

### Values:

The top level values are where you get to define your validation rules. You can have multiples rules, so we expect an array (even if you only have a single validation rule).

- Each item in the array needs to be an object:
- `pattern:` javascript [Regular Expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#Syntax)
  - *Special characters must be escaped*
    i.e. If you want to check for a whitespace, use `"pattern": "\\s"` vs `"pattern": "\s"`
- `flags:` optional array of strings used in the [Regular Expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
    - For example, this can be used to make your regex case insensitive
- `message`: optional string for customizing the error message on the pull request page

## Examples

```javascript
{
  "title": [
    {
      "pattern": "^(feat|fix|docs|style|refactor|perf|test|chore):\\s",
      "message": "Your PR title doesn’t match our schema"
    }
  ],
  "body": [
    {
      "pattern": "JIRA-\\d{1,4}",
      "message": "You need a JIRA ticket in your description"
    },
    {
      "pattern": ".{1,}",
      "message": "You need literally anything in your description"
    }
  ],
  "head.ref": [
    {
      "pattern": "^(feat|fix|docs|style|refactor|perf|test|chore)/",
      "message": "Your branch name is invalid"
    }
  ],
  "assignee.login": [
    {
      "pattern": ".+",
      "message": "Your need to assign someone"
    }
  ],
  "requested_reviewers.0.id": [
    {
      "pattern": "\\d",
      "message": "You need at least 1 reviewer"
    }
  ],
  "requested_reviewers.1.id": [
    {
      "pattern": "\\d",
      "message": "You need at least 2 reviewers"
    }
  ],
  "requested_teams.0.id": [
    {
      "pattern": "2691982",
      "message": "The product team needs to be added as a reviewer"
    }
  ],
  "additions": [
    {
      "pattern": "0|^[1-9]$|^[1-9]\\d$",
      "message": "Your PR should have less than 99 additions"
    }
  ],
  "labels.0.name": [
    {
      "pattern": "bug|enhancement|question",
      "message": "Your PR should have a basic label attached as the first label"
    }
  ]
}
```

## Contribute

PR's and issues welcome!

## License

MIT

---

###### Credits

- [“Dust Bunny”](https://thenounproject.com/term/lint/176538/) icon by Erika Kim from [the Noun Project](https://thenounproject.com/).

###### Install

[![Install](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-install.png)](https://github.com/apps/prlint)

> [https://github.com/apps/prlint](https://github.com/apps/prlint)
