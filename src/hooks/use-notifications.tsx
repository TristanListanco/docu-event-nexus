
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "./use-toast";

export interface Notification {
  id: string;
  user_id: string;
  event_id: string;
  staff_id: string;
  type: 'confirmation' | 'decline';
  staff_name: string;
  event_name: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (error: any) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const clearNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (error) throw error;

      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error("Error clearing notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
    } catch (error: any) {
      console.error("Error clearing all notifications:", error);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();

      // Set up real-time subscription
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            console.log('New notification received:', newNotification);
            
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show browser notification
            if (Notification.permission === 'granted') {
              new Notification(`Staff ${newNotification.type}`, {
                body: newNotification.message,
                icon: '/favicon.ico'
              });
            }
            
            // Show toast
            toast({
              title: `Staff ${newNotification.type}`,
              description: newNotification.message,
            });
          }
        )
        .subscribe();

      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
  };
}
