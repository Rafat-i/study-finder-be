import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { ApiResponse, JoinRequest } from './models';

@Injectable({ providedIn: 'root' })
export class JoinRequestService {
  private readonly http = inject(HttpClient);

  getMyRequests() {
    return this.http.get<ApiResponse<{ joinRequests: JoinRequest[] }>>(`${environment.apiUrl}/join-requests`);
  }

  createJoinRequest(payload: { sessionId: string; message?: string }) {
    return this.http.post<ApiResponse<{ joinRequest: JoinRequest }>>(`${environment.apiUrl}/join-requests`, payload);
  }

  updateJoinRequest(requestId: string, payload: { status: 'accepted' | 'declined' }) {
    return this.http.patch<ApiResponse<{ joinRequest: JoinRequest }>>(`${environment.apiUrl}/join-requests/${requestId}`, payload);
  }

  deleteJoinRequest(requestId: string) {
    return this.http.delete<ApiResponse<{}>>(`${environment.apiUrl}/join-requests/${requestId}`);
  }
}