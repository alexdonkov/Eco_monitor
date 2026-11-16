-- =====================================================================
-- EcoMonitor — тестови данни (Седмица 2)
-- Изпълнява се СЛЕД schema.sql в Supabase → SQL Editor.
-- Създава 10 места и ~7 000 измервания за последните 7 дни.
-- Стойностите са симулирани: дневен цикъл (сутрешен и вечерен пик), случаен шум.
-- =====================================================================

insert into locations (name, description, latitude, longitude, type) values
  ('София – Център',          'Моделни данни (Open-Meteo / CAMS)',         42.69770, 23.32190, 'outdoor'),
  ('Училищен двор, София',    'Ръчни измервания на екоклуба',              42.66000, 23.41000, 'outdoor'),
  ('Класна стая 10Б',         'CO₂ и температура в класната стая',          42.66000, 23.41000, 'indoor'),
  ('Пловдив',                 'Моделни данни (Open-Meteo / CAMS)',         42.13540, 24.74530, 'outdoor'),
  ('Варна',                   'Моделни данни (Open-Meteo / CAMS)',         43.21410, 27.91470, 'outdoor'),
  ('Бургас',                  'Моделни данни (Open-Meteo / CAMS)',         42.50480, 27.46260, 'outdoor'),
  ('Русе',                    'Моделни данни (Open-Meteo / CAMS)',         43.83560, 25.96570, 'outdoor'),
  ('Стара Загора',            'Моделни данни (Open-Meteo / CAMS)',         42.42580, 25.63450, 'outdoor'),
  ('Благоевград',             'Моделни данни (Open-Meteo / CAMS)',         42.02090, 23.09430, 'outdoor'),
  ('Плевен',                  'Моделни данни (Open-Meteo / CAMS)',         43.41700, 24.60670, 'outdoor');

-- Базови нива по град (PM2.5, NO₂, температура)
create temporary table base (name text, pm numeric, no2 numeric, temp numeric);
insert into base values
  ('София – Център', 23, 32, 7), ('Пловдив', 25, 28, 8.5), ('Варна', 11, 20, 10),
  ('Бургас', 13, 19, 10), ('Русе', 20, 22, 7.5), ('Стара Загора', 18, 21, 8),
  ('Благоевград', 16, 17, 8.5), ('Плевен', 18, 19, 7.5);

-- Моделни данни: всеки час за последните 7 дни
with hours as (
  select generate_series(date_trunc('hour', now()) - interval '167 hours', date_trunc('hour', now()), interval '1 hour') as t
), series as (
  select l.id as location_id, h.t, b.*,
         extract(hour from h.t at time zone 'Europe/Sofia')::numeric as hr
  from locations l join base b on b.name = l.name cross join hours h
), calc as (
  select *,
    1 + 0.35*exp(-power(hr - 8.5, 2)/3) + 0.75*exp(-power(hr - 21, 2)/7) - 0.25*exp(-power(hr - 14, 2)/6) as heat_cycle,
    1 + 0.6*exp(-power(hr - 8, 2)/2.5) + 0.55*exp(-power(hr - 18, 2)/3) - 0.4*exp(-power(hr - 3, 2)/8) as traffic
  from series
)
insert into measurements (location_id, indicator_id, value, measured_at, source)
select location_id, (select id from indicators where code = 'pm2_5'), round((pm * 0.8 * heat_cycle * (0.85 + random()*0.3))::numeric, 1), t, 'api'::data_source from calc
union all
select location_id, (select id from indicators where code = 'pm10'),  round((pm * 1.2 * heat_cycle * (0.85 + random()*0.3) + 4)::numeric, 1), t, 'api'::data_source from calc
union all
select location_id, (select id from indicators where code = 'no2'),   round((no2 * 0.8 * traffic * (0.85 + random()*0.3))::numeric, 1), t, 'api'::data_source from calc
union all
select location_id, (select id from indicators where code = 'temperature'), round((temp - 4*cos((hr - 15)/24*2*pi()) + (random() - 0.5))::numeric, 1), t, 'api'::data_source from calc;

-- Ръчни измервания на екоклуба: 3 пъти на ден (8:00, 13:00, 17:00)
insert into measurements (location_id, indicator_id, value, measured_at, source, note)
select (select id from locations where name = 'Училищен двор, София'),
       (select id from indicators where code = ind.code),
       round((ind.base * (0.8 + random()*0.5))::numeric, 1),
       (d::date + make_interval(hours => hr)) at time zone 'Europe/Sofia',
       'manual', 'Ръчен сензор на екоклуба'
from generate_series(current_date - 6, current_date, interval '1 day') as d,
     unnest(array[8, 13, 17]) as hr,
     (values ('pm2_5', 22), ('pm10', 34), ('noise', 58), ('temperature', 9)) as ind(code, base)
where (d::date + make_interval(hours => hr)) at time zone 'Europe/Sofia' <= now();

-- Класна стая: CO₂ расте по време на час и пада в междучасията (8:00–14:00, делнични дни)
insert into measurements (location_id, indicator_id, value, measured_at, source, note)
select (select id from locations where name = 'Класна стая 10Б'),
       (select id from indicators where code = 'co2'),
       round((450 + 1400*(1 - exp(-0.7*m/60.0)) + random()*60)::numeric, 0),
       t, 'classroom_sensor', 'Симулация (Digital Twin)'
from generate_series(date_trunc('hour', now()) - interval '7 days', now(), interval '15 minutes') as t,
     lateral (select extract(minute from t at time zone 'Europe/Sofia')::int as m) mm   -- минути от началото на часа
where extract(isodow from t at time zone 'Europe/Sofia') between 1 and 5
  and extract(hour from t at time zone 'Europe/Sofia') between 8 and 13;

drop table base;

-- Проверка
select l.name, count(*) as measurements
from measurements m join locations l on l.id = m.location_id
group by l.name order by l.name;
