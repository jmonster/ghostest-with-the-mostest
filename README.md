# Coding challenge - Submission

## Pre-requisites

- [Node.JS](https://nodejs.org/en/) (and npm) must be installed
- An active internet connection (unless specifying a local DB)

## How to run

```
npm install
npm run start
```

## Things that should change

- use a built/pruned version of Tailwindcss
- avoid global javascript (e.g. RelativeTime)
- "upvotes" table should use logged in user's uuid (instead of users_name)
- don't rely on client/server code to keep the DB consistent; use an on-create hook to increment the value in the "comments" table or consider other strategies
- minify app.js
- store fields (such as vote counts) on data attributes rather than encoding it in the element's id/class fields
