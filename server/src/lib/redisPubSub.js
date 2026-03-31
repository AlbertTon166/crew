/**
 * Redis Pub/Sub for Real-time Log Streaming
 */

import { createClient } from '@redis/client';

let publisher = null;
let subscriber = null;

// Redis connection config
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Initialize Redis clients
 */
export async function initRedis() {
  try {
    // Publisher client
    publisher = createClient({ url: REDIS_URL });
    publisher.on('error', (err) => console.error('Redis Publisher Error:', err));
    await publisher.connect();

    // Subscriber client (separate, can have multiple)
    subscriber = createClient({ url: REDIS_URL });
    subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
    await subscriber.connect();

    console.log('Redis pub/sub initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    return false;
  }
}

/**
 * Publish a log message to execution channel
 */
export async function publishLog(executionId, logEntry) {
  if (!publisher) {
    console.warn('Redis publisher not initialized');
    return false;
  }

  try {
    const channel = `execution:${executionId}:logs`;
    const message = JSON.stringify({
      ...logEntry,
      timestamp: logEntry.timestamp || new Date().toISOString(),
    });
    
    await publisher.publish(channel, message);
    return true;
  } catch (error) {
    console.error('Failed to publish log:', error);
    return false;
  }
}

/**
 * Subscribe to execution logs
 * Returns an async iterator for SSE streaming
 */
export async function subscribeToLogs(executionId) {
  if (!subscriber) {
    throw new Error('Redis subscriber not initialized');
  }

  const channel = `execution:${executionId}:logs`;
  const messages = [];

  // Create a unique subscriber for this connection
  const subClient = createClient({ url: REDIS_URL });
  await subClient.connect();

  await subClient.subscribe(channel, (message) => {
    messages.push(message);
  });

  // Return cleanup function and message iterator
  return {
    async *[Symbol.asyncIterator]() {
      while (true) {
        // Wait for new message
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        while (messages.length > 0) {
          yield messages.shift();
        }
      }
    },
    cleanup: async () => {
      await subClient.unsubscribe(channel);
      await subClient.quit();
    },
  };
}

/**
 * Subscribe with event emitter pattern for SSE
 */
export function createLogSubscriber(executionId) {
  const channel = `execution:${executionId}:logs`;
  
  return {
    channel,
    handler: null,
    
    start: async function(handler) {
      if (!subscriber) {
        throw new Error('Redis subscriber not initialized');
      }
      
      this.handler = handler;
      await subscriber.subscribe(channel, (message) => {
        if (this.handler) {
          this.handler(JSON.parse(message));
        }
      });
    },
    
    stop: async function() {
      if (subscriber && this.handler) {
        await subscriber.unsubscribe(channel);
        this.handler = null;
      }
    },
  };
}

export function getPublisher() {
  return publisher;
}

export async function closeRedis() {
  if (publisher) await publisher.quit();
  if (subscriber) await subscriber.quit();
}
