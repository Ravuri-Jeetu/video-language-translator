import { ChangeDetectionStrategy, Component, effect, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SUPPORTED_LANGUAGES } from '../../models/language.model';

@Component({
  selector: 'app-language-step',
  templateUrl: './language-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class LanguageStepComponent implements OnInit {
  videoFile = input.required<File>();
  languageSelected = output<{ source: string; target: string }>();

  sourceLanguage = signal<string>('');
  targetLanguage = signal<string>('');
  isLoading = signal(true);
  languages = SUPPORTED_LANGUAGES;
  
  constructor() {}

  ngOnInit(): void {
    // Frontend no longer detects language; backend translates with source='auto'.
    this.sourceLanguage.set('auto');
    this.isLoading.set(false);
  }

  onTargetLanguageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.targetLanguage.set(select.value);
  }

  proceed(): void {
    if (this.sourceLanguage() && this.targetLanguage()) {
      this.languageSelected.emit({
        source: this.sourceLanguage(),
        target: this.targetLanguage(),
      });
    }
  }
}
