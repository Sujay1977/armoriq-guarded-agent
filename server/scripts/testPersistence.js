import app from '../src/app.js';
import supertest from 'supertest';

const request = supertest(app);

async function runTests() {
  console.log('--- Running Chat Persistence Tests ---\n');

  // 1. Register a test user and login
  const email = `test-persist-${Date.now()}@example.com`;
  await request.post('/api/v1/auth/register').send({ email, name: 'Persist Tester', password: 'password123' });
  const loginRes = await request.post('/api/v1/auth/login').send({ email, password: 'password123' });
  const accessToken = loginRes.body.data.accessToken;

  // 2. Chat using a new conversation
  console.log('\n2. Chat Request');
  const chatRes = await request.post('/api/v1/agent/chat')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ message: 'calculate 25 * 4' });
  console.log(`Status: ${chatRes.status}`);
  const conversationId = chatRes.body.data.conversationId;
  console.log(`Created Conversation ID: ${conversationId}`);

  // 3. Fetch user conversations
  console.log('\n3. Fetch User Conversations');
  const convListRes = await request.get('/api/v1/conversations')
    .set('Authorization', `Bearer ${accessToken}`);
  console.log(`Status: ${convListRes.status}`);
  console.log('Conversations:', convListRes.body.data.length);
  console.log('Title:', convListRes.body.data[0].title);

  // 4. Fetch specific conversation details
  console.log('\n4. Fetch Conversation Details');
  const detailRes = await request.get(`/api/v1/conversations/${conversationId}`)
    .set('Authorization', `Bearer ${accessToken}`);
  console.log(`Status: ${detailRes.status}`);
  console.log('Message Count:', detailRes.body.data.messages.length);
  console.log('Tool Input:', detailRes.body.data.messages[1].tool_input);
  console.log('Tool Output:', detailRes.body.data.messages[1].tool_output);

  console.log('\n--- Tests Completed ---');
}

runTests().catch(console.error);
