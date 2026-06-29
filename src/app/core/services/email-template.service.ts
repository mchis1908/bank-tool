// src/app/core/services/email-template.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EmailTemplate } from '../models/email-template.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailTemplateService {

  private readonly apiUrl = `${environment.apiUrl}/email-templates`;

  constructor(private http: HttpClient) {}

  getTemplates(): Observable<EmailTemplate[]> {
    return this.http.get<EmailTemplate[]>(this.apiUrl);
  }

  getTemplateById(id: string): Observable<EmailTemplate> {
    return this.http.get<EmailTemplate>(`${this.apiUrl}/${id}`);
  }

  createTemplate(data: Omit<EmailTemplate, '_id' | 'created_at' | 'updated_at'>): Observable<EmailTemplate> {
    return this.http.post<EmailTemplate>(this.apiUrl, data);
  }

  updateTemplate(id: string, data: Partial<Omit<EmailTemplate, '_id' | 'created_at'>>): Observable<EmailTemplate> {
    return this.http.put<EmailTemplate>(`${this.apiUrl}/${id}`, data);
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  extractVariables(body: string): string[] {
    const matches = body.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
  }

  renderTemplate(body: string, data: Record<string, string>): string {
    return body.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || `{{${key}}}`);
  }
}
