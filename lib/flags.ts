// Feature flags — valdomi per Vercel env variables
// Naudoti debug metu norint izoliuoti problemą
//
// Vercel Dashboard → Environment Variables:
//   DISABLE_AI=true     → AI generavimas išjungiamas (blog-gen mock fallback)
//   DISABLE_EMAIL=true  → visi email siuntimai išjungiami
//   DISABLE_TELEGRAM=true → Telegram pranešimai išjungiami (debug)

export function flags() {
  return {
    AI_ENABLED:       process.env.DISABLE_AI       !== 'true',
    EMAIL_ENABLED:    process.env.DISABLE_EMAIL    !== 'true',
    TELEGRAM_ENABLED: process.env.DISABLE_TELEGRAM !== 'true',
  }
}

export type Flags = ReturnType<typeof flags>
