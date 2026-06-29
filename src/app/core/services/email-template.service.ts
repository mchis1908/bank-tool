// src/app/core/services/email-template.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { EmailTemplate } from '../models/email-template.model';

const STORAGE_KEY = 'bank_email_templates';

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: '1',
    name: 'Chào mừng khách hàng mới',
    subject: 'Chào mừng {{fullname}} đến với Shinhan Bank!',
    body: `Kính gửi {{fullname}},

Chúng tôi rất vui được chào đón bạn là khách hàng của Ngân hàng Shinhan Bank.

Tài khoản của bạn đã được kích hoạt thành công. Dưới đây là thông tin liên hệ của bạn:
- Email: {{email}}
- Số điện thoại: {{phone}}
- Công ty: {{company}}

Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.

Trân trọng,
Đội ngũ Shinhan Bank`,
    variables: ['fullname', 'email', 'phone', 'company'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Tư vấn gói vay ưu đãi',
    subject: 'Ưu đãi vay vốn dành riêng cho {{fullname}}',
    body: `Kính gửi {{fullname}},

Shinhan Bank xin gửi đến bạn thông tin về các gói vay ưu đãi hiện đang áp dụng.

Chúng tôi nhận thấy bạn đang có nhu cầu vay vốn và chúng tôi có giải pháp phù hợp:

✅ Lãi suất ưu đãi từ 6.5%/năm
✅ Thủ tục đơn giản, nhanh chóng
✅ Hạn mức vay lên đến 10 tỷ đồng
✅ Thời hạn vay linh hoạt

Để biết thêm thông tin chi tiết, vui lòng liên hệ với chúng tôi qua email {{email}} hoặc hotline 1900 1234.

Trân trọng,
Phòng Tín dụng — Shinhan Bank`,
    variables: ['fullname', 'email'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Nhắc nhở hồ sơ',
    subject: '[Shinhan Bank] Hồ sơ của {{fullname}} cần bổ sung',
    body: `Kính gửi {{fullname}},

Chúng tôi nhận thấy hồ sơ vay vốn của bạn còn thiếu một số tài liệu cần thiết.

Vui lòng cung cấp bổ sung các giấy tờ theo yêu cầu trong vòng 7 ngày làm việc kể từ ngày nhận email này.

Nếu cần hỗ trợ, vui lòng liên hệ:
- Email: support@shb.com.vn
- Hotline: 1900 1234

Trân trọng,
Phòng Thẩm định — Shinhan Bank`,
    variables: ['fullname'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

@Injectable({ providedIn: 'root' })
export class EmailTemplateService {
  private templatesSubject = new BehaviorSubject<EmailTemplate[]>(this.loadFromStorage());

  templates$ = this.templatesSubject.asObservable();

  private loadFromStorage(): EmailTemplate[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch {}
    this.saveToStorage(DEFAULT_TEMPLATES);
    return DEFAULT_TEMPLATES;
  }

  private saveToStorage(templates: EmailTemplate[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }

  getTemplates(): Observable<EmailTemplate[]> {
    return this.templates$.pipe(delay(200));
  }

  getTemplateById(id: string): EmailTemplate | undefined {
    return this.templatesSubject.getValue().find(t => t.id === id);
  }

  createTemplate(data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Observable<EmailTemplate> {
    const newTemplate: EmailTemplate = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [...this.templatesSubject.getValue(), newTemplate];
    this.saveToStorage(updated);
    this.templatesSubject.next(updated);
    return of(newTemplate).pipe(delay(300));
  }

  updateTemplate(id: string, data: Partial<Omit<EmailTemplate, 'id' | 'createdAt'>>): Observable<EmailTemplate> {
    const templates = this.templatesSubject.getValue();
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Template not found');
    const updated = [...templates];
    updated[index] = { ...updated[index], ...data, updatedAt: new Date().toISOString() };
    this.saveToStorage(updated);
    this.templatesSubject.next(updated);
    return of(updated[index]).pipe(delay(300));
  }

  deleteTemplate(id: string): Observable<void> {
    const updated = this.templatesSubject.getValue().filter(t => t.id !== id);
    this.saveToStorage(updated);
    this.templatesSubject.next(updated);
    return of(undefined).pipe(delay(200));
  }

  extractVariables(body: string): string[] {
    const matches = body.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
  }

  renderTemplate(body: string, data: Record<string, string>): string {
    return body.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || `{{${key}}}`);
  }
}
