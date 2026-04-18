import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { ApiResponse, StudySession } from './models';

interface SessionPayload {
  title?: string;
  subject?: string;
  date?: string;
  location?: string;
  spotsAvailable?: number;
  latitude?: number;
  longitude?: number;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);

  getSessions(lat?: number, lng?: number, radius?: number) {
    let url = `${environment.apiUrl}/sessions`;
    if (lat && lng && radius) {
      url += `?lat=${lat}&lng=${lng}&radius=${radius}`;
    }
    return this.http.get<ApiResponse<{ sessions: StudySession[] }>>(url);
  }

  createSession(payload: SessionPayload) {
    return this.http.post<ApiResponse<{ session: StudySession }>>(`${environment.apiUrl}/sessions`, payload);
  }

  updateSession(sessionId: string, payload: SessionPayload) {
    return this.http.patch<ApiResponse<{ session: StudySession }>>(`${environment.apiUrl}/sessions/${sessionId}`, payload);
  }

  deleteSession(sessionId: string) {
    return this.http.delete<ApiResponse<{}>>(`${environment.apiUrl}/sessions/${sessionId}`);
  }
}