/**
 * Rate limiting queue for Gemini API calls
 * Prevents hitting rate limits by spacing out requests
 */

interface QueueItem {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

const queue: QueueItem[] = [];
let processing = false;
let lastCallTime = 0;

// Minimum interval between API calls (milliseconds)
const MIN_INTERVAL = 4000; // 4 seconds (Emergency Slow Down)
const MAX_RETRIES = 0; // Disable internal retries to rely on chain fallback

/**
 * Process the queue with rate limiting
 */
async function processQueue(): Promise<void> {
  if (processing || queue.length === 0) return;

  processing = true;

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;

    // Ensure minimum interval between calls
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall < MIN_INTERVAL) {
      const waitTime = MIN_INTERVAL - timeSinceLastCall;
      console.log(`[Queue] Waiting ${waitTime}ms before next call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    try {
      lastCallTime = Date.now();
      const result = await item.fn();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }
  }

  processing = false;
}

/**
 * Add API call to rate-limited queue
 */
export async function rateLimitedCall<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    processQueue();
  });
}

/**
 * Get current queue size (for monitoring)
 */
export function getQueueSize(): number {
  return queue.length;
}

/**
 * Exponential backoff retry wrapper
 * If retries = 0, just calls the function once without retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  // If retries is 0, just call the function once (no retry logic)
  if (retries === 0) {
    return await fn();
  }

  // Otherwise, implement retry logic
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      // If rate limited (429) or server error (5xx), retry with exponential backoff
      const isRetryable =
        error.message?.includes('429') ||
        error.message?.includes('503') ||
        error.message?.includes('500');

      if (!isRetryable || i === retries - 1) {
        throw error;
      }

      const waitTime = Math.min(1000 * Math.pow(2, i), 10000); // Max 10 seconds
      console.log(`[Retry] Attempt ${i + 1}/${retries} failed, waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('Max retries exceeded');
}
