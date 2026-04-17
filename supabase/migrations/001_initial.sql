-- Extensions
create extension if not exists "uuid-ossp";

-- ENUM types
create type call_end_reason as enum ('completed', 'left_early', 'technical');
create type report_category as enum ('hate_speech', 'harassment', 'sexual_content', 'off_platform', 'other');
create type report_status as enum ('pending', 'reviewed', 'dismissed', 'actioned');

-- profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  photo_url text,
  birth_year int,
  city text,
  phone text,
  education text,
  military_service text,
  xp int not null default 0,
  level int not null default 1,
  avg_rating numeric(3,2) not null default 5.0,
  reports_received int not null default 0,
  shadow_throttled boolean not null default false,
  banned_until timestamptz,
  consented_at timestamptz,
  questionnaire_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- questionnaires
create table questionnaires (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  hobbies text[] not null default '{}',
  values_answers jsonb not null default '{}',
  security_score numeric(4,3),
  religion_score numeric(4,3),
  economics_score numeric(4,3),
  consented_at timestamptz not null default now(),
  version int not null default 1,
  unique(user_id)
);

-- matches
create table matches (
  id uuid primary key default uuid_generate_v4(),
  user_a uuid not null references profiles(id),
  user_b uuid not null references profiles(id),
  level int not null default 1,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  completed boolean not null default false,
  end_reason call_end_reason,
  prompt_used text,
  hobby_overlap text[] default '{}'
);

-- ratings
create table ratings (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id),
  rater_id uuid not null references profiles(id),
  ratee_id uuid not null references profiles(id),
  stars int not null check(stars between 1 and 5),
  report_category report_category,
  report_text text,
  created_at timestamptz not null default now(),
  unique(match_id, rater_id)
);

-- xp_events
create table xp_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id),
  match_id uuid references matches(id),
  amount int not null,
  reason text not null,
  multipliers jsonb default '{}',
  created_at timestamptz not null default now()
);

-- streaks
create table streaks (
  user_id uuid primary key references profiles(id) on delete cascade,
  current_days int not null default 0,
  longest_days int not null default 0,
  last_active_date date,
  calls_today int not null default 0
);

-- achievements
create table achievements (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  name_he text not null,
  description_he text not null,
  icon text not null
);

create table user_achievements (
  user_id uuid not null references profiles(id) on delete cascade,
  achievement_id uuid not null references achievements(id),
  unlocked_at timestamptz not null default now(),
  primary key(user_id, achievement_id)
);

-- match_queue (waiting to be matched)
create table match_queue (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  queued_at timestamptz not null default now(),
  level int not null default 1
);

-- moderation
create table reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references profiles(id),
  target_id uuid not null references profiles(id),
  match_id uuid references matches(id),
  category report_category not null,
  notes text,
  status report_status not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table bans (
  user_id uuid primary key references profiles(id) on delete cascade,
  reason text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz
);

-- RLS
alter table profiles enable row level security;
alter table questionnaires enable row level security;
alter table matches enable row level security;
alter table ratings enable row level security;
alter table xp_events enable row level security;
alter table streaks enable row level security;
alter table user_achievements enable row level security;
alter table match_queue enable row level security;
alter table reports enable row level security;

-- RLS Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Users can view own questionnaire" on questionnaires for select using (auth.uid() = user_id);
create policy "Users can insert own questionnaire" on questionnaires for insert with check (auth.uid() = user_id);
create policy "Users can update own questionnaire" on questionnaires for update using (auth.uid() = user_id);

create policy "Match participants can view match" on matches for select using (auth.uid() = user_a or auth.uid() = user_b);
create policy "Auth users can insert matches" on matches for insert with check (auth.uid() = user_a);
create policy "Match participants can update match" on matches for update using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Rater can insert rating" on ratings for insert with check (auth.uid() = rater_id);
create policy "Users can view own ratings" on ratings for select using (auth.uid() = rater_id or auth.uid() = ratee_id);

create policy "Users can view own XP" on xp_events for select using (auth.uid() = user_id);
create policy "Users can view own streak" on streaks for select using (auth.uid() = user_id);
create policy "Users can update own streak" on streaks for update using (auth.uid() = user_id);
create policy "Users can insert own streak" on streaks for insert with check (auth.uid() = user_id);

create policy "Users can manage own queue entry" on match_queue for all using (auth.uid() = user_id);

create policy "Reporters can insert reports" on reports for insert with check (auth.uid() = reporter_id);

create policy "Users can view own achievements" on user_achievements for select using (auth.uid() = user_id);

-- Public achievements table
create policy "Anyone can view achievements" on achievements for select using (true);

-- Seed achievements
insert into achievements (key, name_he, description_he, icon) values
  ('first_contact', 'קשר ראשון', 'השלם את ההתאמה הראשונה שלך', '🤝'),
  ('first_bridge', 'גשר ראשון', 'השלם שיחה ברמה 1', '🌉'),
  ('steady', 'עקבי/ת', 'שמור על רצף של 7 ימים', '🔥'),
  ('active_listener', 'מאזין/ת פעיל/ה', 'קבל 10 דירוגים של 5 כוכבים', '⭐'),
  ('three_axis', 'מנוגד/ת בשלושה צירים', 'התאמה עם מישהו מנוגד בשלושת הצירים', '🎯'),
  ('bridge_builder', 'בונה גשרים', 'הגע לרמה 5', '🏆');
