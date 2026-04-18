export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  _id: string;
  name: string;
  email: string;
}

export interface StudySession {
  _id: string;
  title: string;
  subject: string;
  date: string;
  location: string;
  spotsAvailable: number;
  createdBy: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface JoinRequest {
  _id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  sessionId: StudySession;
  userId: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}