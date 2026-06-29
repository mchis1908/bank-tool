import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface AdminNavItem {
  label: string;
  icon: string;
  routerLink: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {

  readonly navItems: AdminNavItem[] = [
    { label: 'Khách hàng', icon: '👤', routerLink: '/admin/customer' },
    { label: 'Chiến dịch Email', icon: '📧', routerLink: '/admin/campaign' },
    { label: 'Mẫu Email', icon: '📝', routerLink: '/admin/email-template' },
    { label: 'Cấu hình khoản vay', icon: '⚙️', routerLink: '/admin/loan-config', disabled: true },
    { label: 'Báo cáo', icon: '📊', routerLink: '/admin/report', disabled: true }
  ];

  adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');

  constructor(private router: Router) {}

  logout(): void {
    localStorage.removeItem('adminUser');
    this.router.navigate(['/admin/login']);
  }
}