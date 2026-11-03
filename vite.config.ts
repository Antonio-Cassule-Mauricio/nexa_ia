import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * CONFIGURAÇÃO DO VITE — MAURÍCIUS TECH & NEXA ASSISTANT
 * 
 * Configurações principais:
 * - Plugins: Suporte a React (JSX/TSX) e Tailwind CSS v4.
 * - Servidor: Escuta em 0.0.0.0 na porta 3000.
 * - HMR desativado (hmr: false): Evita erros de reconexão de WebSocket
 *   em ambientes de execução em nuvem/sandboxes e proxies reversos.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: false, // Desativa WebSocket do HMR para eliminar erros de conexão fechada
  },
});
