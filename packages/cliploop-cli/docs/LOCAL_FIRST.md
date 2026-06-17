# Local-First Policy

ClipLoop is designed to work without a hosted service.

## Required behavior

- all core commands run locally
- state is stored inside the repo in `.cliploop/`
- commands do not post to social platforms
- commands do not scrape content
- commands do not upload media automatically
- commands do not require an account login

## What the CLI may do

- read the local repository
- write script/storyboard/render artifacts
- call local FFmpeg
- create files that the user can inspect or export manually

## What it must not do in v0.1.0

- train a video model
- call closed-source video APIs
- auto-publish anywhere
- fetch remote product data silently
- depend on a remote render service
