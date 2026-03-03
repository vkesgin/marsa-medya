create table if not exists public.content_comments (
  id bigserial primary key,
  content_id text not null,
  user_id text not null,
  comment text not null,
  created_at timestamptz not null default now(),
  constraint content_comments_comment_len_chk check (char_length(trim(comment)) between 1 and 1000)
);

create index if not exists idx_content_comments_content_id_created_at
  on public.content_comments (content_id, created_at);
