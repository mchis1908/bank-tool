// src/app/core/models/email-template.model.ts

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export type EmailSendStatus = 'pending' | 'sending' | 'success' | 'fail';

export interface EmailSendResult {
  customerId: string;
  email: string;
  fullname: string;
  status: EmailSendStatus;
  error?: string;
  sentAt?: string;
}

export interface CampaignSummary {
  total: number;
  success: number;
  fail: number;
  pending: number;
}

export type CampaignPhase = 'idle' | 'sending' | 'done';
