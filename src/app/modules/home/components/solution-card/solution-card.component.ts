import { Component, Input } from '@angular/core';
import { LoanSolution } from '../../../../core/models/loan.model';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AmortizationTableComponent } from '../amortization-table/amortization-table.component';

@Component({
  selector: 'app-solution-card',
  templateUrl: './solution-card.component.html',
  styleUrls: ['./solution-card.component.scss']
})
export class SolutionCardComponent {
  @Input() solution!: LoanSolution;
  @Input() highlight = false;
  @Input() isBestEffort = false;

  constructor(private modal: NzModalService) {}

  openSchedule(): void {
    this.modal.create({
      nzTitle: `Lịch trả nợ — ${this.formatVND(this.solution.amount)} / ${this.solution.term} tháng`,
      nzContent: AmortizationTableComponent,
      nzComponentParams: {
        rows: this.solution.amortizationSchedule,
        principal: this.solution.amount
      },
      nzWidth: '80%',
      nzFooter: null,
      nzCentered: true
    });
  }

  get dbrPercent(): number {
    return Math.round(this.solution.dbr * 10) / 10;
  }

  get dbrThreshold(): number {
    return this.solution.dbrThreshold;
  }

  get dbrFillPercent(): number {
    // Fill bar: relative to threshold * 1.3 (so threshold appears at ~77%)
    const max = this.dbrThreshold * 1.3;
    return Math.min((this.solution.dbr / max) * 100, 100);
  }

  get dbrStatus(): 'ok' | 'warn' | 'over' {
    const ratio = this.solution.dbr / this.dbrThreshold;
    if (ratio <= 0.85) return 'ok';
    if (ratio <= 1.0) return 'warn';
    return 'over';
  }

  formatVND(amount: number): string {
    if (!amount && amount !== 0) return '—';
    if (amount >= 1_000_000_000) {
      return (amount / 1_000_000_000).toFixed(3).replace(/\.?0+$/, '') + ' tỷ';
    }
    // Dưới 1 tỷ: hiển thị đầy đủ với dấu chấm phân nghìn
    return amount.toLocaleString('vi-VN') + ' đ';
  }

  formatRate(rate: number): string {
    return rate.toFixed(1) + '%/năm';
  }
}
