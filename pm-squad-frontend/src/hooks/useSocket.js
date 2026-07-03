import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';
import { useUiStore } from '../store/uiStore';

// Backend origin = API URL without the trailing "/api".
const SOCKET_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

/**
 * Establish a Socket.io connection for the logged-in user and wire backend
 * events into the relevant Zustand stores. Disconnects on unmount.
 */
export function useSocket() {
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?._id) return undefined;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', user._id);
    });

    const taskStore = useTaskStore.getState;
    const uiStore = useUiStore.getState;

    socket.on('task:created', (task) => taskStore().addTaskLocal(task));
    socket.on('task:updated', (task) => taskStore().updateTaskLocal(task));
    socket.on('task:deleted', ({ taskId }) =>
      taskStore().removeTaskLocal(taskId)
    );

    socket.on('reminder:fire', (reminder) => {
      uiStore().addNotification({
        type: 'reminder',
        message: reminder.title,
      });
      toast(`⏰ ${reminder.title}`);
    });

    socket.on('mention:received', (payload) => {
      const message = `${payload.from} mentioned you on "${payload.taskTitle}"`;
      uiStore().addNotification({ type: 'mention', message });
      toast(`💬 ${message}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id]);

  return socketRef;
}

export default useSocket;
