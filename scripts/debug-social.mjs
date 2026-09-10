import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log('URL:', url);

  const rpcNames = [
    ['get_friend_summaries', {}],
    ['search_users_by_username', { search_query: 'a' }],
    ['get_challenge_progress', { challenge_id: '00000000-0000-0000-0000-000000000000' }],
  ];

  for (const [name, args] of rpcNames) {
    const { data, error } = await supabase.rpc(name, args);
    console.log(`\nRPC ${name}:`, { data, error });
  }

  const { data: friendships, error: friendshipsError } = await supabase
    .from('friendships')
    .select('*')
    .limit(1);

  console.log('\nfriendships (anon):', { friendships, friendshipsError });
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});