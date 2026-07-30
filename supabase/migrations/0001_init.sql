-- HeritageHub — initial schema
-- Postgres + PostGIS. Run via `supabase db reset` or paste into the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists postgis;
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type event_category as enum (
    'Spiritual', 'Food/Free Feast', 'Kids Activities',
    'Live Music/Bhajan', 'Rituals', 'Volunteer'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  avatar_url     text,
  home_lat       double precision,
  home_lng       double precision,
  default_radius_mi integer not null default 25,
  fav_categories event_category[] not null default '{}',
  is_organizer   boolean not null default false,
  created_at     timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  organizer    text not null,
  organizer_id uuid references profiles(id) on delete set null,
  description  text not null default '',
  categories   event_category[] not null default '{}',
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  venue_name   text not null,
  address      text not null,
  -- geography(Point) stores lon/lat and enables meters-accurate distance search
  location     geography(Point, 4326) not null,
  flyer_url    text,
  hero_emoji   text default '📅',
  gradient     text[] default '{"#f97316","#b91c1c"}',
  price_label  text not null default 'Free',
  rsvp_url     text,
  source_url   text,  -- organizer's official page for this listing
  itinerary    jsonb not null default '[]'::jsonb,  -- [{time, activity}]
  featured     boolean not null default false,
  published    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Spatial + common query indexes
create index if not exists events_location_gix on events using gist (location);
create index if not exists events_starts_at_idx on events (starts_at);
create index if not exists events_categories_gin on events using gin (categories);

-- ---------------------------------------------------------------------------
-- Bookmarks (saved events) & RSVPs
-- ---------------------------------------------------------------------------
create table if not exists bookmarks (
  user_id  uuid not null references profiles(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table if not exists rsvps (
  user_id   uuid not null references profiles(id) on delete cascade,
  event_id  uuid not null references events(id) on delete cascade,
  status    text not null default 'going' check (status in ('going','interested','not_going')),
  party_size integer not null default 1 check (party_size between 1 and 20),
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- ---------------------------------------------------------------------------
-- RPC: events near a point, within radius (miles), ordered by distance.
-- Runs the geo filter in the database so the client never downloads far events.
-- ---------------------------------------------------------------------------
create or replace function events_nearby(
  in_lat double precision,
  in_lng double precision,
  radius_mi double precision default 25,
  in_categories event_category[] default null,
  in_from timestamptz default now(),
  in_to timestamptz default null
)
returns table (
  id uuid, slug text, title text, organizer text, description text,
  categories event_category[], starts_at timestamptz, ends_at timestamptz,
  venue_name text, address text, lat double precision, lng double precision,
  flyer_url text, hero_emoji text, gradient text[], price_label text,
  rsvp_url text, source_url text, itinerary jsonb, featured boolean, distance_mi double precision
)
language sql stable as $$
  select
    e.id, e.slug, e.title, e.organizer, e.description, e.categories,
    e.starts_at, e.ends_at, e.venue_name, e.address,
    st_y(e.location::geometry) as lat,
    st_x(e.location::geometry) as lng,
    e.flyer_url, e.hero_emoji, e.gradient, e.price_label, e.rsvp_url, e.source_url,
    e.itinerary, e.featured,
    st_distance(e.location, st_makepoint(in_lng, in_lat)::geography) / 1609.344 as distance_mi
  from events e
  where e.published
    and e.ends_at >= in_from
    and (in_to is null or e.starts_at <= in_to)
    and st_dwithin(e.location, st_makepoint(in_lng, in_lat)::geography, radius_mi * 1609.344)
    and (in_categories is null or e.categories && in_categories)
  order by distance_mi asc;
$$;

-- ---------------------------------------------------------------------------
-- RPC: create_event — used by the organizer submission form.
-- SECURITY INVOKER so RLS applies; organizer_id is forced to the caller.
-- Takes lat/lng and builds the geography point server-side.
-- ---------------------------------------------------------------------------
create or replace function create_event(
  p_slug text, p_title text, p_organizer text, p_description text,
  p_categories event_category[], p_starts_at timestamptz, p_ends_at timestamptz,
  p_venue_name text, p_address text, p_lat double precision, p_lng double precision,
  p_hero_emoji text default '📅', p_price_label text default 'Free',
  p_rsvp_url text default null, p_source_url text default null,
  p_itinerary jsonb default '[]'::jsonb
)
returns uuid language plpgsql security invoker as $$
declare new_id uuid;
begin
  insert into events (
    slug, title, organizer, organizer_id, description, categories,
    starts_at, ends_at, venue_name, address, location,
    hero_emoji, price_label, rsvp_url, source_url, itinerary, published
  ) values (
    p_slug, p_title, p_organizer, auth.uid(), p_description, p_categories,
    p_starts_at, p_ends_at, p_venue_name, p_address,
    st_makepoint(p_lng, p_lat)::geography,
    coalesce(p_hero_emoji, '📅'), coalesce(p_price_label, 'Free'),
    p_rsvp_url, p_source_url, coalesce(p_itinerary, '[]'::jsonb), true
  )
  returning id into new_id;
  return new_id;
end $$;

grant execute on function create_event to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles  enable row level security;
alter table events    enable row level security;
alter table bookmarks enable row level security;
alter table rsvps     enable row level security;

-- Profiles: users manage only their own row.
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_upsert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Events: anyone (even anonymous) can read published events; organizers manage their own.
create policy "events_public_read" on events for select using (published = true);
create policy "events_owner_insert" on events for insert with check (auth.uid() = organizer_id);
create policy "events_owner_update" on events for update using (auth.uid() = organizer_id);
create policy "events_owner_delete" on events for delete using (auth.uid() = organizer_id);

-- Bookmarks & RSVPs: users manage only their own.
create policy "bookmarks_own" on bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "rsvps_own" on rsvps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Allow the nearby RPC to be called by anon + authenticated roles.
grant execute on function events_nearby to anon, authenticated;
