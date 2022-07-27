# Coding challenge - Submission

## Pre-requisites

### when using the preconfigured database

- [Node.JS](https://nodejs.org/en/) (and npm) must be installed

### when rolling your own database

- [Node.JS](https://nodejs.org/en/) (and npm) must be installed
- PostgreSQL's [ltree extension](https://www.postgresql.org/docs/current/ltree.html) must be installed and enabled; see [this helpful blog](https://patshaughnessy.net/2017/12/12/installing-the-postgres-ltree-extension) for instructions
- [Graphile Migrate](https://github.com/graphile/migrate) must be setup on the DB and the migrations run
- Update `.env` to appropriate values

## How to run

```
npm install
npm start
```

## Things that should change

- use a built/pruned version of Tailwindcss
- avoid global javascript (e.g. RelativeTime)
- "upvotes" table should use logged in user's uuid (instead of users_name)
- don't rely on client/server code to keep the DB consistent; use an on-create hook to increment the value in the "comments" table or consider other strategies
- minify `public/javascripts/app.js`
- indicate which comments have already been liked by the current user

## Preview

<img width="1051" alt="image" src="https://user-images.githubusercontent.com/368767/181362524-d30fafab-9355-42ee-8dd8-db9f14b44435.png">
