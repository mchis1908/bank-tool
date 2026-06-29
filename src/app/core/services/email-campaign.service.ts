// src/app/core/services/email-campaign.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject, from } from 'rxjs';
import { Customer } from '../models/customer.model';
import { EmailTemplate } from '../models/email-template.model';
import { EmailSendResult } from '../models/email-template.model';
import { EmailTemplateService } from './email-template.service';

@Injectable({ providedIn: 'root' })
export class EmailCampaignService {

  constructor(private templateService: EmailTemplateService) {}

  /**
   * Simulate gửi email theo từng khách hàng.
   * Emit Observable<EmailSendResult> cho mỗi email được xử lý.
   * Dùng Subject để stream từng kết quả.
   */
  sendCampaign(
    template: EmailTemplate,
    customers: Customer[],
    batchSize = 3
  ): Observable<EmailSendResult> {
    const subject = new Subject<EmailSendResult>();

    this.processBatch(template, customers, subject, batchSize);

    return subject.asObservable();
  }

  private async processBatch(
    template: EmailTemplate,
    customers: Customer[],
    subject: Subject<EmailSendResult>,
    batchSize: number
  ): Promise<void> {
    const batches: Customer[][] = [];
    for (let i = 0; i < customers.length; i += batchSize) {
      batches.push(customers.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const promises = batch.map(customer =>
        this.simulateSendEmail(template, customer)
      );

      const results = await Promise.all(
        promises.map(async (p) => {
          const result = await p;
          subject.next(result);
          return result;
        })
      );

      // nhỏ delay giữa các batch
      await this.sleep(300);
    }

    subject.complete();
  }

  private async simulateSendEmail(
    template: EmailTemplate,
    customer: Customer
  ): Promise<EmailSendResult> {
    // Simulate thời gian gửi: 400ms - 1500ms
    const delay = 400 + Math.random() * 1100;
    await this.sleep(delay);

    // Simulate tỷ lệ thất bại ~15%
    const isSuccess = Math.random() > 0.15;

    const errorMessages = [
      'Email address not found',
      'SMTP connection timeout',
      'Mailbox full',
      'Invalid email format'
    ];

    const result: EmailSendResult = {
      customerId: customer._id || '',
      email: customer.email,
      fullname: customer.fullname,
      status: isSuccess ? 'success' : 'fail',
      sentAt: new Date().toISOString(),
      error: isSuccess
        ? undefined
        : errorMessages[Math.floor(Math.random() * errorMessages.length)]
    };

    return result;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  renderEmailBody(template: EmailTemplate, customer: Customer): string {
    return this.templateService.renderTemplate(template.body, {
      fullname: customer.fullname || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      province: customer.province || '',
    });
  }

  renderEmailSubject(template: EmailTemplate, customer: Customer): string {
    return this.templateService.renderTemplate(template.subject, {
      fullname: customer.fullname || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
    });
  }
}
