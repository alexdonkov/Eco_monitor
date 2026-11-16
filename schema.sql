-- =====================================================================
-- EcoMonitor — схема на базата данни (Supabase / PostgreSQL)
-- Версия: чернова, Седмица 1
-- Изпълнява се в Supabase → SQL Editor
-- =====================================================================

-- ---------- Изброими типове ----------
create type user_role      as enum ('member', 'leader');
create type data_source    as enum ('api', 'manual', 'classroom_sensor');
create type location_type  as enum ('outdoor', 'indoor');
create type alert_type     as enum ('threshold', 'anomaly', 'trend', 'mismatch');
create type alert_severity as enum ('info', 'warning', 'danger');

-- ---------- 1. profiles: потребители (свързани с Supabase Auth) ----------
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 50),
  role         user_role not null default 'member',
  created_at   timestamptz not null default now()
);

-- ---------- 2. indicators: показатели (PM2.5, CO₂ ...) ----------
create table indicators (
  id               smallint generated always as identity primary key,
  code             text not null unique check (code ~ '^[a-z0-9_]+$'),
  name_bg          text not null,
  name_en          text not null,
  unit             text not null,
  min_valid        numeric not null,          -- физически възможен минимум
  max_valid        numeric not null,          -- физически възможен максимум
  warning_level    numeric,                   -- праг „внимание“
  danger_level     numeric,                   -- праг „опасно“
  check (min_valid < max_valid),
  check (warning_level is null or danger_level is null or warning_level < danger_level)
);

-- ---------- 3. locations: места за измерване ----------
create table locations (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 2 and 100),
  description text check (char_length(description) <= 500),
  latitude    numeric(8,5) not null check (latitude  between -90  and 90),
  longitude   numeric(8,5) not null check (longitude between -180 and 180),
  type        location_type not null default 'outdoor',
  created_by  uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------- 4. measurements: измервания ----------
create table measurements (
  id           bigint generated always as identity primary key,
  location_id  bigint   not null references locations (id)  on delete cascade,
  indicator_id smallint not null references indicators (id) on delete restrict,
  value        numeric  not null,
  measured_at  timestamptz not null,
  source       data_source not null default 'manual',
  note         text check (char_length(note) <= 300),  -- уред / бележка
  verified     boolean not null default false,  -- потвърдено от ръководител
  created_by   uuid references profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (location_id, indicator_id, measured_at, source)  -- без дублиране при импорт
);

create index measurements_series_idx
  on measurements (location_id, indicator_id, measured_at desc);

-- ---------- 5. alerts: сигнали от алгоритъма ----------
create table alerts (
  id              bigint generated always as identity primary key,
  measurement_id  bigint not null references measurements (id) on delete cascade,
  type            alert_type not null,
  severity        alert_severity not null,
  score           numeric,              -- напр. модифициран z-резултат
  details         jsonb not null default '{}'::jsonb,  -- медиана, MAD, праг ...
  acknowledged_by uuid references profiles (id) on delete set null,
  acknowledged_at timestamptz,
  created_at      timestamptz not null default now(),
  unique (measurement_id, type)
);

-- =====================================================================
-- Помощни функции и тригери
-- =====================================================================

-- Дали текущият потребител е ръководител
create or replace function is_leader()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'leader');
$$;

-- Автоматично създаване на профил при регистрация
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Валидация на измерване: стойност в допустимия диапазон, дата не в бъдещето,
-- само ръководител може да потвърждава
create or replace function validate_measurement()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  ind indicators%rowtype;
begin
  select * into ind from indicators where id = new.indicator_id;
  if new.value < ind.min_valid or new.value > ind.max_valid then
    raise exception 'Стойността % е извън допустимия диапазон [%, %] за %',
      new.value, ind.min_valid, ind.max_valid, ind.code;
  end if;
  if new.measured_at > now() + interval '1 hour' then
    raise exception 'Датата на измерването не може да е в бъдещето';
  end if;
  if new.verified and not is_leader() then
    if tg_op = 'INSERT' or not old.verified then
      raise exception 'Само ръководител може да потвърждава измервания';
    end if;
  end if;
  return new;
