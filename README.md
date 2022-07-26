# Coding challenge - Submission

## Pre-requisites

- [Node.JS](https://nodejs.org/en/) (and npm) must be installed
- An active internet connection (unless specifying a local DB)

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

<img width="688" alt="image" src="https://user-images.githubusercontent.com/368767/180865643-cac66031-f1fc-4b43-a2b2-23d71f9b99e1.png">
