-- Enter migration here
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "ltree";

DROP TABLE
  IF EXISTS upvotes CASCADE;

DROP TABLE
  IF EXISTS comments CASCADE;

CREATE TABLE
  comments(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    users_name VARCHAR(128) NOT NULL,
    avatar_url VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    body VARCHAR(280) NOT NULL,
    upvote_count INT4 DEFAULT 0 NOT NULL,
    path ltree
  );

-- upvote table ensures that a user may only upvote each comment once
CREATE TABLE
  upvotes(
    comment_id UUID REFERENCES comments(id) NOT NULL,
    users_name VARCHAR(128) NOT NULL,
    UNIQUE (comment_id, users_name)
  );

-- Initial seed data for demonstration
insert into
  comments (
    id,
    users_name,
    body,
    avatar_url,
    upvote_count,
    created_at,
    path
  )
values
  (
    'e2781ebc-20a0-4f7f-b6b3-6ef00a1462f8',
    'Mr. Snrub',
    'I-- I say we invest that money back in the nuclear plant.',
    '/images/snrub.webp',
    2,
    '2022-07-24 19:57:56.681757+00',
    'e2781ebc20a04f7fb6b36ef00a1462f8'
  );

insert into
  upvotes (comment_id, users_name)
values
  (
    'e2781ebc-20a0-4f7f-b6b3-6ef00a1462f8',
    'Waylon Smithers'
  );

insert into
  upvotes (comment_id, users_name)
values
  (
    'e2781ebc-20a0-4f7f-b6b3-6ef00a1462f8',
    'Mr. Snrub'
  );

-- nested under Snrub's comment
insert into
  comments (
    id,
    users_name,
    body,
    avatar_url,
    upvote_count,
    created_at,
    path
  )
values
  (
    '92285661-d2d0-4859-bfad-e9d99db7fea3',
    'Waylon Smithers',
    'I like the way Snrub thinks.',
    '/images/smithers.webp',
    1,
    '2022-07-24 19:58:56.681757+00',
    'e2781ebc20a04f7fb6b36ef00a1462f8.92285661d2d04859bfade9d99db7fea3'
  );

insert into
  upvotes (comment_id, users_name)
values
  (
    '92285661-d2d0-4859-bfad-e9d99db7fea3',
    'Waylon Smithers'
  );

insert into
  comments (
    id,
    users_name,
    body,
    avatar_url,
    upvote_count,
    created_at,
    path
  )
values
  (
    '6d754120-b79f-4467-970f-0dabba18bb4f',
    'Apu Nahasapeemapetilon',
    'Pardon me, but I would like to see this money spent on police officers. I have been shot eight times this year, and as a result, I almost missed work.',
    '/images/apu.png',
    0,
    '2022-07-24 13:57:56.681757+00',
    '6d754120b79f4467970f0dabba18bb4f'
  );

-- nested under Apu's comment
insert into
  comments (
    id,
    users_name,
    body,
    avatar_url,
    upvote_count,
    created_at,
    path
  )
values
  (
    '3da49b17-1a1a-4f36-a697-7ce720123efa',
    'Clancy Wiggum',
    'Crybaby!',
    '/images/wiggums.jpg',
    3,
    '2022-07-24 14:57:56.681757+00',
    '6d754120b79f4467970f0dabba18bb4f.3da49b171a1a4f36a6977ce720123efa'
  );

-- ensure the upvote records correspond to proper upvote counts on the comment records
-- TODO/future: use a DB function to cache the count instead
insert into
  upvotes (comment_id, users_name)
values
  (
    '3da49b17-1a1a-4f36-a697-7ce720123efa',
    'Stranger 1'
  );

insert into
  upvotes (comment_id, users_name)
values
  (
    '3da49b17-1a1a-4f36-a697-7ce720123efa',
    'Stranger 2'
  );

insert into
  upvotes (comment_id, users_name)
values
  (
    '3da49b17-1a1a-4f36-a697-7ce720123efa',
    'Stranger 3'
  );