end;
$$;

create trigger measurements_validate
  before insert or update on measurements
  for each row execute function validate_measurement();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table profiles     enable row level security;
alter table indicators   enable row level security;
alter table locations    enable row level security;
alter table measurements enable row level security;
alter table alerts       enable row level security;

-- profiles: всеки вписан вижда имената; всеки редактира само своя профил
create policy profiles_select on profiles for select to authenticated using (true);
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- ролята не може да се сменя от клиента: разрешаваме UPDATE само на display_name
revoke update on profiles from authenticated;
grant  update (display_name) on profiles to authenticated;

-- indicators: всички четат, само ръководител променя
create policy indicators_select on indicators for select to anon, authenticated using (true);
create policy indicators_write  on indicators for all    to authenticated
  using (is_leader()) with check (is_leader());

-- locations: всички четат; вписан добавя; собственик или ръководител редактира/трие
create policy locations_select on locations for select to anon, authenticated using (true);
create policy locations_insert on locations for insert to authenticated
  with check (created_by = auth.uid());
create policy locations_update on locations for update to authenticated
  using (created_by = auth.uid() or is_leader());
create policy locations_delete on locations for delete to authenticated
  using (created_by = auth.uid() or is_leader());

-- measurements: всички четат; вписан добавя ръчни; импорт от API — само ръководител
create policy measurements_select on measurements for select to anon, authenticated using (true);
create policy measurements_insert on measurements for insert to authenticated
  with check (created_by = auth.uid() and (source <> 'api' or is_leader()));
create policy measurements_update on measurements for update to authenticated
  using (created_by = auth.uid() or is_leader());
create policy measurements_delete on measurements for delete to authenticated
  using (created_by = auth.uid() or is_leader());

-- alerts: всички четат; вписан създава (алгоритъмът работи в браузъра);
-- само ръководител маркира като прегледан или трие
create policy alerts_select on alerts for select to anon, authenticated using (true);
create policy alerts_insert on alerts for insert to authenticated
  with check (acknowledged_by is null);
create policy alerts_update on alerts for update to authenticated
  using (is_leader()) with check (is_leader());
create policy alerts_delete on alerts for delete to authenticated
  using (is_leader());

-- =====================================================================
-- Начални данни: показатели
-- Праговете са начални стойности по насоките на СЗО (2021) и Директива (ЕС) 2024/2881;
-- ще бъдат проверени и описани в SOURCES.md (Седмица 4).
-- =====================================================================
insert into indicators (code, name_bg, name_en, unit, min_valid, max_valid, warning_level, danger_level) values
  ('pm2_5',       'Фини прахови частици PM2.5', 'Fine particulate matter PM2.5', 'µg/m³', 0,   1000, 15,   25),
  ('pm10',        'Прахови частици PM10',       'Particulate matter PM10',       'µg/m³', 0,   2000, 45,   50),
  ('no2',         'Азотен диоксид',             'Nitrogen dioxide',              'µg/m³', 0,   1000, 25,   50),
  ('o3',          'Озон',                       'Ozone',                         'µg/m³', 0,   1000, 100,  180),
  ('temperature', 'Температура',                'Temperature',                   '°C',    -50, 60,   null, null),
  ('humidity',    'Относителна влажност',       'Relative humidity',             '%',     0,   100,  null, null),
  ('co2',         'Въглероден диоксид (вътре)', 'Carbon dioxide (indoor)',       'ppm',   300, 10000, 1000, 1500),
  ('noise',       'Шум',                        'Noise',                         'dB',    0,   140,  55,   70);

-- =====================================================================
-- Изглед: последното измерване за всяко място и показател (Седмица 2)
-- security_invoker = true → важат RLS правилата на потребителя
-- =====================================================================
create view latest_measurements with (security_invoker = true) as
select distinct on (m.location_id, m.indicator_id)
  m.id, m.location_id, m.indicator_id, i.code, m.value, m.measured_at, m.source, m.verified
from measurements m
join indicators i on i.id = m.indicator_id
order by m.location_id, m.indicator_id, m.measured_at desc;
