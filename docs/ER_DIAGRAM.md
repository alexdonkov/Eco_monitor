# ER диаграма — EcoMonitor

GitHub показва диаграмата автоматично (Mermaid).

```mermaid
erDiagram
    profiles ||--o{ locations     : "създава"
    profiles ||--o{ measurements  : "въвежда"
    profiles ||--o{ alerts        : "преглежда"
    locations ||--o{ measurements : "има"
    indicators ||--o{ measurements : "измерва"
    measurements ||--o{ alerts    : "предизвиква"

    profiles {
        uuid id PK "= auth.users.id"
        text display_name "2–50 символа"
        user_role role "member | leader"
        timestamptz created_at
    }
    indicators {
        smallint id PK
        text code UK "pm2_5, co2 ..."
        text name_bg
        text name_en
        text unit "µg/m³, ppm, °C"
        numeric min_valid
        numeric max_valid
        numeric warning_level
        numeric danger_level
    }
    locations {
        bigint id PK
        text name
        text description
        numeric latitude "-90..90"
        numeric longitude "-180..180"
        location_type type "outdoor | indoor"
        uuid created_by FK
        timestamptz created_at
    }
    measurements {
        bigint id PK
        bigint location_id FK
        smallint indicator_id FK
        numeric value "в диапазона на показателя"
        timestamptz measured_at "не в бъдещето"
        data_source source "api | manual | classroom_sensor"
        text note "уред / бележка, до 300"
        boolean verified
        uuid created_by FK
        timestamptz created_at
    }
    alerts {
        bigint id PK
        bigint measurement_id FK
        alert_type type "threshold | anomaly | trend | mismatch"
        alert_severity severity "info | warning | danger"
        numeric score
        jsonb details
        uuid acknowledged_by FK
        timestamptz acknowledged_at
        timestamptz created_at
    }
```

## Връзки
| Връзка | Тип | При изтриване |
|---|---|---|
| locations → measurements | 1 : много | изтриват се и измерванията (CASCADE) |
| indicators → measurements | 1 : много | забранено, ако има измервания (RESTRICT) |
| measurements → alerts | 1 : много | изтриват се и сигналите (CASCADE) |
| profiles → locations / measurements / alerts | 1 : много | полето става NULL (данните остават) |

## Права (RLS) накратко
| Таблица | Гост | Член | Ръководител |
|---|---|---|---|
| indicators | чете | чете | всичко |
| locations | чете | добавя; редактира/трие свои | всичко |
| measurements | чете | добавя ръчни; редактира/трие свои | всичко + потвърждава + импорт от API |
| alerts | чете | създава | маркира като прегледан, трие |
| profiles | — | чете; редактира само своето име | същото (ролята не се сменя от клиента) |
