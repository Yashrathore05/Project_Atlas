import { IEventBus, IEvent, EventCallback, ServiceHealth, ServiceStatus } from '@atlas/contracts';

export class EventBus implements IEventBus {
  private currentStatus: ServiceStatus = 'uninitialized';
  private subscribers: Map<string, Map<string, EventCallback>> = new Map();

  async initialize(): Promise<void> {
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.subscribers.clear();
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      details: { totalTopics: this.subscribers.size },
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }

  public async publish<T>(event: IEvent<T>): Promise<void> {
    const topicSubscribers = this.subscribers.get(event.name);
    if (!topicSubscribers) {
      return;
    }

    // Dispatch events concurrently
    const promises = Array.from(topicSubscribers.values()).map(async (callback) => {
      try {
        await callback(event);
      } catch (err) {
        // Isolate failures to prevent crash cascades
        console.error(`Error in event subscriber for topic "${event.name}":`, err);
      }
    });

    await Promise.all(promises);
  }

  public subscribe<T>(eventName: string, callback: EventCallback<T>): string {
    const subscriptionId = Math.random().toString(36).substring(2, 15);
    
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Map());
    }

    this.subscribers.get(eventName)!.set(subscriptionId, callback);
    return subscriptionId;
  }

  public unsubscribe(subscriptionId: string): void {
    for (const [eventName, subsMap] of this.subscribers.entries()) {
      if (subsMap.has(subscriptionId)) {
        subsMap.delete(subscriptionId);
        if (subsMap.size === 0) {
          this.subscribers.delete(eventName);
        }
        break;
      }
    }
  }
}
