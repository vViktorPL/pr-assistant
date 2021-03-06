# PR Assistant

A dev tool that helps in your daily code review routine. To achieve that, it 
lists pull requests that require your attention by tagging them with some pseudo-statuses:

* 👍 - You have approved this PR
* ✔ - You have left some feedback and pre-approved this PR.
* ⏳ - PR author needs to address your comments.
* 👀 - Some new changes has been pushed since your last comments in this PR.
* 🆕 - This PR has been created less than 10 minutes ago.
* 😜 - This is your own PR (no CR needed from your side).

## Supported platforms

Currently this tool supports only repositories that are hosted on gitlab.com (no self hosting support).

## Setup

```bash
npm i
```

## Start

```bash
npm start
```


## Roadmap

* Possibility to mark PR as "reviewed" manually (local state)
    * New status needed for that
    * It should be able to go to "👀" state if PR changed after last manual review click
* Edit repositories
* Delete repositories
* GitLab integration improvements
    * Setup
        * Auto-suggest filter labels
        * Auto-suggest repository paths by quering for private ones
