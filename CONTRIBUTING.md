# Contributing

First off, thank you for taking the time and effort to contribute! It means a lot to me :3
Make sure to read this whole page, I promise you it's not a mouthful <img src="https://em-content.zobj.net/content/2020/07/27/funnyface.png" alt="TikTok emote of a pink face sticking out its tongue, [funnyface]" width=20 height=20 align="top" />

## Building locally

### Prerequisites

- [NodeJS (LTS)](https://nodejs.org/en/download/package-manager) **>= v20**
- [pnpm](https://pnpm.io/installation) **>= v10**
  - Any other node package manager can be used, but you'll have to modify the scripts in `package.json`
- [git](https://git-scm.com/)

### Optional

- [dprint](https://dprint.dev)
  - A file formatter the build script uses for formatting generated markdown files. It's not an npm dependency, so it doesn't get installed automatically. Will simply write markdown files unformatted if not installed

### Steps

Start by cloning the repository:

```sh
git clone https://github.com/nexpid/RevengePlugins.git --branch dev
```

> [!CAUTION]
> Make sure your changes are made to the `dev` branch, not the `main` branch.

Then, install dependencies, build plugins and run the server.

```sh
pnpm i
pnpm dev
pnpm serve # ps: you should open another terminal tab for this
```

> [!TIP]
> Building plugins in dev mode (`pnpm build --dev`) won't minify their dist syntax to make plugins easier to debug.

Finally, make sure your phone and your computer are connected to the same network, and look for the correct IP address.
You can now install whatever plugin you want using that IP at port `:8731`, e.g., `http://192.168.2.22:8731/cloud-sync`

### Live refetch

If you want to go a step further, you can live refetch plugins with the `rejuvenate` plugin.
Start by running the same code snippet as above, but using the `watch` script instead of `dev`:

```sh
pnpm watch # doesn't build every plugin on startup!
pnpm serve # ps: you should open another terminal tab for this
```

Then, install the `rejuvenate.dev`[^1] plugin, and you're done! Your plugins now automatically refresh when you edit any file.

## Testing github workflows

### Prerequisites

- [Docker](https://docs.docker.com/get-started/get-docker/)
- [act](https://nektosact.com/)
- [GitHub cli](https://cli.github.com/)

### Steps

Start by cloning the repository:

```sh
git clone https://github.com/nexpid/RevengePlugins.git --branch dev
```

> [!CAUTION]
> Make sure your changes are made to the `dev` branch, not the `main` branch.

Then, copy and paste `.actrc.sample` to `.actrc` and replace **<TOKEN HERE>** with the output of `gh auth token`:

```sh
cp .actrc.sample .actrc
sed -i s/<TOKEN HERE>/$(gh auth token)/g" ".actrc"
```

Finally, make your changes, test them with act and you're done!

```sh
act -W ".github/workflows/<workflow>.yml"
```

## Commiting your changes

Before you start committing your changes, you need to make sure your workspace is set up correctly.
For starters, make sure you're on a seperate feature branch, which should be titled `feat/<summary of your changes>`:

```sh
git remote add upstream https://github.com/nexpid/RevengePlugins.git # add the upstream remote
git fetch upstream # fetch all of its branches
git checkout -b feat/......... upstream/dev # switch to a new branch based on upstream/dev
```

Then, make sure to split them up into multiple commits for better readability.
While not required, it's recommended to title your commits based on this modified version of [semantic commit messages](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716) I use:

- `feat` — any general changes to the codebase (e.g., adding a feature to a plugin)
- `fix` — a commit specifically fixing some part of the code (e.g., fixing a bug in a plugin)
- `refactor` — refactoring a big portion of the codebase (e.g., reworking a plugin)
- `chore` — some automated task (e.g., running a linter)
- `docs` — changes to markdown files, like this one (e.g., fixing a tpyo in CONTRIBUTING.md)

Once you're done, push your changes to origin, and create a PR!

```sh
git push origin feat/......... # ps: as of august 2024, vs code source control doesn't let you push to a different remote, you must do this using git
```

Happy contributing!!

[^1]: Plugins marked as "dev only" (plugin path ending with `.dev`) will only be built in watch mode (`pnpm watch`) or a dev build (`pnpm dev`)
