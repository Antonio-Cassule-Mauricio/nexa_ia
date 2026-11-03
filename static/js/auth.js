/**
 * MAURÍCIUS TECH & NEXA - AUTENTICAÇÃO COM SUPABASE
 * Project ID: qcerpfbyrifbfqnphxdl
 */

let supabaseClient = null;
let currentUser = null;

if (window.supabase) {
    const supabaseUrl = window.SUPABASE_URL || "https://qcerpfbyrifbfqnphxdl.supabase.co";
    const supabaseKey = window.SUPABASE_ANON_KEY || "sb_publishable_uRu9qHTmqgXXArJhVBu0xg_icYVr-K4";
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}

document.addEventListener('DOMContentLoaded', async () => {
    const authModal = document.getElementById('authModal');
    const btnAuthModal = document.getElementById('btnAuthModal');
    const btnCloseAuth = document.getElementById('btnCloseAuth');
    const authForm = document.getElementById('authForm');
    const authToggleLink = document.getElementById('authToggleLink');
    const authModalTitle = document.getElementById('authModalTitle');
    const btnSubmitAuth = document.getElementById('btnSubmitAuth');
    const authFeedback = document.getElementById('authFeedback');
    
    let isSignUpMode = false;

    // Verificar sessão atual
    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            updateUserUI(session.user);
        }

        supabaseClient.auth.onAuthStateChange((_event, session) => {
            if (session && session.user) {
                updateUserUI(session.user);
            } else {
                updateUserUI(null);
            }
        });
    }

    function updateUserUI(user) {
        currentUser = user;
        const userNameDisplay = document.getElementById('userNameDisplay');
        const userEmailDisplay = document.getElementById('userEmailDisplay');
        const userAvatar = document.getElementById('userAvatar');

        if (user) {
            const displayName = user.email.split('@')[0];
            userNameDisplay.textContent = displayName;
            userEmailDisplay.textContent = user.email;
            userAvatar.textContent = displayName[0].toUpperCase();
            userAvatar.style.background = '#2563eb';
            userAvatar.style.color = '#fff';
            btnAuthModal.textContent = 'Sair';
        } else {
            userNameDisplay.textContent = 'Convidado';
            userEmailDisplay.textContent = 'Modo visitante';
            userAvatar.textContent = '👤';
            userAvatar.style.background = '#1e293b';
            userAvatar.style.color = '#94a3b8';
            btnAuthModal.textContent = 'Entrar';
        }
    }

    // Modal triggers
    if (btnAuthModal) {
        btnAuthModal.addEventListener('click', async () => {
            if (currentUser && supabaseClient) {
                await supabaseClient.auth.signOut();
                updateUserUI(null);
            } else {
                authModal.style.display = 'flex';
            }
        });
    }

    if (btnCloseAuth) {
        btnCloseAuth.addEventListener('click', () => {
            authModal.style.display = 'none';
        });
    }

    if (authToggleLink) {
        authToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            isSignUpMode = !isSignUpMode;
            if (isSignUpMode) {
                authModalTitle.textContent = 'Criar Conta na Maurícius';
                btnSubmitAuth.textContent = 'Registar Conta';
                document.getElementById('authToggleText').textContent = 'Já possui uma conta?';
                authToggleLink.textContent = 'Fazer Login';
            } else {
                authModalTitle.textContent = 'Entrar na Maurícius';
                btnSubmitAuth.textContent = 'Entrar';
                document.getElementById('authToggleText').textContent = 'Ainda não tem conta?';
                authToggleLink.textContent = 'Criar Conta';
            }
        });
    }

    // Submissão do formulário
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;

            authFeedback.style.display = 'block';
            authFeedback.style.color = '#00f0ff';
            authFeedback.textContent = 'A processar...';

            if (!supabaseClient) {
                authFeedback.style.color = '#f87171';
                authFeedback.textContent = 'Cliente Supabase não inicializado.';
                return;
            }

            try {
                if (isSignUpMode) {
                    const { data, error } = await supabaseClient.auth.signUp({
                        email,
                        password
                    });
                    if (error) throw error;
                    authFeedback.style.color = '#34d399';
                    authFeedback.textContent = 'Conta criada com sucesso! Verifique o seu e-mail ou inicie sessão.';
                } else {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({
                        email,
                        password
                    });
                    if (error) throw error;
                    authFeedback.style.color = '#34d399';
                    authFeedback.textContent = 'Sessão iniciada com sucesso!';
                    setTimeout(() => {
                        authModal.style.display = 'none';
                    }, 800);
                }
            } catch (err) {
                authFeedback.style.color = '#f87171';
                authFeedback.textContent = err.message || 'Erro na autenticação.';
            }
        });
    }
});
