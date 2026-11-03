export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  status?: 'sending' | 'delivered' | 'error';
  reactions?: string[];
  suggestedTasks?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  systemPrompt?: string;
  model?: string;
}

export type TaskPriority = 'alta' | 'media' | 'baixa';
export type TaskStatus = 'pendente' | 'em_curso' | 'concluida';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  conversationId?: string;
  completedAt?: string;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  isGroup?: boolean;
  tags?: string[];
  notes?: string;
  status?: 'online' | 'offline' | 'typing';
}

export interface WhatsAppMessage {
  id: string;
  contactId: string;
  sender: 'user' | 'contact';
  text: string;
  timestamp: string;
  reaction?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isAiGenerated?: boolean;
}

export interface WhatsAppConfig {
  connected: boolean;
  phoneNumber: string;
  instanceName: string;
  apiMode: 'cloud_api' | 'qr_bridge';
  metaPhoneNumberId?: string;
  metaBusinessAccountId?: string;
  metaAccessToken?: string;
  webhookVerifyToken?: string;
  autoReplyEnabled: boolean;
  autoReplyPrompt?: string;
  batteryLevel?: number;
  lastSync?: string;
  totalSent?: number;
  totalReceived?: number;
}

export interface AppSettings {
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tone: 'profissional' | 'direto' | 'detalhado';
  userName: string;
  theme: 'dark';
}
