// Browser & Node compatible UUID generation
const randomUUID = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export type MessageType =
  | 'REQUEST'
  | 'RESPONSE'
  | 'QUESTION'
  | 'ANSWER'
  | 'UPDATE'
  | 'ERROR'
  | 'NOTIFICATION'
  | 'APPROVAL';

export type MessagePriority = 'low' | 'medium' | 'high';

export interface AgentMessage {
  id: string;
  type: MessageType;
  senderId: string;
  receiverId: string;
  content: string;
  priority: MessagePriority;
  attachments: string[]; // file paths
  memoryReferences: string[]; // memory IDs
  contextReferences: string[]; // context chunk IDs
  taskReferences: string[]; // task IDs
  conversationId: string;
  threadId: string;
  timestamp: Date;
}

export class MessageStore {
  private messages: AgentMessage[] = [];

  /**
   * Stores a communication message in memory/registry.
   */
  public async storeMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<AgentMessage> {
    const fullMessage: AgentMessage = {
      ...message,
      id: randomUUID(),
      timestamp: new Date()
    };
    this.messages.push(fullMessage);
    return fullMessage;
  }

  /**
   * Fetches a message by its ID.
   */
  public async getMessage(id: string): Promise<AgentMessage | null> {
    return this.messages.find(m => m.id === id) || null;
  }

  /**
   * Lists and filters stored messages.
   */
  public async listMessages(filter?: {
    conversationId?: string;
    threadId?: string;
    senderId?: string;
    receiverId?: string;
  }): Promise<AgentMessage[]> {
    let result = [...this.messages];

    if (filter) {
      if (filter.conversationId) {
        result = result.filter(m => m.conversationId === filter.conversationId);
      }
      if (filter.threadId) {
        result = result.filter(m => m.threadId === filter.threadId);
      }
      if (filter.senderId) {
        result = result.filter(m => m.senderId === filter.senderId);
      }
      if (filter.receiverId) {
        result = result.filter(m => m.receiverId === filter.receiverId);
      }
    }

    return result;
  }
}
