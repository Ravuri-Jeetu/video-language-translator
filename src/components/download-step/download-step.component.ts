import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-download-step',
  templateUrl: './download-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class DownloadStepComponent {
  videoUrl = input.required<string>();
  fileName = input.required<string>();
  restart = output<void>();

  onRestart(): void {
    this.restart.emit();
  }
}
