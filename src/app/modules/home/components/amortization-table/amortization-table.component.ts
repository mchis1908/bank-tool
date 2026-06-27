import { Component, Input, OnInit } from '@angular/core';
import { AmortizationRow } from '../../../../core/models/loan.model';

@Component({
  selector: 'app-amortization-table',
  templateUrl: './amortization-table.component.html',
  styleUrls: ['./amortization-table.component.scss']
})
export class AmortizationTableComponent {
  @Input() rows: AmortizationRow[] = [];
  @Input() principal = 0;

  get totalPayment(): number {
    return this.rows.reduce((s, r) => s + r.payment, 0);
  }

  get totalPrincipal(): number {
    return this.rows.reduce((s, r) => s + r.principal, 0);
  }

  get totalInterest(): number {
    return this.rows.reduce((s, r) => s + r.interest, 0);
  }

  fmt(n: number): string {
    return n.toLocaleString('vi-VN');
  }
}