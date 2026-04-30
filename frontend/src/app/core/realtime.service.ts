import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket: Socket | null = null;

  connect(
    userId: string,
    onRequestReceived: () => void,
    onRequestAccepted: () => void,
    onSessionCreated: () => void,
    onSessionUpdated: () => void,
    onSessionDeleted: () => void,
    onRequestDeleted: () => void
  ): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.apiUrl, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.socket?.emit('join:room', { userId });
    });

    this.socket.on('request:received', onRequestReceived);
    this.socket.on('request:accepted', onRequestAccepted);
    this.socket.on('session:created', onSessionCreated);
    this.socket.on('session:updated', onSessionUpdated);
    this.socket.on('session:deleted', onSessionDeleted);
    this.socket.on('request:deleted', onRequestDeleted);
  }

  disconnect(): void {
    this.socket?.off('request:received');
    this.socket?.off('request:accepted');
    this.socket?.off('session:created');
    this.socket?.off('session:updated');
    this.socket?.off('session:deleted');
    this.socket?.off('request:deleted');
    this.socket?.disconnect();
  }
}