import { describe, it, expect } from 'vitest';
import { MessageStore } from './protocol';

describe('Agent Communication Package', () => {
  it('should store and filter messages within threads', async () => {
    const store = new MessageStore();

    const requestMsg = await store.storeMessage({
      type: 'REQUEST',
      senderId: 'ceo_agent',
      receiverId: 'backend_dev',
      content: 'Implement a user signin route',
      priority: 'high',
      attachments: [],
      memoryReferences: [],
      contextReferences: [],
      taskReferences: ['task_123'],
      conversationId: 'conv_1',
      threadId: 'thread_999'
    });

    expect(requestMsg.id).toBeDefined();
    expect(requestMsg.timestamp).toBeInstanceOf(Date);

    const replyMsg = await store.storeMessage({
      type: 'RESPONSE',
      senderId: 'backend_dev',
      receiverId: 'ceo_agent',
      content: 'Implemented API logic in routes.ts',
      priority: 'medium',
      attachments: ['/workspace/routes.ts'],
      memoryReferences: [],
      contextReferences: [],
      taskReferences: ['task_123'],
      conversationId: 'conv_1',
      threadId: 'thread_999'
    });

    const threadMessages = await store.listMessages({ threadId: 'thread_999' });
    expect(threadMessages.length).toBe(2);
    expect(threadMessages[0].type).toBe('REQUEST');
    expect(threadMessages[1].type).toBe('RESPONSE');
    expect(threadMessages[1].attachments).toContain('/workspace/routes.ts');

    const differentThread = await store.listMessages({ threadId: 'thread_xyz' });
    expect(differentThread.length).toBe(0);
  });
});
