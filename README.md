<p align="center">
	<img width="248" src="https://cdn.rawgit.com/ewolfe/prlint/master/assets/logomark-stylized.svg" alt="PRLint">
</p>

# PRLint

> GitHub App for linting pull requests

- Lint pull request branch name
- Lint pull request title
- Lint pull request description
- Lint all the things...
- Anything listed in the [pull request object](https://developer.github.com/v3/pulls/#get-a-single-pull-request
)


[![Success](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-success.png)](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-success.png)

[![Error](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-error.png)](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-error.png)

## Install

[https://github.com/apps/prlint](https://github.com/apps/prlint)

[![Install](https://cdn.rawgit.com/ewolfe/prlint/master/assets/screenshot-install.png)](https://github.com/apps/prlint)

## Usage

1. Add this file `.github/prlint.json` to the root of your project:
```javascript
{
  "title": [
    {
      "pattern": "^(feat|fix|docs|style|refactor|perf|test|chore):\\s",
      "flags": ["i"]
    }
  ],
  "head.ref": [
    {
      "pattern": "^(feat|fix|docs|style|refactor|perf|test|chore)/"
    }
  ]
}
```

2. Then open a pull request as such:
  - Make sure your title is "chore: add prlint"
    - You can also set the title to "CHORE: add prlint" since we passed the flag `i` which makes our regex case insensitive.
  - Make sure your branch name is `chore/add-prlint`

## API

### Keys:

The top level keys are keys that the GitHub API exposes when a pull request is opened, edited, etc.

You can use anything listed in the sample response object here https://developer.github.com/v3/pulls/#get-a-single-pull-request

To target a nested object, you can use dot notation encoded within the key string. i.e.:

```json
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

- Each item in the array needs to be an object.
- Each object requires a `pattern` key with which is a javascript Regular Expression stored in a string
- **Special characters must be escaped**
    i.e. If you want to check for a whitespace, use `"pattern": "\\s"` instead of just `"pattern": "\s"`
- The `flags` array is optional

> See [RegExp Syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#Syntax) for full documentation on MDN.

## Support

If you’re reading this, congratulations! You’re one of the first ~250 users. For any bugs or feature requests please send me a direct email at [e@ewolfe.me](mailto:e@ewolfe.me) or open an [issue](https://github.com/ewolfe/prlint/issues/new).

(Why 250? GitHub requires apps to have a [minimum of 250 users](https://developer.github.com/apps/adding-integrations/listing-apps-on-github-marketplace/requirements-for-listing-an-app-on-github-marketplace/) before you can list it on the marketplace. And until then I’m okay with getting direct emails for support.)

## Developing

1. Get the `.env` file from @ewolfe
1. `$ nvm use`
1. `$ yarn`
1. `$ yarn dev`

---

###### Credits

- [“Pinch”](https://thenounproject.com/term/pinch/736992/) icon by Anna Ho from [the Noun Project](https://thenounproject.com/).
