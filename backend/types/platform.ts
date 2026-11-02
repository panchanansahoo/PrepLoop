/**
 * Platform API & Webhook Type Definitions
 */

export interface PlatformApiKey {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  prefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export type WebhookEventType =
  | 'interview.completed'
  | 'challenge.solved'
  | 'candidate.screened'
  | 'score.updated';

export interface WebhookSubscription {
  id: string;
  userId: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  isActive: boolean;
  createdAt: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
  responseStatus?: number;
  error?: string;
  createdAt: string;
}

