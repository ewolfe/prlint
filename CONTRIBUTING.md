# Contributing

## Quick Dev Setup

```sh
$ nvm use
$ yarn
$ yarn test
$ yarn dev
```

# Developing and testing locally

This app is built using Probot and it is highly recommended to give their [docs](https://probot.github.io/docs) a thorough reading. Most of the instructions below are snippets from their guides.

## Starting local server

1. To run the app on your local machine, run `npm run dev` (or `yarn dev`) to start the server.
2. Next, visit `http://localhost:3000` on a browser.
3. You should see something like this:
   ![Local run welcome screenshot](https://user-images.githubusercontent.com/13410355/46052950-a19e2900-c10e-11e8-9e7e-0c803b8ca35c.png 'Local run welcome screenshot')
4. Go ahead and click the Register a GitHub App button.
5. Next you'll get to decide on an app name that isn't already taken.
6. After registering your GitHub App, you'll be redirected to install the app on any repos.
7. At the same time, you can check your local `.env` and notice it will be populated with values GitHub sends us in the course of that redirect.
8. Install the app on a test repo and try triggering a webhook to activate the bot!

## Environment variables

If you run `npm run dev` or `yarn dev`, these values will be populated for you automatically in `.env`.

Alternatively, you can [manually configure](https://probot.github.io/docs/development/#manually-configuring-a-github-app) them.

As a **fallback**, during development, dummy environment variables are used from `.env.example`. It is highly recommended that you use your own values by copying `.env.example` to `.env` and modifying the variables. `.env` is ignored via `.gitignore` so you can work locally without exposing any secrets or accidentally modifying `.env.example`.

Refer to [Environment configuration](https://probot.github.io/docs/configuration/) for details on each variable.

## Testing locally

### Simulating webhooks

You can [Simulate receiving webhooks](https://probot.github.io/docs/simulating-webhooks/) by running:

```sh
node_modules/.bin/probot receive -e pull_request -p test/payload-normal.json ./index.js
```

or you can send events to your locally configured app which will be forwarded via smee.io proxy URL (check `WEBHOOK_PROXY_URL` in `.env.`) to your local server.

### Unit tests

Run `npm test` (or `yarn test`) to run test locally. If you use VSCode, you can also debug your tests by using one of the 2 launch configurations (checkout `.vscode/lainch.json` for details).
