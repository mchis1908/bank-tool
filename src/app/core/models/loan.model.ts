// src/app/core/models/loan.model.ts

export enum LoanType {
  PL_SGI = 'PL_SGI',
  PL_SALARY = 'PL_SALARY'
}

export type LoanTerm = 12 | 24 | 36 | 48 | 60;

export enum RateCustomerType {
  NORMAL = 'NORMAL',                       // KH thông thường
  EXISTING_CREDIT_CARD = 'EXISTING_CREDIT_CARD', // -0.2%
  EXISTING_CUSTOMER = 'EXISTING_CUSTOMER'  // -0.5%
}

// Nhóm khách hàng - dùng để xác định hệ số x MI (hạn mức tối đa)
export enum CustomerGroup {
  // PL-SGI only
  SGI_PROFESSIONAL = 'SGI_PROFESSIONAL',         // x12
  SGI_ELITE_ETB = 'SGI_ELITE_ETB',               // x18
  SGI_ELITE_HIGH_MI = 'SGI_ELITE_HIGH_MI',       // x18 (MI >= 30tr)
  SGI_ELITE_GOOD_COMPANY = 'SGI_ELITE_GOOD_COMPANY', // x16 (20tr <= MI < 30tr + Good Company)
  SGI_OTHER = 'SGI_OTHER',                       // x12

  // PL-Salary only
  SALARY_PUBLIC_OR_ETB_OR_HIGH_GOOD = 'SALARY_PUBLIC_OR_ETB_OR_HIGH_GOOD', // x18, trần 1.2 tỷ
  SALARY_HIGH_MI = 'SALARY_HIGH_MI',             // x18, trần 900tr (MI >= 30tr)
  SALARY_NORMAL = 'SALARY_NORMAL'                // x12, trần 900tr (MI < 30tr)
}

export enum SpecialOfferType {
  NONE = 'NONE',
  HIGH_INCOME_30 = 'HIGH_INCOME_30',
  HIGH_INCOME_50 = 'HIGH_INCOME_50',
  HIGH_VALUED_COMPANY = 'HIGH_VALUED_COMPANY',
  HOSPITAL_SCHOOL = 'HOSPITAL_SCHOOL'
}

// Khoản nợ/nghĩa vụ tài chính hiện có của khách hàng
export interface DebtObligation {
  monthlyShinhanDebt: number;        // nợ phải trả tại Shinhan/tháng (không gồm khoản mới)
  monthlyOtherTctdDebt: number;      // nợ phải trả tại TCTD khác/tháng
  creditCardAvgBalance: number;      // dư nợ TB thẻ TD (TB 12 tháng cho SGI, 3 tháng cho Salary)
  overdraftLimit: number;            // hạn mức thấu chi cao nhất
  otherLoanEquivalent: number;       // khoản vay khác quy đổi ngắn hạn/tháng
  spouseDebtAtShinhan?: number;      // nợ vợ/chồng tại Shinhan (optional)
  spouseMI?: number;                 // MI vợ/chồng (optional, cộng vào mẫu số nếu có)
}

export interface LoanInput {
  loanType: LoanType;
  mi: number;                        // thu nhập ròng (monthly income) của KH chính
  customerGroup: CustomerGroup;
  rateCustomerType: RateCustomerType;
  specialOffer: SpecialOfferType;
  desiredAmount: number;             // số tiền KH muốn vay (VNĐ)
  desiredTerm: LoanTerm;
  // PL-SGI: khoản SGI bảo lãnh hiện hữu (nếu có)
  sgiGuarantee?: {
    approvedAmount: number;
    afterJul2024: boolean;           // true => 104%, false => 100%
  };
  debt: DebtObligation;
}

export interface LoanSolution {
  amount: number;
  term: LoanTerm;
  interestRate: number;              // %/năm áp dụng (đã làm tròn theo policy)
  monthlyPayment: number;            // PMT
  totalInterest: number;
  dbr: number;                       // % (đã tính theo công thức DBR chuẩn)
  dbrThreshold: number;              // ngưỡng DBR cho phép theo MI
  isValid: boolean;                  // dbr <= dbrThreshold
  deviationFromDesired: number;      // % lệch so với mong muốn ban đầu (0 = khớp hoàn toàn)
  groupTag: 'EXACT' | 'KEEP_AMOUNT_CHANGE_TERM' | 'KEEP_TERM_CHANGE_AMOUNT';
  amortizationSchedule: AmortizationRow[];
}

export interface LoanSolverResult {
  exactMatch: LoanSolution | null;       // phương án đúng y/c KH (nếu DBR đạt)
  keepAmountSolutions: LoanSolution[];   // giữ tiền, đổi kỳ hạn
  keepTermSolutions: LoanSolution[];     // giữ kỳ hạn, đổi tiền
  bestEffort: LoanSolution | null;       // nếu không có phương án nào hợp lệ, lấy DBR gần ngưỡng nhất
  hasAnyValidSolution: boolean;
}

export interface AmortizationRow {
  month: number;
  payment: number;       // số tiền trả tháng đó
  principal: number;     // phần gốc
  interest: number;      // phần lãi
  balance: number;       // dư nợ còn lại
}