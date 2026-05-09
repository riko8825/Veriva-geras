# .claude/ — Veriva projekto konfigūracija

## Agentai ir skills

Šis projektas naudoja **globalius** agentus ir skills iš `~/.claude/agents/` ir `~/.claude/skills/`.
Nieko nekopijuojam — viskas pasiekiama automatiškai iš bet kurio projekto.

### Galimi agentai (dirba pagal nutylėjimą)

- `page-builder` — naujų puslapių kūrimas
- `frontend-revizorius` — CSS/HTML/JS auditas
- `seo-specialistas` — meta, schema.org, keywords
- `backend-engineer` — Vercel Edge Functions
- `integration-specialist` — Resend, API integracijos
- `database-designer` — Supabase, RLS
- `solution-architect` — architektūra
- `debugger` — debug
- `qa-tester` — QA + security pre-deploy
- `marketing-analitikas` — CTA, conversion
- `ai-prompt-engineer` — AI logika
- `backend-tikrintojas` — backend audit
- `copy-editing` (skill) — copy auditas

### Galimi skills

- `/start-task`, `/close-session`, `/docs-sync` — workflow
- `/puslapis-naujas` — naujo puslapio workflow
- `/mobilios-versijos` — mobile audit
- `/greitas-patikrinimas` — quick HTML/CSS/JS check
- `/automacija-nauja` — backend automatizacija
- `/debug-flow` — debug 7 lygiais
- `/security-review` — security checklist
- `/seo-tekstai` — SEO content
- `/copy-editing` — copy
- `/pilnas-auditas` — visapusis auditas

## Kada kurti projekto-specific agent/skill

Tik jei reikia logikos, kuri yra UNIKALI tik Veriva projektui ir global agent/skill negali to padaryti. Kitu atveju — naudoti global.

## Settings

`settings.local.json` — projekto override'ai (gitignored).
`settings.json` — projekto-shared settings (commit'inami).
