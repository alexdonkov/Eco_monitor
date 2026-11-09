# 🌿 EcoMonitor — Мониторинг на околната среда

Уеб приложение за ученици и училищни екоклубове: събиране на екологични измервания (качество на въздуха, температура, CO₂, шум), показване на карта и графики и автоматично откриване на необичайни стойности и тенденции.

*English below.*

## Функционалности
- 🗺️ Карта на местата за измерване, оцветени според качеството
- 📈 Графики по периоди (24 ч / 7 дни / 30 дни / собствен)
- 🚨 Сигнали при надвишени прагове и аномалии (собствен алгоритъм)
- ⚖️ Сравнение на показатели и места + корелация
- 👥 Вход, регистрация и роли (член / ръководител)
- 🌐 Български (по подразбиране) и английски език

## Технологии
HTML5 · CSS3 · JavaScript (ES6+) · Supabase (PostgreSQL, Auth, RLS) · Leaflet · Chart.js · Open-Meteo API · Vitest · GitHub Pages

## Структура
```
├── database/schema.sql      — таблици, RLS, начални данни
├── docs/                    — RESEARCH, PROJECT_PLAN, PRODUCT_SPEC, ER диаграма, макети, отчети
├── src/                     — кодът на приложението
├── tests/                   — автоматизирани тестове (Vitest)
└── presentation/            — презентация за защитата
```

## Стартиране
1. Създайте проект в [Supabase](https://supabase.com) и изпълнете `database/schema.sql` в SQL Editor.
2. Копирайте `.env.example` като `src/js/config.js` и попълнете URL и `anon` ключа.
3. Отворете `src/index.html` с локален сървър (напр. разширението Live Server във VS Code).

## Екип
| Ученик | Отговорности |
|---|---|
| Алекс Донков | База данни, сигурност, алгоритъм, статистика, тестове |
| Миро | Интерфейс, навигация, карта, графики, адаптивен дизайн, преводи |

## Лиценз
MIT — виж [LICENSE](LICENSE).

---

## English
**EcoMonitor** is a bilingual (BG/EN) web app for students and school eco-clubs to record environmental measurements, view them on a map and in charts, and automatically detect anomalies and trends. Built with vanilla JavaScript, Supabase, Leaflet and Chart.js.
