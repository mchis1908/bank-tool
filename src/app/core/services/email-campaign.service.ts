// src/app/core/services/email-campaign.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, from } from 'rxjs';
import { Customer } from '../models/customer.model';
import { EmailTemplate } from '../models/email-template.model';
import { EmailSendResult } from '../models/email-template.model';
import { EmailTemplateService } from './email-template.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailCampaignService {

  private readonly apiUrl = `${environment.apiUrl}/email`;

  constructor(
    private templateService: EmailTemplateService,
    private http: HttpClient
  ) {}

  /**
   * Gửi campaign thật qua backend → Resend API.
   * Trả Observable<EmailSendResult> stream từng kết quả sau khi nhận response.
   */
  sendCampaign(
    template: EmailTemplate,
    customers: Customer[],
    _batchSize = 3   // giữ signature cũ để không cần sửa component
  ): Observable<EmailSendResult> {
    const subject = new Subject<EmailSendResult>();

    const customerIds = customers
      .filter(c => c._id)
      .map(c => c._id as string);

    // Khởi tạo pending cho tất cả
    customers.forEach(c => {
      subject.next({
        customerId: c._id || '',
        email: c.email,
        fullname: c.fullname,
        status: 'pending'
      });
    });

    this.http.post<{ results: EmailSendResult[]; summary: any }>(
      `${this.apiUrl}/send-campaign`,
      { templateId: template._id, customerIds }
    ).subscribe({
      next: (res) => {
        res.results.forEach(r => subject.next(r));
        subject.complete();
      },
      error: (err) => {
        // Nếu API lỗi hoàn toàn → đánh dấu tất cả fail
        customers.forEach(c => {
          subject.next({
            customerId: c._id || '',
            email: c.email,
            fullname: c.fullname,
            status: 'fail',
            sentAt: new Date().toISOString(),
            error: err?.error?.message || 'Lỗi kết nối server'
          });
        });
        subject.complete();
      }
    });

    return subject.asObservable();
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
