/**
 * MAURÍCIUS TECH & NEXA - INTERFACE DE CHAT ASSÍNCRONO
 * Integração: FastAPI /api/chat + Supabase
 */

document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const messagesFeed = document.getElementById('messagesFeed');
    const typingIndicator = document.getElementById('typingIndicator');
    const btnNewChat = document.getElementById('btnNewChat');
    const currentChatTitle = document.getElementById('currentChatTitle');
    const conversationsList = document.getElementById('conversationsList');
    const btnWhatsAppConnect = document.getElementById('btnWhatsAppConnect');
    const promptChips = document.querySelectorAll('.prompt-chip');

    let currentSessionMessages = [];
    let currentConversationId = 'conv-' + Date.now();
    let conversationHistory = [
        { id: currentConversationId, title: 'Nova Sessão NEXA' }
    ];

    renderConversations();

    // Enviar mensagem
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            // Adicionar mensagem do utilizador
            appendMessage('user', text);
            currentSessionMessages.push({ role: 'user', content: text });
            chatInput.value = '';

            // Atualizar título da conversa se for a primeira mensagem
            if (currentSessionMessages.length === 1) {
                const newTitle = text.slice(0, 24) + (text.length > 24 ? '...' : '');
                currentChatTitle.textContent = newTitle;
                const activeConv = conversationHistory.find(c => c.id === currentConversationId);
                if (activeConv) activeConv.title = newTitle;
                renderConversations();
            }

            // Exibir indicador de digitação
            typingIndicator.style.display = 'block';
            messagesFeed.scrollTop = messagesFeed.scrollHeight;

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: currentSessionMessages,
                        conversation_id: currentConversationId
                    })
                });

                if (!response.ok) {
                    throw new Error(`Erro do servidor: ${response.status}`);
                }

                const data = await response.json();
                typingIndicator.style.display = 'none';

                // Adicionar resposta do assistente
                appendMessage('assistant', data.reply);
                currentSessionMessages.push({ role: 'assistant', content: data.reply });

            } catch (err) {
                console.error('Falha ao comunicar com o servidor:', err);
                typingIndicator.style.display = 'none';
                appendMessage('assistant', '⚠️ Ocorreu uma oscilação na ligação. O assistente NEXA mantém o contexto pronto para uma nova tentativa.');
            }
        });
    }

    // Renderizar mensagem no feed
    function appendMessage(role, content) {
        const bubble = document.createElement('div');
        bubble.className = `msg-bubble ${role === 'user' ? 'msg-user' : 'msg-assistant'}`;
        
        if (role === 'assistant') {
            bubble.innerHTML = `<strong>NEXA Assistant:</strong><br>${formatMarkdown(content)}`;
        } else {
            bubble.textContent = content;
        }

        messagesFeed.appendChild(bubble);
        messagesFeed.scrollTop = messagesFeed.scrollHeight;
    }

    // Formatador simples de markdown
    function formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    // Nova Conversa
    if (btnNewChat) {
        btnNewChat.addEventListener('click', () => {
            currentConversationId = 'conv-' + Date.now();
            currentSessionMessages = [];
            conversationHistory.unshift({ id: currentConversationId, title: 'Conversa ' + (conversationHistory.length + 1) });
            currentChatTitle.textContent = 'Nova Conversa';
            messagesFeed.innerHTML = `
                <div class="msg-bubble msg-assistant">
                    <strong>NEXA Assistant • Maurícius</strong><br><br>
                    Nova sessão iniciada com o motor **Qwen 3.8 Max**. Em que posso apoiar as tuas tarefas e decisões estratégicas agora?
                </div>
            `;
            renderConversations();
        });
    }

    // Renderizar histórico lateral
    function renderConversations() {
        if (!conversationsList) return;
        conversationsList.innerHTML = '';
        conversationHistory.forEach(conv => {
            const item = document.createElement('div');
            item.style.padding = '8px 12px';
            item.style.borderRadius = '6px';
            item.style.fontSize = '12px';
            item.style.color = conv.id === currentConversationId ? '#fff' : '#94a3b8';
            item.style.background = conv.id === currentConversationId ? 'rgba(0, 240, 255, 0.1)' : 'transparent';
            item.style.border = conv.id === currentConversationId ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid transparent';
            item.style.cursor = 'pointer';
            item.style.whiteSpace = 'nowrap';
            item.style.overflow = 'hidden';
            item.style.textOverflow = 'ellipsis';
            item.textContent = '💬 ' + conv.title;

            item.addEventListener('click', () => {
                currentConversationId = conv.id;
                currentChatTitle.textContent = conv.title;
                renderConversations();
            });

            conversationsList.appendChild(item);
        });
    }

    // Chips de sugestão
    promptChips.forEach(chip => {
        chip.addEventListener('click', () => {
            chatInput.value = chip.textContent.trim().replace(/^[^\w\s]+/, '').trim();
            chatInput.focus();
        });
    });

    // Teaser do WhatsApp
    if (btnWhatsAppConnect) {
        btnWhatsAppConnect.addEventListener('click', () => {
            alert('📱 Módulo WhatsApp Maurícius: Conectado ao número executivo associado. O NEXA pode sincronizar resumos e preparar respostas automáticas.');
        });
    }
});
