import { Component, Input } from '@angular/core';
import { LoanSolverResult, LoanSolution } from '../../../../core/models/loan.model';

@Component({
  selector: 'app-solution-list',
  templateUrl: './solution-list.component.html',
  styleUrls: ['./solution-list.component.scss']
})
export class SolutionListComponent {
  @Input() result!: LoanSolverResult;

  get hasValidSolutions(): boolean {
    return this.result.hasAnyValidSolution;
  }

  get exactMatch(): LoanSolution | null {
    return this.result.exactMatch;
  }

  get keepAmountSolutions(): LoanSolution[] {
    return this.result.keepAmountSolutions;
  }

  get keepTermSolutions(): LoanSolution[] {
    return this.result.keepTermSolutions;
  }

  get bestEffort(): LoanSolution | null {
    return this.result.bestEffort;
  }
}
