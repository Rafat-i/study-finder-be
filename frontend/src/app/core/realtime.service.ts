import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket: Socket | null = null;

  connect(userId: string, onRequestReceived: () => void, onRequestAccepted: () => void): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.apiUrl, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.socket?.emit('join:room', { userId });
    });

    this.socket.on('request:received', onRequestReceived);
    this.socket.on('request:accepted', onRequestAccepted);
  }

  disconnect(): void {
    this.socket?.off('request:received');
    this.socket?.off('request:accepted');
    this.socket?.disconnect();
  }
}