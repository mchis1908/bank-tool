import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  LoanInput, LoanType, LoanTerm, CustomerGroup,
  RateCustomerType, SpecialOfferType, LoanSolverResult, DebtObligation
} from 'src/app/core/models/loan.model'
import { LoanSolverService } from 'src/app/core/services/loan-solver.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  form!: FormGroup;
  result: LoanSolverResult | null = null;
  isLoading = false;

  readonly LoanType = LoanType;
  readonly CustomerGroup = CustomerGroup;
  readonly RateCustomerType = RateCustomerType;
  readonly SpecialOfferType = SpecialOfferType;

  readonly loanTypes = [
    { value: LoanType.PL_SALARY, label: 'PL-Salary' },
    { value: LoanType.PL_SGI, label: 'PL-SGI' }
  ];

  readonly sgiGroups = [
    { value: CustomerGroup.SGI_PROFESSIONAL, label: 'Professional (x12) (công lập)' },
    { value: CustomerGroup.SGI_ELITE_ETB, label: 'Elite ETB (x18)' },
    { value: CustomerGroup.SGI_ELITE_HIGH_MI, label: 'Elite - MI ≥ 30tr (x18)' },
    { value: CustomerGroup.SGI_ELITE_GOOD_COMPANY, label: 'Elite - Good Company (x16)' },
    { value: CustomerGroup.SGI_OTHER, label: 'Khác (x12)' }
  ];

  readonly salaryGroups = [
    { value: CustomerGroup.SALARY_PUBLIC_OR_ETB_OR_HIGH_GOOD, label: 'Lĩnh vực công (x18, trần 1.2 tỷ)' },
    { value: CustomerGroup.SALARY_PUBLIC_OR_ETB_OR_HIGH_GOOD, label: 'Khách hàng hiện hữu (ETB) (x18, trần 1.2 tỷ)' },
    { value: CustomerGroup.SALARY_PUBLIC_OR_ETB_OR_HIGH_GOOD, label: 'MI ≥ 50tr và thuộc Good Company List (x18, trần 1.2 tỷ)' },
    { value: CustomerGroup.SALARY_HIGH_MI, label: 'MI ≥ 30tr (x18, trần 900tr)' },
    { value: CustomerGroup.SALARY_NORMAL, label: 'Thông thường (x12, trần 900tr)' }
  ];

  readonly rateTypes = [
    { value: RateCustomerType.NORMAL, label: 'KH thông thường' },
    { value: RateCustomerType.EXISTING_CREDIT_CARD, label: 'Có thẻ tín dụng Shinhan (-0.2%)' },
    { value: RateCustomerType.EXISTING_CUSTOMER, label: 'KH hiện hữu (-0.5%)' }
  ];

  readonly specialOffers = [
    { value: SpecialOfferType.NONE, label: 'Không áp dụng' },
    { value: SpecialOfferType.HIGH_INCOME_30, label: 'High Income - MI ≥ 30tr' },
    { value: SpecialOfferType.HIGH_INCOME_50, label: 'High Income - MI ≥ 50tr' },
    { value: SpecialOfferType.HIGH_VALUED_COMPANY, label: 'High Valued Company' },
    { value: SpecialOfferType.HOSPITAL_SCHOOL, label: 'Bệnh viện & Trường học' }
  ];

  readonly termOptions: LoanTerm[] = [12, 24, 36, 48, 60];

  get isSGI(): boolean {
    return this.form?.get('loanType')?.value === LoanType.PL_SGI;
  }

  get customerGroups() {
    return this.isSGI ? this.sgiGroups : this.salaryGroups;
  }

  constructor(private fb: FormBuilder, private solver: LoanSolverService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      loanType: [LoanType.PL_SALARY, Validators.required],
      mi: [16000000, [Validators.required, Validators.min(1_000_000)]],
      customerGroup: [CustomerGroup.SALARY_NORMAL, Validators.required],
      rateCustomerType: [RateCustomerType.NORMAL, Validators.required],
      specialOffer: [SpecialOfferType.NONE, Validators.required],
      desiredAmount: [200000000, [Validators.required, Validators.min(25_000_000)]],
      desiredTerm: [24, Validators.required],

      // SGI Guarantee
      hasSgiGuarantee: [false],
      sgiApprovedAmount: [null],
      sgiAfterJul2024: [false],

      // Debt
      monthlyShinhanDebt: [0, Validators.min(0)],
      monthlyOtherTctdDebt: [0, Validators.min(0)],
      creditCardAvgBalance: [0, Validators.min(0)],
      overdraftLimit: [0, Validators.min(0)],
      otherLoanEquivalent: [0, Validators.min(0)],
      hasSpouseDebt: [false],
      spouseDebtAtShinhan: [0],
      spouseMI: [0],
    });

    // Reset customer group when loan type changes
    this.form.get('loanType')?.valueChanges.subscribe(type => {
      const defaultGroup = type === LoanType.PL_SGI
        ? CustomerGroup.SGI_OTHER
        : CustomerGroup.SALARY_NORMAL;
      this.form.get('customerGroup')?.setValue(defaultGroup);
      this.result = null;
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.result = null;

    const v = this.form.value;
    const debt: DebtObligation = {
      monthlyShinhanDebt: v.monthlyShinhanDebt || 0,
      monthlyOtherTctdDebt: v.monthlyOtherTctdDebt || 0,
      creditCardAvgBalance: v.creditCardAvgBalance || 0,
      overdraftLimit: v.overdraftLimit || 0,
      otherLoanEquivalent: v.otherLoanEquivalent || 0,
      spouseDebtAtShinhan: v.hasSpouseDebt ? (v.spouseDebtAtShinhan || 0) : undefined,
      spouseMI: v.hasSpouseDebt ? (v.spouseMI || 0) : undefined
    };

    const input: LoanInput = {
      loanType: v.loanType,
      mi: Number(v.mi),
      customerGroup: v.customerGroup,
      rateCustomerType: v.rateCustomerType,
      specialOffer: v.specialOffer,
      desiredAmount: Number(v.desiredAmount),
      desiredTerm: Number(v.desiredTerm) as LoanTerm,  // ← ép kiểu
      sgiGuarantee: (v.hasSgiGuarantee && v.sgiApprovedAmount)
        ? { approvedAmount: Number(v.sgiApprovedAmount), afterJul2024: v.sgiAfterJul2024 }
        : undefined,
      debt: {
        monthlyShinhanDebt: Number(v.monthlyShinhanDebt) || 0,
        monthlyOtherTctdDebt: Number(v.monthlyOtherTctdDebt) || 0,
        creditCardAvgBalance: Number(v.creditCardAvgBalance) || 0,
        overdraftLimit: Number(v.overdraftLimit) || 0,
        otherLoanEquivalent: Number(v.otherLoanEquivalent) || 0,
        spouseDebtAtShinhan: v.hasSpouseDebt ? Number(v.spouseDebtAtShinhan) || 0 : undefined,
        spouseMI: v.hasSpouseDebt ? Number(v.spouseMI) || 0 : undefined
      }
    };

    // Simulate async (in real app this might be an Observable)
    setTimeout(() => {
      this.result = this.solver.solve(input);
      this.isLoading = false;
    }, 300);
  }

  onReset(): void {
    this.form.reset({
      loanType: LoanType.PL_SALARY,
      customerGroup: CustomerGroup.SALARY_NORMAL,
      rateCustomerType: RateCustomerType.NORMAL,
      specialOffer: SpecialOfferType.NONE,
      desiredTerm: 24,
      hasSgiGuarantee: false,
      sgiAfterJul2024: false,
      hasSpouseDebt: false,
      monthlyShinhanDebt: 0,
      monthlyOtherTctdDebt: 0,
      creditCardAvgBalance: 0,
      overdraftLimit: 0,
      otherLoanEquivalent: 0,
      spouseDebtAtShinhan: 0,
      spouseMI: 0
    });
    this.result = null;
  }

  formatVND(amount: number): string {
    if (!amount && amount !== 0) return '—';
    if (amount >= 1_000_000_000) {
      return (amount / 1_000_000_000).toFixed(3).replace(/\.?0+$/, '') + ' tỷ';
    }
    // Dưới 1 tỷ: hiển thị đầy đủ với dấu chấm phân nghìn
    return amount.toLocaleString('vi-VN') + ' đ';
  }
}
