import { Conversation, Task, WhatsAppContact, WhatsAppMessage, AppSettings } from '../types';

export const INITIAL_SYSTEM_PROMPT = `O teu nome é NEXA.
És o assistente pessoal de elite da Maurícius, fundada por António Cassule Maurício.
És inteligente, profissional, prestável e eficiente.
Falas português de forma natural, moderna e estruturada.
Ajudas o utilizador a:
- Organizar tarefas e rotinas executivas.
- Analisar dados e documentos com rigor.
- Resumir conversas e decisões estratégicas.
- Preparar mensagens e integrar com o canal WhatsApp.
- Resolver problemas complexos de negócios e tecnologia.

Mantém sempre o contexto da conversa.`;

export const INITIAL_CONVERSATION: Conversation = {
  id: 'conv-1',
  title: 'Alinhamento Estratégico NEXA',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  systemPrompt: INITIAL_SYSTEM_PROMPT,
  messages: [
    {
      id: 'msg-sys-1',
      role: 'assistant',
      content: `Olá! Sou o **NEXA**, o assistente pessoal de elite da **Maurícius**, fundada por **António Cassule Maurício**.

Estou conectado através do motor **Qwen 3.8 Max** e pronto para apoiar as tuas operações:
- 📋 **Organização Executiva:** Estruturação de tarefas e prioridades diárias.
- 📊 **Análise Estratégica:** Análise de dados, relatórios e documentos.
- 📝 **Síntese de Decisões:** Resumos de reuniões e conclusões operacionais.
- 📱 **Canal WhatsApp:** Automações e preparação de comunicados.

Como posso alavancar as tuas metas hoje?`,
      timestamp: new Date().toISOString(),
      reactions: ['🚀', '⚡']
    }
  ]
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Validar integração da API Qwen (qwen3.8-max)',
    description: 'Confirmar chamadas de chat e contingência com o motor executivo da Maurícius',
    priority: 'alta',
    status: 'em_curso',
    dueDate: 'Hoje',
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    title: 'Sincronizar base de dados Supabase PostgreSQL',
    description: 'Ativar tabelas conversations e messages com Row Level Security (RLS)',
    priority: 'alta',
    status: 'pendente',
    dueDate: 'Hoje',
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-3',
    title: 'Testar módulo WhatsApp Bridge',
    description: 'Simular leitura de mensagens e extração automática de tarefas para a equipa',
    priority: 'media',
    status: 'pendente',
    dueDate: 'Amanhã',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_WHATSAPP_CONTACTS: WhatsAppContact[] = [
  {
    id: 'wa-1',
    name: 'Maurícius Core Team 🚀',
    phone: '+244 923 001 234',
    unreadCount: 2,
    lastMessage: 'António, a versão web do NEXA já está pronta para demonstração.',
    lastMessageTime: '10:45',
    isGroup: true
  },
  {
    id: 'wa-2',
    name: 'Cliente Corporativo (Luanda)',
    phone: '+244 912 345 678',
    unreadCount: 1,
    lastMessage: 'Gostaríamos de agendar a apresentação da automação de IA.',
    lastMessageTime: '09:20',
    isGroup: false
  },
  {
    id: 'wa-3',
    name: 'Parceiro Tecnológico',
    phone: '+351 912 987 654',
    unreadCount: 0,
    lastMessage: 'Infraestrutura de nuvem pronta e escalável.',
    lastMessageTime: 'Ontem',
    isGroup: false
  }
];

export const INITIAL_WHATSAPP_MESSAGES: Record<string, WhatsAppMessage[]> = {
  'wa-1': [
    {
      id: 'wam-1',
      contactId: 'wa-1',
      sender: 'contact',
      text: 'Bom dia equipa Maurícius! O motor Qwen 3.8 Max já está integrado com sucesso.',
      timestamp: '09:30'
    },
    {
      id: 'wam-2',
      contactId: 'wa-1',
      sender: 'user',
      text: 'Excelente! Vamos validar a sincronização com o Supabase e os fluxos de tarefas.',
      timestamp: '10:00'
    },
    {
      id: 'wam-3',
      contactId: 'wa-1',
      sender: 'contact',
      text: 'António, a versão web do NEXA já está pronta para demonstração.',
      timestamp: '10:45',
      reaction: '🔥'
    }
  ],
  'wa-2': [
    {
      id: 'wam-4',
      contactId: 'wa-2',
      sender: 'contact',
      text: 'Bom dia António! Analisámos a proposta de valor da Maurícius.',
      timestamp: '09:15'
    },
    {
      id: 'wam-5',
      contactId: 'wa-2',
      sender: 'contact',
      text: 'Gostaríamos de agendar a apresentação da automação de IA.',
      timestamp: '09:20'
    }
  ],
  'wa-3': [
    {
      id: 'wam-6',
      contactId: 'wa-3',
      sender: 'contact',
      text: 'Infraestrutura de nuvem pronta e escalável.',
      timestamp: 'Ontem, 18:00',
      reaction: '✅'
    }
  ]
};

export const INITIAL_SETTINGS: AppSettings = {
  modelName: 'qwen3.8-max',
  temperature: 0.7,
  maxTokens: 1500,
  systemPrompt: INITIAL_SYSTEM_PROMPT,
  tone: 'profissional',
  userName: 'António Cassule Maurício',
  theme: 'dark'
};
