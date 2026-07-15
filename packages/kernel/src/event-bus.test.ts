import { describe, it, expect, vi } from 'vitest';
import { EventBus } from './event-bus';
import { ProjectCreated } from './events';

describe('Event Bus Service', () => {
  it('should publish strongly typed events to subscribed callbacks', async () => {
    const eventBus = new EventBus();
    await eventBus.initialize();

    const callback = vi.fn();
    eventBus.subscribe('ProjectCreated', callback);

    const event = new ProjectCreated({
      id: 'proj-12',
      workspaceId: 'ws-44',
      name: 'Alpha Plan',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await eventBus.publish(event);

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(event);
  });

  it('should cleanly support unsubscribing callbacks', async () => {
    const eventBus = new EventBus();
    await eventBus.initialize();

    const callback = vi.fn();
    const subId = eventBus.subscribe('ProjectCreated', callback);

    eventBus.unsubscribe(subId);

    const event = new ProjectCreated({
      id: 'proj-12',
      workspaceId: 'ws-44',
      name: 'Alpha Plan',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await eventBus.publish(event);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should isolate crashes inside a subscriber to protect remaining subscribers', async () => {
    const eventBus = new EventBus();
    await eventBus.initialize();

    const brokenCallback = vi.fn().mockImplementation(() => {
      throw new Error('Subscriber crash');
    });
    const healthyCallback = vi.fn();

    eventBus.subscribe('ProjectCreated', brokenCallback);
    eventBus.subscribe('ProjectCreated', healthyCallback);

    const event = new ProjectCreated({
      id: 'proj-12',
      workspaceId: 'ws-44',
      name: 'Alpha Plan',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await eventBus.publish(event);

    expect(brokenCallback).toHaveBeenCalledOnce();
    expect(healthyCallback).toHaveBeenCalledOnce();
  });
});
