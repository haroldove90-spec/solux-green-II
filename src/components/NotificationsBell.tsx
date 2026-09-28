import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { AppNotification } from '../types';

// =====================================================================
// UTILITIES: Audio, Browser Notifications and Permissions
// =====================================================================

export function playSynthesizedNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Play a gentle sweet double chime
    const playChime = (time: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    };
    
    const now = ctx.currentTime;
    // C6 (1046.50 Hz) then E6 (1318.51 Hz) then G6 (1567.98 Hz)
    playChime(now, 1046.50, 0.15);
    playChime(now + 0.08, 1318.51, 0.2);
    playChime(now + 0.16, 1567.98, 0.35);
  } catch (e) {
    console.warn('Could not play synthesized sound:', e);
  }
}

export function playNotificationSound() {
  try {
    const audio = new Audio('https://soluxgreen.com.mx/notificacion.mp3');
    audio.play().catch(e => {
      console.warn('Could not play notification MP3, falling back to synthesizer:', e);
      playSynthesizedNotificationSound();
    });
  } catch (err) {
    console.warn('Error playing audio object:', err);
    playSynthesizedNotificationSound();
  }
}

export function sendBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=192&auto=format&fit=crop&q=80',
      });
    } catch (e) {
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body,
            icon: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=192&auto=format&fit=crop&q=80',
          });
        });
      }
    }
  }
}

export function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      console.log('📢 Permiso de notificación del navegador:', permission);
    });
  }
}

// =====================================================================
// COMPONENT: NotificationsBell Dropdown
// =====================================================================

interface NotificationsBellProps {
  notifications: AppNotification[];
  role: 'admin' | 'comercial' | 'enlace' | 'partner' | 'client' | 'all';
  currentUser: any;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onViewAll: () => void;
}

export function NotificationsBell({
  notifications,
  role,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAll
}: NotificationsBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter notifications according to target role / user
  const relevantNotifications = notifications.filter(n => {
    // If targeted at all
    if (n.role === 'all') return true;
    // If targeted at the specific user
    if (n.userId && currentUser && n.userId === currentUser.id) return true;
    // Map tech vs partner dashboard roles
    const normalizedRole = role === 'partner' ? 'partner' : role;
    const nRole = n.role === 'partner' ? 'partner' : n.role;
    
    return nRole === normalizedRole;
  });

  const unreadCount = relevantNotifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request browser permission on mount if default
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      requestNotificationPermission();
    }
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="notifications-bell-wrapper">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-emerald-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-all cursor-pointer border border-slate-200 shadow-xs focus:outline-none"
        aria-label="Notificaciones"
        id="notifications-bell-trigger"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span 
            className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-black leading-none text-white bg-rose-600 rounded-full animate-bounce"
            id="notifications-unread-badge"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Bell Dropdown Popup */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all animate-fadeIn"
          id="notifications-dropdown-menu"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider">Centro de Avisos</span>
              {unreadCount > 0 && (
                <span className="text-[9px] bg-rose-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  {unreadCount} nuevos
                </span>
              )}
            </div>
            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                onClick={() => {
                  onMarkAllAsRead();
                  playNotificationSound();
                }}
                className="text-[9px] text-emerald-300 hover:text-emerald-100 font-extrabold uppercase flex items-center gap-1 cursor-pointer transition-all"
                title="Marcar todas como leídas"
              >
                <Check className="w-3.5 h-3.5" /> Leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {relevantNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-[10px] font-bold uppercase tracking-wider">No tienes notificaciones por ahora</p>
                <p className="text-[8px] text-slate-400 uppercase mt-0.5">Te avisaremos sobre cualquier novedad</p>
              </div>
            ) : (
              relevantNotifications.slice(0, 5).map((n, idx) => (
                <div
                  key={`notif_${n.id || 'n'}_${idx}`}
                  onClick={() => {
                    if (!n.isRead) onMarkAsRead(n.id);
                  }}
                  className={`p-3.5 text-left transition-all hover:bg-slate-50 cursor-pointer flex gap-3 items-start relative ${
                    !n.isRead ? 'bg-emerald-50/20' : ''
                  }`}
                >
                  {/* Status Indicator Bar */}
                  {!n.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-full"></div>
                  )}

                  {/* Icon */}
                  <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                    !n.isRead ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-450'
                  }`}>
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>

                  {/* Body */}
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`text-[10px] uppercase tracking-wide truncate font-black ${
                        !n.isRead ? 'text-slate-950' : 'text-slate-700'
                      }`}>
                        {n.title}
                      </h4>
                      <span className="text-[7px] text-slate-400 font-bold uppercase shrink-0 mt-0.5 inline-flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" /> {n.createdDate}
                      </span>
                    </div>
                    <p className={`text-[9px] font-bold leading-normal ${
                      !n.isRead ? 'text-slate-700' : 'text-slate-500'
                    }`}>
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer view all button */}
          <div className="bg-slate-50 border-t border-slate-100 p-2.5 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                onViewAll();
              }}
              className="w-full py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex justify-center items-center gap-1.5"
            >
              📊 Ver Todas mis Notificaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
