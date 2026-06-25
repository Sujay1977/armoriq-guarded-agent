import app from '../src/app.js';
import supertest from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { policies } from '../src/config/policies.js';

const request = supertest(app);

async function runTests() {
  console.log('--- Running MCP Integration Tests ---\n');

  // 1. Register a test user and login
  const email = `test-mcp-${Date.now()}@example.com`;
  await request.post('/api/v1/auth/register').send({ email, name: 'MCP Tester', password: 'password123' });
  const loginRes = await request.post('/api/v1/auth/login').send({ email, password: 'password123' });
  const accessToken = loginRes.body.data.accessToken;
  const conversationId = uuidv4();

  // 2. Calculator Tool
  console.log('\n2. Calculator Tool');
  const calcRes = await request.post('/api/v1/agent/chat')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ message: 'calculate 25 * 4', conversationId });
  console.log(`Status: ${calcRes.status}`);
  console.log('Response:', calcRes.body.data);

  // 3. User Profile Tool
  console.log('\n3. User Profile Tool');
  const profileRes = await request.post('/api/v1/agent/chat')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ message: 'show my profile', conversationId });
  console.log(`Status: ${profileRes.status}`);
  console.log('Response:', profileRes.body.data);

  // 4. Knowledge Tool
  console.log('\n4. Knowledge Tool');
  const knowledgeRes = await request.post('/api/v1/agent/chat')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ message: 'what is our company policy', conversationId });
  console.log(`Status: ${knowledgeRes.status}`);
  console.log('Response:', knowledgeRes.body.data);

  // 5. Invalid Arguments
  console.log('\n5. Invalid Arguments (Calculator)');
  const invalidArgRes = await request.post('/api/v1/agent/chat')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ message: 'calculate hello world', conversationId });
  console.log(`Status: ${invalidArgRes.status}`);
  console.log('Response:', invalidArgRes.body.data);

  // 6. Tool Guard Rejection (simulate unauthorized by modifying allowed tools temporarily)
  console.log('\n6. Tool Guard Rejection (Unauthorized Tool)');
  const originalAllowed = [...policies.allowedTools];
  policies.allowedTools = policies.allowedTools.filter(t => t !== 'calculator'); // Remove calculator
  const rejectRes = await request.post('/api/v1/agent/chat')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ message: 'calculate 10 + 10', conversationId });
  console.log(`Status: ${rejectRes.status}`);
  console.log('Response:', rejectRes.body.data);
  policies.allowedTools = originalAllowed; // Restore

  console.log('\n--- Tests Completed ---');
}

runTests().catch(console.error);
