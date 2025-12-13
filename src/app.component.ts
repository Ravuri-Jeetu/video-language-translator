import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadStepComponent } from './components/upload-step/upload-step.component';
import { LanguageStepComponent } from './components/language-step/language-step.component';
import { ProcessingStepComponent } from './components/processing-step/processing-step.component';
import { DownloadStepComponent } from './components/download-step/download-step.component';

export type AppStep = 'upload' | 'language' | 'processing' | 'download';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    UploadStepComponent,
    LanguageStepComponent,
    ProcessingStepComponent,
    DownloadStepComponent,
  ],
})
export class AppComponent {
  currentStep = signal<AppStep>('upload');
  videoFile = signal<File | null>(null);
  sourceLanguage = signal<string>('');
  targetLanguage = signal<string>('');
  translatedVideoUrl = signal<string>('');

  onFileUploaded(file: File): void {
    this.videoFile.set(file);
    this.currentStep.set('language');
  }

  onLanguageSelected(event: { source: string; target: string }): void {
    this.sourceLanguage.set(event.source);
    this.targetLanguage.set(event.target);
    this.currentStep.set('processing');
  }

  onProcessingComplete(videoUrl: string): void {
    this.translatedVideoUrl.set(videoUrl);
    this.currentStep.set('download');
  }

  onRestart(): void {
    this.videoFile.set(null);
    this.sourceLanguage.set('');
    this.targetLanguage.set('');
    this.translatedVideoUrl.set('');
    this.currentStep.set('upload');
  }
}
