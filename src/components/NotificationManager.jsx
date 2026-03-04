// Gerenciador de notificações push do navegador
export const NotificationManager = {
  // Registrar service worker e pedir permissão
  async init() {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      try {
        // Registrar service worker
        const registration = await navigator.serviceWorker.register('/sw.js').catch(() => {
          // Se falhar, tenta registrar com caminho relativo
          console.log('Service worker registration falhou com /sw.js');
          return null;
        });

        return registration;
      } catch (error) {
        console.log('Service Worker não disponível:', error.message);
      }
    }
    return null;
  },

  // Pedir permissão ao usuário
  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  // Verificar se notificações estão ativadas
  isEnabled() {
    return 'Notification' in window && Notification.permission === 'granted';
  },

  // Enviar notificação
  async send(title, options = {}) {
    if (!this.isEnabled()) return;

    const defaultOptions = {
      icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/63462b910_logopng.png',
      badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/63462b910_logopng.png',
      ...options
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, defaultOptions);
          return;
        }
      } catch (error) {
        console.log('Erro ao usar service worker para notificação:', error);
      }
    }
    
    // Fallback para Notification API simples (funciona no desktop, mas pode falhar no Android)
    try {
      new Notification(title, defaultOptions);
    } catch (error) {
      console.log('Erro ao enviar notificação fallback:', error);
    }
  }
};