// src/app/core/services/loan-solver.service.ts
import { Injectable } from '@angular/core';
import {
  LoanInput,
  LoanSolution,
  LoanSolverResult,
  LoanTerm
} from '../models/loan.model';
import { LoanConfigService } from './loan-config.service';
import { LoanCalculationService } from './loan-calculation.service';

@Injectable({ providedIn: 'root' })
export class LoanSolverService {

  // Bước nhảy khi dò số tiền vay (VNĐ). 5 triệu là hợp lý cho thực tế.
  private readonly AMOUNT_STEP = 5_000_000;

  // Số phương án tối đa lấy mỗi nhóm (A và B)
  private readonly MAX_PER_GROUP = 5;

  constructor(
    private config: LoanConfigService,
    private calc: LoanCalculationService
  ) {}

  solve(input: LoanInput): LoanSolverResult {
    const limits = this.config.loanLimits[input.loanType];
    const maxTheoretical = this.calc.getMaxTheoreticalAmount(input);

    // Chặn trên thực tế cho việc dò số tiền: không vượt quá mong muốn KH,
    // không vượt hạn mức lý thuyết, không vượt trần sản phẩm.
    const upperBoundAmount = Math.min(
      input.desiredAmount,
      maxTheoretical,
      limits.maxAmount
    );

    const allEvaluated: LoanSolution[] = [];

    // ===== 1. Kiểm tra phương án ĐÚNG mong muốn KH =====
    let exactMatch: LoanSolution | null = null;
    if (input.desiredAmount <= maxTheoretical && input.desiredAmount >= limits.minAmount) {
      const scenario = this.calc.evaluateScenario(input, input.desiredAmount, input.desiredTerm);
      const solution = this.toSolution(scenario, input, 'EXACT');
      allEvaluated.push(solution);
      if (solution.isValid) {
        exactMatch = solution;
      }
    }

    // ===== 2. Nhóm A: Giữ số tiền vay, đổi kỳ hạn =====
    const keepAmountCandidates: LoanSolution[] = [];
    const amountForGroupA = Math.min(input.desiredAmount, upperBoundAmount);
    if (amountForGroupA >= limits.minAmount) {
      for (const term of limits.terms) {
        if (term === input.desiredTerm) continue; // đã có ở exactMatch
        const scenario = this.calc.evaluateScenario(input, amountForGroupA, term);
        const solution = this.toSolution(scenario, input, 'KEEP_AMOUNT_CHANGE_TERM');
        allEvaluated.push(solution);
        if (solution.isValid) {
          keepAmountCandidates.push(solution);
        }
      }
    }

    // ===== 3. Nhóm B: Giữ kỳ hạn, đổi số tiền (giảm dần từ mong muốn xuống sàn) =====
    const keepTermCandidates: LoanSolution[] = [];
    for (let amount = upperBoundAmount; amount >= limits.minAmount; amount -= this.AMOUNT_STEP) {
      if (amount === input.desiredAmount) continue; // đã có ở exactMatch
      const scenario = this.calc.evaluateScenario(input, amount, input.desiredTerm);
      const solution = this.toSolution(scenario, input, 'KEEP_TERM_CHANGE_AMOUNT');
      allEvaluated.push(solution);
      if (solution.isValid) {
        keepTermCandidates.push(solution);
        // Một khi đã tìm được mức tiền hợp lệ cao nhất ở kỳ hạn này,
        // các mức thấp hơn vẫn được thử để có thêm lựa chọn, nhưng giới hạn
        // số lượng để tránh tính toán dư thừa.
        if (keepTermCandidates.length >= this.MAX_PER_GROUP * 2) break;
      }
    }

    // ===== 4. Sắp hạng từng nhóm theo: lệch ít nhất -> DBR thấp nhất -> tổng lãi thấp nhất =====
    const rankedKeepAmount = this.rankSolutions(keepAmountCandidates).slice(0, this.MAX_PER_GROUP);
    const rankedKeepTerm = this.rankSolutions(keepTermCandidates).slice(0, this.MAX_PER_GROUP);

    const hasAnyValidSolution = !!exactMatch || rankedKeepAmount.length > 0 || rankedKeepTerm.length > 0;

    // ===== 5. Nếu không có phương án hợp lệ nào -> lấy phương án DBR gần ngưỡng nhất (best effort) =====
    let bestEffort: LoanSolution | null = null;
    if (!hasAnyValidSolution && allEvaluated.length > 0) {
      bestEffort = allEvaluated.reduce((best, current) =>
        (current.dbr - current.dbrThreshold) < (best.dbr - best.dbrThreshold) ? current : best
      );
    }

    return {
      exactMatch,
      keepAmountSolutions: rankedKeepAmount,
      keepTermSolutions: rankedKeepTerm,
      bestEffort,
      hasAnyValidSolution
    };
  }

  /**
   * Chuyển kết quả evaluateScenario thành LoanSolution, tính độ lệch so với mong muốn ban đầu.
   * Độ lệch chuẩn hoá = trung bình của (lệch số tiền %, lệch kỳ hạn %) - dùng để so sánh tương đối.
   */
  private toSolution(
    scenario: ReturnType<LoanCalculationService['evaluateScenario']>,
    input: LoanInput,
    groupTag: LoanSolution['groupTag']
  ): LoanSolution {
    const amountDeviation = input.desiredAmount > 0
      ? Math.abs(scenario.amount - input.desiredAmount) / input.desiredAmount
      : 0;
    const termDeviation = input.desiredTerm > 0
      ? Math.abs(scenario.term - input.desiredTerm) / input.desiredTerm
      : 0;

    // Trọng số: số tiền quan trọng hơn kỳ hạn (theo nghiệp vụ đã thống nhất)
    const deviationFromDesired = (amountDeviation * 0.7 + termDeviation * 0.3) * 100;

    const amortizationSchedule = this.calc.calculateAmortizationSchedule(
      scenario.amount,
      scenario.interestRate,
      scenario.term
    );

    return {
      amount: scenario.amount,
      term: scenario.term,
      interestRate: scenario.interestRate,
      monthlyPayment: scenario.monthlyPayment,
      totalInterest: scenario.totalInterest,
      dbr: scenario.dbr,
      dbrThreshold: scenario.dbrThreshold,
      isValid: scenario.isValid,
      deviationFromDesired,
      groupTag,
      amortizationSchedule
    };
  }

  /**
   * Sắp hạng: độ lệch thấp nhất -> DBR thấp nhất -> tổng lãi thấp nhất
   */
  private rankSolutions(solutions: LoanSolution[]): LoanSolution[] {
    return [...solutions].sort((a, b) => {
      // So sánh độ lệch (cho phép sai số nhỏ 0.5% coi như ngang nhau)
      const devDiff = a.deviationFromDesired - b.deviationFromDesired;
      if (Math.abs(devDiff) > 0.5) return devDiff;

      // DBR thấp hơn tốt hơn (cho phép sai số 1%)
      const dbrDiff = a.dbr - b.dbr;
      if (Math.abs(dbrDiff) > 1) return dbrDiff;

      // Tổng lãi thấp hơn tốt hơn
      return a.totalInterest - b.totalInterest;
    });
  }
}