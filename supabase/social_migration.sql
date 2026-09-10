-- Social layer migration for existing Keva databases
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ddrsrfeqtgonubktcdqp/sql

CREATE TABLE IF NOT EXISTS friendships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE TABLE IF NOT EXISTS challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  challenged_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  CHECK (challenger_id <> challenged_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own friendships" ON friendships;
CREATE POLICY "Users see own friendships" ON friendships
  FOR SELECT USING (auth.uid() IN (requester_id, addressee_id));

DROP POLICY IF EXISTS "Users send friend requests" ON friendships;
CREATE POLICY "Users send friend requests" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id AND status = 'pending');

DROP POLICY IF EXISTS "Addressee updates friendship" ON friendships;
CREATE POLICY "Addressee updates friendship" ON friendships
  FOR UPDATE USING (auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Users delete own friendships" ON friendships;
CREATE POLICY "Users delete own friendships" ON friendships
  FOR DELETE USING (auth.uid() IN (requester_id, addressee_id));

DROP POLICY IF EXISTS "Users see own challenges" ON challenges;
CREATE POLICY "Users see own challenges" ON challenges
  FOR SELECT USING (auth.uid() IN (challenger_id, challenged_id));

DROP POLICY IF EXISTS "Users create challenges" ON challenges;
CREATE POLICY "Users create challenges" ON challenges
  FOR INSERT WITH CHECK (auth.uid() = challenger_id AND status = 'active');

DROP POLICY IF EXISTS "Participants update challenges" ON challenges;
CREATE POLICY "Participants update challenges" ON challenges
  FOR UPDATE USING (auth.uid() IN (challenger_id, challenged_id));

DROP POLICY IF EXISTS "Users read connected profiles" ON profiles;
CREATE POLICY "Users read connected profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.friendships f
      WHERE f.status IN ('pending', 'accepted')
        AND auth.uid() IN (f.requester_id, f.addressee_id)
        AND id IN (f.requester_id, f.addressee_id)
        AND id <> auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.challenges c
      WHERE c.status = 'active'
        AND auth.uid() IN (c.challenger_id, c.challenged_id)
        AND id IN (c.challenger_id, c.challenged_id)
        AND id <> auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.search_users_by_username(search_query text)
RETURNS TABLE (id uuid, username text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT p.id, p.username
  FROM public.profiles p
  WHERE p.id <> current_user_id
    AND p.username IS NOT NULL
    AND lower(p.username) LIKE lower(trim(search_query)) || '%'
  ORDER BY p.username
  LIMIT 10;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_friend_summaries()
RETURNS TABLE (
  user_id uuid,
  username text,
  current_streak integer,
  completed_today boolean,
  active_habits_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  friend_record RECORD;
  habit_record RECORD;
  max_streak integer;
  habit_streak integer;
  check_date date;
  today date := CURRENT_DATE;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR friend_record IN
    SELECT
      CASE
        WHEN f.requester_id = current_user_id THEN f.addressee_id
        ELSE f.requester_id
      END AS friend_id
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND current_user_id IN (f.requester_id, f.addressee_id)
  LOOP
    user_id := friend_record.friend_id;

    SELECT COALESCE(p.username, 'User') INTO username
    FROM public.profiles p
    WHERE p.id = friend_record.friend_id;

    SELECT COUNT(*)::integer INTO active_habits_count
    FROM public.habits h
    WHERE h.user_id = friend_record.friend_id;

    SELECT EXISTS (
      SELECT 1
      FROM public.checkins c
      WHERE c.user_id = friend_record.friend_id
        AND c.checked_date = today
    ) INTO completed_today;

    max_streak := 0;

    FOR habit_record IN
      SELECT h.id FROM public.habits h WHERE h.user_id = friend_record.friend_id
    LOOP
      habit_streak := 0;
      check_date := today;

      IF NOT EXISTS (
        SELECT 1 FROM public.checkins c
        WHERE c.habit_id = habit_record.id AND c.checked_date = check_date
      ) THEN
        check_date := check_date - 1;
      END IF;

      WHILE EXISTS (
        SELECT 1 FROM public.checkins c
        WHERE c.habit_id = habit_record.id AND c.checked_date = check_date
      ) LOOP
        habit_streak := habit_streak + 1;
        check_date := check_date - 1;
      END LOOP;

      max_streak := GREATEST(max_streak, habit_streak);
    END LOOP;

    current_streak := max_streak;
    RETURN NEXT;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_challenge_progress(challenge_id uuid)
RETURNS TABLE (user_id uuid, days_completed integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  challenge_record public.challenges%ROWTYPE;
  window_end date;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO challenge_record
  FROM public.challenges c
  WHERE c.id = challenge_id
    AND current_user_id IN (c.challenger_id, c.challenged_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  window_end := COALESCE(challenge_record.end_date, CURRENT_DATE);

  RETURN QUERY
  SELECT
    u.uid AS user_id,
    COUNT(DISTINCT c.checked_date)::integer AS days_completed
  FROM (
    VALUES (challenge_record.challenger_id), (challenge_record.challenged_id)
  ) AS u(uid)
  LEFT JOIN public.checkins c
    ON c.user_id = u.uid
    AND c.checked_date >= challenge_record.start_date
    AND c.checked_date <= window_end
  GROUP BY u.uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_users_by_username(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_friend_summaries() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_challenge_progress(uuid) TO authenticated, anon;

NOTIFY pgrst, 'reload schema';

CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid := auth.uid();
BEGIN
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.challenges
  WHERE challenger_id = user_id OR challenged_id = user_id;
  DELETE FROM public.friendships
  WHERE requester_id = user_id OR addressee_id = user_id;
  DELETE FROM public.checkins WHERE user_id = user_id;
  DELETE FROM public.habits WHERE user_id = user_id;
  DELETE FROM public.profiles WHERE id = user_id;
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;