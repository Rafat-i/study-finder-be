import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../core/auth.service';
import { SessionService } from '../../core/session.service';
import { JoinRequestService } from '../../core/join-request.service';
import { RealtimeService } from '../../core/realtime.service';
import { StudySession, JoinRequest } from '../../core/models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly joinRequestService = inject(JoinRequestService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly currentUser = computed(() => this.authService.currentUser());
  readonly sessions = signal<StudySession[]>([]);
  readonly incomingRequests = signal<JoinRequest[]>([]);
  readonly sentRequests = signal<JoinRequest[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly editingSessionId = signal<string | null>(null);
  readonly pageError = signal('');
  readonly notification = signal('');
  readonly selectedRadius = signal<number | null>(null);
  readonly today = new Date().toISOString().slice(0, 16);

  isSessionPast(session: StudySession): boolean {
    return new Date(session.date) < new Date();
  }

  readonly sessionForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    subject: ['', [Validators.required]],
    date: ['', [Validators.required]],
    location: ['', [Validators.required]],
    spotsAvailable: [1, [Validators.required, Validators.min(1)]],
  });

  readonly requestForm = this.fb.nonNullable.group({
    sessionId: ['', [Validators.required]],
    message: [''],
  });

  constructor() {
    const user = this.currentUser();
    if (user) {
      this.realtimeService.connect(
        user.id,
        () => {
          this.showNotification('Someone wants to join your session!');
          this.loadIncomingRequests();
        },
        () => {
          this.showNotification('Your join request was accepted!');
          this.loadSentRequests();
        },
        () => {
          this.showNotification('Your join request was declined.');
          this.loadSentRequests();
        },
        () => {
          this.loadSessions();
        },
        () => {
          this.loadSessions();
          this.loadSentRequests();
        },
        () => {
          this.loadSessions();
          this.loadIncomingRequests();
          this.loadSentRequests();
        },
        () => {
          this.loadIncomingRequests();
          this.loadSentRequests();
          this.loadSessions();
        }
      );
    }
    this.destroyRef.onDestroy(() => this.realtimeService.disconnect());
    this.loadDashboard();
  }

  get isEditing(): boolean {
    return Boolean(this.editingSessionId());
  }

  trackBySession(_: number, session: StudySession): string {
    return session._id;
  }

  getRequestStatus(session: StudySession): string | null {
    const request = this.sentRequests().find(
      (r) => r.sessionId._id === session._id
    );
    return request ? request.status : null;
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.authService.fetchMe().subscribe({
      next: () => {
        this.loadSessions();
        this.loadIncomingRequests();
        this.loadSentRequests();
      },
      error: () => {
        this.loadSessions();
        this.loadIncomingRequests();
        this.loadSentRequests();
      }
    });
  }

  loadSessions(): void {
    const user = this.currentUser();
    const radius = this.selectedRadius();

    if (radius && user) {
      const loc = (user as any).lastLocation?.coordinates;
      if (loc) {
        this.sessionService.getSessions(loc[1], loc[0], radius).subscribe({
          next: (res) => {
            this.sessions.set(res.data.sessions);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.pageError.set(err.error?.message ?? 'Could not load sessions.');
            this.isLoading.set(false);
          },
        });
        return;
      }
    }

    this.sessionService.getSessions().subscribe({
      next: (res) => {
        this.sessions.set(res.data.sessions);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.pageError.set(err.error?.message ?? 'Could not load sessions.');
        this.isLoading.set(false);
      },
    });
  }

  loadIncomingRequests(): void {
    this.joinRequestService.getMyRequests().subscribe({
      next: (res) => this.incomingRequests.set(res.data.joinRequests),
    });
  }

  loadSentRequests(): void {
    this.joinRequestService.getSentRequests().subscribe({
      next: (res) => this.sentRequests.set(res.data.joinRequests),
    });
  }

  onRadiusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedRadius.set(value === 'any' ? null : Number(value));
    this.loadSessions();
  }

  submitSession(): void {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const value = this.sessionForm.getRawValue();

    const user = this.currentUser();
    const loc = (user as any)?.lastLocation?.coordinates;
    const payload = loc
      ? { ...value, longitude: loc[0], latitude: loc[1] }
      : value;

    const request$ = this.editingSessionId()
      ? this.sessionService.updateSession(this.editingSessionId()!, payload)
      : this.sessionService.createSession(payload);

    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.resetSessionForm();
        this.loadSessions();
      },
      error: (err) => {
        this.pageError.set(err.error?.message ?? 'Could not save session.');
        setTimeout(() => this.pageError.set(''), 3000);
      },
    });
  }

  editSession(session: StudySession): void {
    this.editingSessionId.set(session._id);
    this.sessionForm.patchValue({
      title: session.title,
      subject: session.subject,
      date: session.date.slice(0, 16),
      location: session.location,
      spotsAvailable: session.spotsAvailable,
    });
  }

  deleteSession(session: StudySession): void {
    this.sessionService.deleteSession(session._id).subscribe({
      next: () => {
        if (this.editingSessionId() === session._id) this.resetSessionForm();
        this.loadSessions();
      },
      error: (err) => {
        this.pageError.set(err.error?.message ?? 'Could not delete session.');
        setTimeout(() => this.pageError.set(''), 3000);
      },
    });
  }

  submitJoinRequest(): void {
    if (this.requestForm.controls.sessionId.invalid) {
      this.requestForm.controls.sessionId.markAsTouched();
      return;
    }
    this.isSaving.set(true);
    const value = this.requestForm.getRawValue();
    this.joinRequestService
      .createJoinRequest({ sessionId: value.sessionId, message: value.message })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.requestForm.reset({ sessionId: '', message: '' });
          this.showNotification('Join request sent!');
          this.loadSentRequests();
        },
        error: (err) => {
          this.pageError.set(err.error?.message ?? 'Could not send request.');
          setTimeout(() => this.pageError.set(''), 3000);
        },
      });
  }

  respondToRequest(request: JoinRequest, status: 'accepted' | 'declined'): void {
    this.joinRequestService.updateJoinRequest(request._id, { status }).subscribe({
      next: () => this.loadIncomingRequests(),
      error: (err) => {
        this.pageError.set(err.error?.message ?? 'Could not update request.');
        setTimeout(() => this.pageError.set(''), 3000);
      },
    });
  }

  cancelRequest(request: JoinRequest): void {
    this.joinRequestService.deleteJoinRequest(request._id).subscribe({
      next: () => this.loadSentRequests(),
      error: (err) => {
        this.pageError.set(err.error?.message ?? 'Could not cancel request.');
        setTimeout(() => this.pageError.set(''), 3000);
      },
    });
  }

  deleteRequest(request: JoinRequest): void {
    this.joinRequestService.deleteJoinRequest(request._id).subscribe({
      next: () => this.loadIncomingRequests(),
      error: (err) => {
        this.pageError.set(err.error?.message ?? 'Could not delete request.');
        setTimeout(() => this.pageError.set(''), 3000);
      },
    });
  }

  isOwner(session: StudySession): boolean {
    const user = this.currentUser();
    if (!user) return false;
    const userId = (user as any)._id ?? user.id;
    return String(session.createdBy._id) === String(userId);
  }

  mySessions(): StudySession[] {
    return this.sessions().filter((s) => this.isOwner(s));
  }

  otherSessions(): StudySession[] {
    return this.sessions().filter((s) => !this.isOwner(s));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  resetSessionForm(): void {
    this.editingSessionId.set(null);
    this.sessionForm.reset({ title: '', subject: '', date: '', location: '', spotsAvailable: 1 });
  }

  private showNotification(msg: string): void {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 4000);
  }
}