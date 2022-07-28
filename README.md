# Coding challenge - Submission

## Pre-requisites

### easy -- using the preconfigured database

- [Node.JS](https://nodejs.org/en/) (and npm) must be installed

### less easy -- rolling your own database

- [Node.JS](https://nodejs.org/en/) (and npm) must be installed
- PostgreSQL's [ltree extension](https://www.postgresql.org/docs/current/ltree.html) and [uuid-osp](https://www.postgresql.org/docs/current/uuid-ossp.html) extensions must be installed in the DB
- Update `.env` to appropriate values
- Run `graphile-migrate watch` in addition to `npm start`; see [Graphile Migrate](https://github.com/graphile/migrate) for more information

## How to run

```
npm install
npm start
```

## Future improvements

- use a built/pruned version of Tailwindcss
- avoid global javascript (e.g. RelativeTime)
- the "upvotes" table should use the logged in user's _uuid_ (rather than _users_name_)
- shouldn't rely on client/server code to keep the DB consistent; use an on-create hook to increment the value in the "comments" table or consider other strategies to cache this value
- minify `public/javascripts/app.js`
- indicate which comments have already been liked by the current user using color
- pagination and/or lazy-loading for longer comment threads

## Preview

<img width="1092" alt="image" src="https://user-images.githubusercontent.com/368767/181626523-aa01449d-524f-480b-9766-20ce5caabeda.png">
