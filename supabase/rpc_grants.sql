-- Run this if RPCs exist in the dashboard but the app returns PGRST202.
-- https://supabase.com/dashboard/project/ddrsrfeqtgonubktcdqp/sql

GRANT EXECUTE ON FUNCTION public.search_users_by_username(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_friend_summaries() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_challenge_progress(uuid) TO authenticated, anon;

NOTIFY pgrst, 'reload schema';