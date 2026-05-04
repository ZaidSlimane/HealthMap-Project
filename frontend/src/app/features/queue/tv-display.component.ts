import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface QueueItem { number: number; service: string; serviceAr: string; boxNumber: number; }

@Component({
  selector: 'app-tv-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tv-display.component.html',
  styleUrl: './tv-display.component.scss'
})
export class TvDisplayComponent implements OnInit, OnDestroy {
  currentQueue: QueueItem[] = [
    { number: 52, service: 'Bureau de Consultation 1', serviceAr: 'مكتب الفحص 1', boxNumber: 1 },
    { number: 45, service: 'Radiologie', serviceAr: 'الإشعة', boxNumber: 2 },
    { number: 41, service: 'Bureau de Consultation 2', serviceAr: 'مكتب الفحص 2', boxNumber: 3 },
  ];

  recentCalled: QueueItem[] = [
    { number: 50, service: 'Bureau de Consultation 1', serviceAr: 'مكتب الفحص 1', boxNumber: 1 },
    { number: 49, service: 'Radiologie', serviceAr: 'الإشعة', boxNumber: 2 },
    { number: 48, service: 'Bureau de Consultation 2', serviceAr: 'مكتب الفحص 2', boxNumber: 3 },
    { number: 47, service: 'Bureau de Consultation 1', serviceAr: 'مكتب الفحص 1', boxNumber: 1 },
    { number: 46, service: 'Radiologie', serviceAr: 'الإشعة', boxNumber: 2 },
  ];

  currentTime = '';
  currentDate = '';
  private timer: ReturnType<typeof setInterval> | null = null;
  currentLang: 'fr' | 'ar' = 'fr';

  ngOnInit() {
    this.updateTime();
    this.timer = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('fr-FR');
    this.currentDate = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}
