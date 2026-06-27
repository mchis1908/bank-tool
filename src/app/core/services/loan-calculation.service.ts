// src/app/core/services/loan-calculation.service.ts
import { Injectable } from '@angular/core';
import {
  LoanInput,
  LoanType,
  LoanTerm,
  AmortizationRow,
  SpecialOfferType
} from '../models/loan.model';
import { LoanConfigService } from './loan-config.service';

@Injectable({ providedIn: 'root' })
export class LoanCalculationService {

  constructor(private config: LoanConfigService) {}

  getMaxTheoreticalAmount(input: LoanInput): number {
    const groupCfg = this.config.customerGroupConfig[input.customerGroup];
    const limits = this.config.loanLimits[input.loanType];

    let maxByMultiplier = input.mi * groupCfg.multiplier;

    if (groupCfg.maxAmountCap) {
      maxByMultiplier = Math.min(maxByMultiplier, groupCfg.maxAmountCap);
    }

    let max = Math.min(maxByMultiplier, limits.maxAmount);

    if (input.loanType === LoanType.PL_SGI && input.sgiGuarantee) {
      const factor = input.sgiGuarantee.afterJul2024 ? 1.04 : 1.0;
      const guaranteeAmount = input.sgiGuarantee.approvedAmount * factor;
      max = max - guaranteeAmount;
    }

    return Math.max(max, 0);
  }

  getApplicableRate(
    loanType: LoanType,
    amount: number,
    rateCustomerType: LoanInput['rateCustomerType'],
    specialOffer: SpecialOfferType
  ): number {
    const baseRate = this.config.getBaseRate(loanType, amount, rateCustomerType);
    const specialRate = this.config.getSpecialOfferRate(loanType, specialOffer);

    let finalRate = specialRate !== null ? Math.min(baseRate, specialRate) : baseRate;
    finalRate = this.config.applyRateFloor(loanType, finalRate);

    return finalRate;
  }

  /**
   * PMT - phương pháp TRẢ ĐỀU: tổng tiền trả mỗi tháng (gốc + lãi) CỐ ĐỊNH suốt kỳ hạn.
   * Lãi giảm dần theo dư nợ giảm dần, gốc tăng dần để tổng luôn không đổi.
   * Đây là số tiền dùng để tính DBR.
   */
  calculatePMT(principal: number, annualRatePercent: number, termMonths: number): number {
    if (principal <= 0 || termMonths <= 0) return 0;

    const monthlyRate = annualRatePercent / 100 / 12;

    if (monthlyRate === 0) {
      return Math.round(principal / termMonths);
    }

    const factor = Math.pow(1 + monthlyRate, termMonths);
    const pmt = (principal * monthlyRate * factor) / (factor - 1);

    return Math.round(pmt);
  }

  /**
   * Tổng lãi phải trả = Tổng tiền đã trả (PMT × số tháng) - Số tiền gốc vay.
   * Phải tính dựa trên chính monthlyPayment (PMT), không tính lại theo công thức khác,
   * để khớp với bảng amortization (cũng dùng PMT cố định).
   */
  calculateTotalInterest(principal: number, monthlyPayment: number, termMonths: number): number {
    const totalPaid = monthlyPayment * termMonths;
    return Math.max(totalPaid - principal, 0);
  }

  calculateDBR(input: LoanInput, newMonthlyPayment: number): number {
    const debt = input.debt;

    const totalDebtObligation =
      debt.monthlyShinhanDebt +
      newMonthlyPayment +
      debt.monthlyOtherTctdDebt +
      (0.05 * debt.creditCardAvgBalance) +
      (0.05 * debt.overdraftLimit) +
      debt.otherLoanEquivalent +
      (debt.spouseDebtAtShinhan || 0);

    const totalIncome = input.mi + (debt.spouseMI || 0);

    if (totalIncome <= 0) return Infinity;

    return (totalDebtObligation / totalIncome) * 100;
  }

  /**
   * Bảng khấu hao đầy đủ từng tháng - PMT cố định mỗi tháng.
   * Lãi = dư nợ còn lại × lãi suất tháng (giảm dần).
   * Gốc = PMT - lãi (tăng dần).
   * Tháng cuối làm tròn dứt điểm dư nợ còn lại để tránh lệch vài đồng do rounding.
   */
  calculateAmortizationSchedule(
    principal: number,
    annualRatePercent: number,
    termMonths: number
  ): AmortizationRow[] {
    if (principal <= 0 || termMonths <= 0) return [];

    const monthlyRate = annualRatePercent / 100 / 12;
    const pmt = this.calculatePMT(principal, annualRatePercent, termMonths);
    const rows: AmortizationRow[] = [];
    let balance = principal;

    for (let month = 1; month <= termMonths; month++) {
      const interest = Math.round(balance * monthlyRate);
      let principalPaid = pmt - interest;
      let payment = pmt;

      if (month === termMonths) {
        principalPaid = balance;
        payment = principalPaid + interest;
      }

      balance = Math.max(balance - principalPaid, 0);
      rows.push({ month, payment, principal: principalPaid, interest, balance });
    }

    return rows;
  }

  evaluateScenario(input: LoanInput, amount: number, term: LoanTerm) {
    const rate = this.getApplicableRate(input.loanType, amount, input.rateCustomerType, input.specialOffer);
    const monthlyPayment = this.calculatePMT(amount, rate, term);
    const totalInterest = this.calculateTotalInterest(amount, monthlyPayment, term);
    const dbr = this.calculateDBR(input, monthlyPayment);
    const dbrThreshold = this.config.getDbrThreshold(input.loanType, input.mi);
    const amortizationSchedule = this.calculateAmortizationSchedule(amount, rate, term);

    return {
      amount,
      term,
      interestRate: rate,
      monthlyPayment,
      totalInterest,
      dbr,
      dbrThreshold,
      isValid: dbr <= dbrThreshold,
      amortizationSchedule
    };
  }
}