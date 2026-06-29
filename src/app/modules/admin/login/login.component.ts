import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  username = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  login(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Vui lòng nhập tài khoản và mật khẩu';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/customer']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      }
    });
  }

}