import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  username = '';
  password = '';

  constructor(
    private router: Router
  ) {}

  login(): void {
    if (this.username && this.password) {
      localStorage.setItem(
        'adminUser',
        JSON.stringify({
          username: this.username
        })
      );
      this.router.navigate(['/admin/customer']);
    } else {
      alert('Vui lòng nhập tài khoản và mật khẩu');
    }
  }

}