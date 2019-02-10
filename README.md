
# PRLint

> GitHub App for linting pull requests

[![Uptime Robot status](https://img.shields.io/uptimerobot/status/m779695827-b37294d12c5f3ad174528d33.svg)](https://stats.uptimerobot.com/ZzYnEf2BW)
[![Greenkeeper badge](https://badges.greenkeeper.io/ewolfe/prlint.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/ewolfe/prlint.svg?branch=master)](https://travis-ci.org/ewolfe/prlint)
[![Test Coverage](https://api.codeclimate.com/v1/badges/fb62a8bd830f8ae59327/test_coverage)](https://codeclimate.com/github/ewolfe/prlint)
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors)
[![Join the community on Spectrum](https://withspectrum.github.io/badge/badge.svg)](https://spectrum.chat/prlint)


## The Problem

You want your pull requests to have a consistent convention for titles, descriptions, branch names, labels, milestones, and more.

## This Solution

PRLint will let you run regular expressions against your pull request meta data. You can then enable PRLint status checks to pass before a pull request can be merged.

## Screenshots

[![Success](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-success.png)](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-success.png)

[![Error](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-error.png)](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-error.png)

## Example Rules

`.github/prlint.json`

```javascript
{
  "title": [
    {
      "pattern": "^(build|ci|docs|feat|fix|perf|refactor|style|test):\\s",
      "message": "Your title needs to be prefixed with a topic"
    }
  ],
  "body": [
    {
      "pattern": "JIRA-\\d{1,4}",
      "flags": ["i"],
      "message": "You need a JIRA ticket in your description"
    },
    {
      "pattern": ".{1,}",
      "message": "You need literally anything in your description"
    }
  ],
  "head.ref": [
    {
      "pattern": "^(build|ci|docs|feat|fix|perf|refactor|style|test)/",
      "message": "Your branch name is invalid"
    }
  ],
  "assignee.login": [
    {
      "pattern": ".+",
      "message": "You need to assign someone"
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
      "message": "Your PR is too big (over 99 additions)"
    }
  ],
  "labels.0.name": [
    {
      "pattern": "bug|enhancement|question",
      "message": "Please add a label"
    }
  ]
}
```

You can check anything listed in the [pull request object](https://developer.github.com/v3/pulls/#get-a-single-pull-request)

## Install

1.  Install via https://github.com/apps/prlint
1.  Add this file `.github/prlint.json` to the root of your project:

```javascript
{
  "title": [
    {
      "pattern": "^(build|ci|docs|feat|fix|perf|refactor|style|test)((.+))?:\\s.+",
      "message": "Your title needs to be prefixed with a topic"
    }
  ]
}
```

3.  Test it by opening a pull request with the title "chore: add prlint"

<p align="center">
  <img src="https://cdn.rawgit.com/ewolfe/prlint/master/assets/demo.gif" alt="Demo">
</p>

## Usage

### Keys:

The top level keys are keys that the GitHub API exposes when a pull request is opened, edited, etc.

You can use anything listed in the sample response object here
[sample response object here](https://developer.github.com/v3/pulls/#get-a-single-pull-request)

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

* Each item in the array needs to be an object:
* `pattern:` javascript [Regular Expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#Syntax)
  * _Special characters must be escaped_
    i.e. If you want to check for a whitespace, use `"pattern": "\\s"` vs `"pattern": "\s"`
* `flags:` optional array of strings used in the [Regular Expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
  * For example, this can be used to make your regex case insensitive
* `message`: optional string for customizing the error message on the pull request page

## Credits

* [“Dust Bunny”](https://thenounproject.com/term/lint/176538/) icon by Erika Kim from [the Noun Project](https://thenounproject.com/).

## License

MIT

## Contributors

Thanks goes to these wonderful people ([emoji key](https://github.com/all-contributors/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
| [<img src="https://avatars3.githubusercontent.com/u/781818?v=4" width="100px;" alt="Hrusikesh Panda"/><br /><sub><b>Hrusikesh Panda</b></sub>](http://about.me/hkpanda)<br />[🚇](#infra-mrchief "Infrastructure (Hosting, Build-Tools, etc)") [⚠️](https://github.com/ewolfe/prlint/commits?author=mrchief "Tests") [💻](https://github.com/ewolfe/prlint/commits?author=mrchief "Code") |
| :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
