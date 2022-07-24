-- Enter migration here
DROP TABLE
  IF EXISTS comments CASCADE;

CREATE TABLE
  comments(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    users_name VARCHAR(128) NOT NULL,
    avatar_url VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    body VARCHAR(280) NOT NULL,
    upvote_count INT4 DEFAULT 0 NOT NULL
  );

-- Initial seed data for demonstration
insert into
  comments (id, users_name, body, avatar_url, upvote_count)
values
  (
    'e2781ebc-20a0-4f7f-b6b3-6ef00a1462f8',
    'Mr. Snrub',
    'I-- I say we invest that money back in the nuclear plant.',
    '/images/snrub.webp',
    2
  );

insert into
  comments (id, users_name, body, avatar_url, upvote_count)
values
  (
    '92285661-d2d0-4859-bfad-e9d99db7fea3',
    'Waylon Smithers',
    'I like the way Snrub thinks.',
    '/images/smithers.webp',
    1
  );

insert into
  comments (id, users_name, body, avatar_url, upvote_count)
values
  (
    '6d754120-b79f-4467-970f-0dabba18bb4f',
    'Apu Nahasapeemapetilon',
    'Pardon me, but I would like to see this money spent on police officers. I have been shot eight times this year, and as a result, I almost missed work.',
    '/images/apu.png',
    0
  );

insert into
  comments (id, users_name, body, avatar_url, upvote_count)
values
  (
    '3da49b17-1a1a-4f36-a697-7ce720123efa',
    'Clancy Wiggum',
    'Crybaby!',
    '/images/wiggums.jpg',
    6
  );