# Supabase Auth: подтверждение почты при регистрации

Сейчас проект переведен на Supabase Auth для логина/регистрации, чтобы:
- при регистрации пользователь **подтверждал email** (через письмо),
- пароли **не хранились** в `public.profiles.password`.

## 1) Включить подтверждение email в Supabase

Supabase Dashboard:
1. `Authentication` -> `Providers` -> `Email`
2. Включить `Email` provider
3. В `Authentication` -> `Settings`:
   - включить `Confirm email` (или аналогичный пункт),
   - при необходимости настроить `Site URL` (домен Vercel),
   - добавить redirect URL: `https://<твой-домен>/profile`

Важно: если включено подтверждение почты, после `signUp` сессия может быть `null` — это нормально.

## 2) Что изменилось в коде

- Регистрация: `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })`
- Логин: `supabase.auth.signInWithPassword({ email, password })`
- Состояние пользователя: через `supabase.auth.onAuthStateChange(...)`

Файлы:
- `src/auth/AuthContext.jsx`
- `src/components/AuthPage.jsx`

## 3) Миграция базы (рекомендуется)

Старый режим хранил пароли в `public.profiles.password`. Это небезопасно.

Рекомендуемый путь:
1. Применить `supabase_secure_schema.sql` в Supabase SQL editor (создает RLS + связку `profiles.id = auth.uid()` + trigger).
2. После миграции убрать колонку `public.profiles.password` (если она больше не используется).

Если пока не хочешь миграцию — приложение все равно будет работать, но `password` в `profiles` больше не используется.

