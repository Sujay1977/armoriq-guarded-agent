import supabase from './src/config/supabase.js';

async function testSupabase() {
  console.log('--- Auth Test ---');
  const { data: user, error: userError } = await supabase.auth.getUser();
  console.log('getUser:', user, userError?.message);

  const { data: session, error: sessionError } = await supabase.auth.getSession();
  console.log('getSession:', session, sessionError?.message);

  // If there's a session, print claims (though service role usually doesn't have a session)
  console.log('--- RPC current_user Test ---');
  // Try to run an SQL query or RPC
  // Wait, if no RPC exists, this will fail. Let's try to query current_user via a non-existent table just to see the error, or query pg_roles?
  // We don't have a direct raw SQL endpoint in supabase-js. We can try querying a table and catching the error.
  const { data: role, error: rpcErr } = await supabase.rpc('get_current_role');
  console.log('rpc("get_current_role"):', role, rpcErr?.message);

  console.log('--- Test Insert ---');
  const testData = { id: 'test-id-1234', role: 'user', content: 'test', conversation_id: null };
  const { data: insertData, error: insertError } = await supabase.from('messages').insert(testData).select();
  console.log('Insert Message:', insertData, insertError);
}

testSupabase().catch(console.error);
