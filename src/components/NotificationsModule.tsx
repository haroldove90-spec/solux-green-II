import React, { useState } from 'react';
import { Bell, Check, Trash2, Calendar, MessageSquare, AlertCircle, Shield, CheckCheck } from 'lucide-react';
import { AppNotification } from '../types';
import { playNotificationSound } from './NotificationsBell';

interface NotificationsModuleProps {
  notifications: AppNotification[];
  role: 'admin' | 'comercial' | 'enlace' | 'partner' | 'client' | 'all';
  currentUser: any;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
}

export default function NotificationsModule({
  notifications,
  role,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAllNotifications,
  onDeleteNotification
}: NotificationsModuleProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread'>('all');

  // Filter relevant notifications
  const relevantNotifications = notifications.filter(n => {
    if (n.role === 'all') return true;
    if (n.userId && currentUser && n.userId === currentUser.id) return true;
    
    const normalizedRole = role === 'partner' ? 'partner' : role;
    const nRole = n.role === 'partner' ? 'partner' : n.role;
    
    return nRole === normalizedRole;
  });

  // Filter based on read status
  const displayedNotifications = relevantNotifications.filter(n => {
    if (statusFilter === 'unread') return !n.isRead;
    return true;
  });

  const unreadCount = relevantNotifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 animate-fadeIn" id="notifications-full-module">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600 animate-pulse" />
            <span>Centro de Notificaciones y Avisos</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Historial completo de alertas del sistema, altas de clientes, estados de obra y recordatorios
          </p>
        </div>

        {/* Quick Bulk Actions */}
        {relevantNotifications.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  onMarkAllAsRead();
                  playNotificationSound();
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
                id="bulk-mark-read"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Marcar Todo Leído
              </button>
            )}

            {onClearAllNotifications && (
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas vaciar tu historial de notificaciones?')) {
                    onClearAllNotifications();
                  }
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-rose-100"
                id="bulk-clear-notifications"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpiar Todo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Status / Role Card */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Tu Perfil Activo</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="p-1 bg-slate-900 text-white rounded-lg">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black uppercase text-slate-800">{role === 'partner' ? 'Socio Partner' : role}</span>
              </div>
            </div>

            {/* Quick status counters */}
            <div className="space-y-2">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Filtros</span>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-left transition-all cursor-pointer flex justify-between items-center ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Ver Todas</span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] ${statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {relevantNotifications.length}
                  </span>
                </button>

                <button
                  onClick={() => setStatusFilter('unread')}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-left transition-all cursor-pointer flex justify-between items-center ${
                    statusFilter === 'unread'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Pendientes / No Leídas</span>
                  {unreadCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${statusFilter === 'unread' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'}`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive List */}
        <div className="lg:col-span-3 space-y-4">
          {displayedNotifications.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-wide">No se encontraron notificaciones</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                {statusFilter === 'unread' ? 'No tienes alertas pendientes sin leer.' : 'Aún no se ha registrado ninguna alerta en tu cuenta.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3" id="notifications-list-container">
              {displayedNotifications.map((n, idx) => (
                <div
                  key={`notif_${n.id || 'n'}_${idx}`}
                  className={`bg-white border rounded-2xl p-4 transition-all shadow-xs relative flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                    !n.isRead ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  {!n.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl"></div>
                  )}

                  {/* Body Details */}
                  <div className="flex gap-3.5 items-start">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      !n.isRead ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-450'
                    }`}>
                      <MessageSquare className="w-4 h-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-900">
                          {n.title}
                        </h4>
                        {!n.isRead && (
                          <span className="text-[8px] bg-rose-500 text-white font-black uppercase px-2 py-0.5 rounded-full tracking-wider shrink-0">
                            Nuevo
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
                          <Calendar className="w-3.5 h-3.5" /> {n.createdDate}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-600 leading-relaxed max-w-2xl">
                        {n.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions Block */}
                  <div className="flex items-center gap-2 sm:self-center self-end pl-12 sm:pl-0">
                    {!n.isRead && (
                      <button
                        onClick={() => onMarkAsRead(n.id)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-50 border rounded-lg transition-all cursor-pointer"
                        title="Marcar como leída"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {onDeleteNotification && (
                      <button
                        onClick={() => onDeleteNotification(n.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 border rounded-lg transition-all cursor-pointer"
                        title="Eliminar notificación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
