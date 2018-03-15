<p align="center">
	<img width="248" src="https://cdn.rawgit.com/ewolfe/prlint/master/assets/logomark-stylized.svg" alt="PRLint">
</p>

# PRLint

> GitHub App for linting pull requests

[![Uptime Robot status](https://img.shields.io/uptimerobot/status/m779695827-b37294d12c5f3ad174528d33.svg)](https://stats.uptimerobot.com/ZzYnEf2BW)
[![Greenkeeper badge](https://badges.greenkeeper.io/ewolfe/prlint.svg)](https://greenkeeper.io/)
[![Test Coverage](https://api.codeclimate.com/v1/badges/a99a88d28ad37a79dbf6/test_coverage)](https://codeclimate.com/github/codeclimate/codeclimate/test_coverage)

- Lint pull request branch name
- Lint pull request title
- Lint pull request description
- Lint all the things...
- Anything listed in the [pull request object](https://developer.github.com/v3/pulls/#get-a-single-pull-request
)


[![Success](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-success.png)](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-success.png)

[![Error](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-error.png)](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-error.png)

## Motivation

The goal of this app is to help projects reach the next level of consistency. Code linting tools like ESLint help produce top quality code, but software is so much more than just code. It’s organization, labeling, naming, tagging, filing, referencing... With this app installed on a repo/org you’ll be able to enforce a myriad of rules for your pull requests through the use of regular expressions.

<!--
This aims to be a generic solution for maintaining consistency. Some use cases:

- Enforce branch folders
- Enforce ticket numbers in title/description
- Enforce labels to be be attached -->

## Install

[![Install](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-install.png)](https://github.com/apps/prlint)

> [https://github.com/apps/prlint](https://github.com/apps/prlint)

## Usage

1. Add this file `.github/prlint.json` to the root of your project:
```javascript
{
  "title": [
    {
      "pattern": "^(feat|fix|docs|style|refactor|perf|test|chore)((.+))?:\\s.+",
      "flags": ["i"],
      "message": "Your PR title is in a bad format"
    }
  ],
  "head.ref": [
    {
      "pattern": "^(feat|fix|docs|style|refactor|perf|test|chore)\\/.+",
      "message": "Your branch name is invalid"
    }
  ]
}
```

2. Then open a pull request as such:
  - Make sure your title is "chore: add prlint"
    - You can also set the title to "CHORE: add prlint" since we passed the flag `i` which makes our regex case insensitive.
  - Make sure your branch name is `chore/add-prlint`

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
  "milestone.id": [
    {
      "pattern": "\\d"
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
- `message`: optional string for customizing the error message on the pull request page

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
