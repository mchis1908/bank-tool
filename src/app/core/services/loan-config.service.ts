// src/app/core/services/loan-config.service.ts
import { Injectable } from '@angular/core';
import {
  LoanType,
  CustomerGroup,
  RateCustomerType,
  SpecialOfferType,
  LoanTerm
} from '../models/loan.model';

// ===== Cấu hình hệ số nhóm khách hàng (hệ số x MI + trần tối đa) =====
export interface CustomerGroupConfig {
  multiplier: number;     // hệ số x MI
  maxAmountCap?: number;  // trần tối đa tuyệt đối (VNĐ), nếu có
}

// ===== Cấu hình 1 bậc lãi suất theo khoảng tiền giải ngân =====
export interface RateBracket {
  minAmount: number;  // VNĐ, inclusive
  maxAmount: number;  // VNĐ, inclusive (dùng Infinity cho bậc cao nhất)
  normal: number;             // KH thông thường (%/năm)
  existingCreditCard: number; // -0.2%
  existingCustomer: number;   // -0.5%
}

export interface SpecialOfferConfig {
  type: SpecialOfferType;
  consumerLoanRate: number;      // PL-Salary
  consumerBondLoanRate: number;  // PL-SGI
  label: string;
}

@Injectable({ providedIn: 'root' })
export class LoanConfigService {

  private readonly MILLION = 1_000_000;

  // ===== Giới hạn chung theo loại vay =====
  readonly loanLimits = {
    [LoanType.PL_SGI]: {
      minAmount: 25 * this.MILLION,
      maxAmount: 500 * this.MILLION,
      minMI: 8 * this.MILLION,
      terms: [12, 24, 36, 48, 60] as LoanTerm[],
      maxMultiplier: 18,
      rateFloor: 14.0,       // sàn lãi suất sau giảm
      maxRateReduction: 1.5  // giảm cộng dồn tối đa
    },
    [LoanType.PL_SALARY]: {
      minAmount: 25 * this.MILLION,
      maxAmount: 1200 * this.MILLION,
      minMI: 10 * this.MILLION,
      terms: [12, 24, 36, 48, 60] as LoanTerm[],
      maxMultiplier: 18,
      rateFloor: 11.5,
      maxRateReduction: 1.5
    }
  };

  // ===== Hệ số nhóm khách hàng =====
  readonly customerGroupConfig: Record<CustomerGroup, CustomerGroupConfig> = {
    [CustomerGroup.SGI_PROFESSIONAL]:        { multiplier: 12 },
    [CustomerGroup.SGI_ELITE_ETB]:           { multiplier: 18 },
    [CustomerGroup.SGI_ELITE_HIGH_MI]:       { multiplier: 18 },
    [CustomerGroup.SGI_ELITE_GOOD_COMPANY]:  { multiplier: 16 },
    [CustomerGroup.SGI_OTHER]:               { multiplier: 12 },

    [CustomerGroup.SALARY_PUBLIC_OR_ETB_OR_HIGH_GOOD]: { multiplier: 18, maxAmountCap: 1200 * this.MILLION },
    [CustomerGroup.SALARY_HIGH_MI]:                    { multiplier: 18, maxAmountCap: 900 * this.MILLION },
    [CustomerGroup.SALARY_NORMAL]:                     { multiplier: 12, maxAmountCap: 900 * this.MILLION },
  };

  // ===== Bảng lãi suất PL-SGI (Consumer Bond Loan) theo số tiền giải ngân =====
  readonly sgiRateTable: RateBracket[] = [
    { minAmount: 0,             maxAmount: 100 * this.MILLION - 1, normal: 30.0, existingCreditCard: 29.8, existingCustomer: 29.5 },
    { minAmount: 100 * this.MILLION, maxAmount: 199_999_999,        normal: 26.0, existingCreditCard: 25.8, existingCustomer: 25.5 },
    { minAmount: 200 * this.MILLION, maxAmount: 299_999_999,        normal: 22.0, existingCreditCard: 21.8, existingCustomer: 21.5 },
    { minAmount: 300 * this.MILLION, maxAmount: 399_999_999,        normal: 20.0, existingCreditCard: 19.8, existingCustomer: 19.5 },
    { minAmount: 400 * this.MILLION, maxAmount: 499_999_999,        normal: 16.5, existingCreditCard: 16.3, existingCustomer: 16.0 },
    { minAmount: 500 * this.MILLION, maxAmount: Infinity,           normal: 15.5, existingCreditCard: 15.3, existingCustomer: 15.0 },
  ];

