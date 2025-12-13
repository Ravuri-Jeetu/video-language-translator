import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-step',
  templateUrl: './upload-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class UploadStepComponent {
  fileUploaded = output<File>();
  selectedFile = signal<File | null>(null);
  isDragging = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type.startsWith('video/')) {
        this.selectedFile.set(file);
      } else {
        alert('Please select a valid video file.');
        this.selectedFile.set(null);
      }
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
       const file = event.dataTransfer.files[0];
       if (file.type.startsWith('video/')) {
        this.selectedFile.set(file);
       } else {
         alert('Please drop a valid video file.');
         this.selectedFile.set(null);
       }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  proceed(): void {
    const file = this.selectedFile();
    if (file) {
      this.fileUploaded.emit(file);
    }
  }
  
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
