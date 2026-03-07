/**
 * Serviço de notificações push e em tempo real para o chat
 * Gerencia Web Push API, Notification API e notificações visuais
 */

export const notificationService = {
  getPreferences() {
    try {
      const prefs = localStorage.getItem('chat_prefs');
      return prefs ? JSON.parse(prefs) : { push: true, sound: true };
    } catch {
      return { push: true, sound: true };
    }
  },

  setPreferences(prefs) {
    localStorage.setItem('chat_prefs', JSON.stringify(prefs));
  },

  // Registrar Service Worker para push notifications
  async registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      console.warn("Push notifications não suportadas neste navegador");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        "/notification-worker.js",
        { scope: "/" }
      );
      console.log("Service Worker registrado:", registration);
      return registration;
    } catch (error) {
      console.error("Erro ao registrar Service Worker:", error);
      return null;
    }
  },

  // Requisitar permissão de notificações
  async requestNotificationPermission() {
    if (!("Notification" in window)) {
      console.warn("Notificações não suportadas");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  },

  // Enviar notificação push quando app está em background
  async sendPushNotification(title, options = {}) {
    if (Notification.permission !== "granted") {
      return;
    }

    const prefs = this.getPreferences();
    if (!prefs.push) return;

    const registration = await navigator.serviceWorker.ready;
    if (registration.showNotification) {
      await registration.showNotification(title, {
        icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/63462b910_logopng.png",
        badge: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/63462b910_logopng.png",
        tag: "chat-message", // Use a tag unificada para mensagens novas
        requireInteraction: false,
        ...options
      });
    }
  },

  // Notificação visual (toast-like) quando app está em foreground
  showVisualNotification(message, senderName) {
    const prefs = this.getPreferences();
    if (document.hidden) {
      // App em background - enviar push
      if (prefs.push) {
        this.sendPushNotification(`Nova mensagem de ${senderName}`, {
          body: message,
          tag: "chat-message"
        });
      }
    } else {
      // App em foreground - notificação visual discreta no chat
      if (prefs.sound) {
        this.playNotificationSound();
      }
    }
  },

  // Reproduzir som de notificação
  playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Tom de notificação agradável
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Fallback silencioso
      console.warn("Erro ao reproduzir som:", error);
    }
  },

  // Detectar se app está em background
  isAppInBackground() {
    return document.hidden;
  },

  // Setup listeners para detectar mudanças de visibilidade
  onVisibilityChange(callback) {
    document.addEventListener("visibilitychange", callback);
    return () => document.removeEventListener("visibilitychange", callback);
  }
};