  // ===== Bảng lãi suất PL-Salary (Consumer Loan) theo số tiền giải ngân =====
  readonly salaryRateTable: RateBracket[] = [
    { minAmount: 0,             maxAmount: 100 * this.MILLION - 1, normal: 28.0, existingCreditCard: 27.8, existingCustomer: 27.5 },
    { minAmount: 100 * this.MILLION, maxAmount: 199_999_999,        normal: 24.0, existingCreditCard: 23.8, existingCustomer: 23.5 },
    { minAmount: 200 * this.MILLION, maxAmount: 299_999_999,        normal: 20.0, existingCreditCard: 19.8, existingCustomer: 19.5 },
    { minAmount: 300 * this.MILLION, maxAmount: 399_999_999,        normal: 18.0, existingCreditCard: 17.8, existingCustomer: 17.5 },
    { minAmount: 400 * this.MILLION, maxAmount: 499_999_999,        normal: 14.5, existingCreditCard: 14.3, existingCustomer: 14.0 },
    { minAmount: 500 * this.MILLION, maxAmount: 699_999_999,        normal: 13.5, existingCreditCard: 13.3, existingCustomer: 13.0 },
    { minAmount: 700 * this.MILLION, maxAmount: Infinity,           normal: 12.5, existingCreditCard: 12.3, existingCustomer: 12.0 },
  ];

  // ===== Chương trình lãi suất đặc biệt (không cộng dồn với bảng trên) =====
  readonly specialOffers: SpecialOfferConfig[] = [
    { type: SpecialOfferType.HIGH_INCOME_30,      consumerLoanRate: 15.0, consumerBondLoanRate: 17.0, label: 'High Income (MI >= 30tr)' },
    { type: SpecialOfferType.HIGH_INCOME_50,      consumerLoanRate: 13.0, consumerBondLoanRate: 15.0, label: 'High Income (MI >= 50tr)' },
    { type: SpecialOfferType.HIGH_VALUED_COMPANY, consumerLoanRate: 13.0, consumerBondLoanRate: 15.0, label: 'High Valued Company' },
    { type: SpecialOfferType.HOSPITAL_SCHOOL,     consumerLoanRate: 14.5, consumerBondLoanRate: 16.5, label: 'Bệnh viện & Trường học' },
  ];

  // ===== Ngưỡng DBR theo MI - khác nhau giữa 2 loại vay =====
  // PL-SGI (Consumer Bond Loan)
  getDbrThresholdSgi(mi: number): number {
    if (mi < 12 * this.MILLION) return 50;
    if (mi <= 16 * this.MILLION) return 55;
    if (mi <= 20 * this.MILLION) return 60;
    return 70; // mi > 20tr
  }

  // PL-Salary (Consumer Loan)
  getDbrThresholdSalary(mi: number): number {
    if (mi < 12 * this.MILLION) return 45;
    if (mi <= 20 * this.MILLION) return 55;
    return 70; // mi > 20tr
  }

  getDbrThreshold(loanType: LoanType, mi: number): number {
    return loanType === LoanType.PL_SGI
      ? this.getDbrThresholdSgi(mi)
      : this.getDbrThresholdSalary(mi);
  }

  // ===== Helper: lấy bảng lãi suất theo loại vay =====
  getRateTable(loanType: LoanType): RateBracket[] {
    return loanType === LoanType.PL_SGI ? this.sgiRateTable : this.salaryRateTable;
  }

  // ===== Helper: % giảm lãi của 1 RateCustomerType so với "normal" =====
  getBaseRate(loanType: LoanType, amount: number, rateCustomerType: RateCustomerType): number {
    const table = this.getRateTable(loanType);
    const bracket = table.find(b => amount >= b.minAmount && amount <= b.maxAmount);
    if (!bracket) {
      // fallback: dùng bậc cao nhất nếu amount vượt mọi mốc (an toàn)
      const last = table[table.length - 1];
      return this.pickRate(last, rateCustomerType);
    }
    return this.pickRate(bracket, rateCustomerType);
  }

  private pickRate(bracket: RateBracket, type: RateCustomerType): number {
    switch (type) {
      case RateCustomerType.EXISTING_CREDIT_CARD: return bracket.existingCreditCard;
      case RateCustomerType.EXISTING_CUSTOMER:    return bracket.existingCustomer;
      default:                                     return bracket.normal;
    }
  }

  // ===== Helper: lãi suất Special Offer nếu áp dụng =====
  getSpecialOfferRate(loanType: LoanType, offer: SpecialOfferType): number | null {
    if (offer === SpecialOfferType.NONE) return null;
    const cfg = this.specialOffers.find(o => o.type === offer);
    if (!cfg) return null;
    return loanType === LoanType.PL_SGI ? cfg.consumerBondLoanRate : cfg.consumerLoanRate;
  }

  // ===== Áp dụng rate floor (sàn lãi suất tối thiểu) =====
  applyRateFloor(loanType: LoanType, rate: number): number {
    const floor = this.loanLimits[loanType].rateFloor;
    return Math.max(rate, floor);
  }
}