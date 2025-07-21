import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadMessages: {},
  typingUsers: [],
  typingTimeouts: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // ADD THIS NEW METHOD FOR NOTIFICATION SOUND
  playNotificationSound: () => {
    try {
      const audio = new Audio("notify.wav");
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Sound failed:", e));
    } catch (error) {
      console.log("Audio creation failed:", error);
    }
  },

  // Updated method to handle all incoming messages
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Listen for all new messages (not just from selected user)
    socket.on("newMessage", (newMessage) => {
      console.log("Received new message:", newMessage); // Debug log
      
      const { selectedUser } = get();
      const currentUserId = useAuthStore.getState().authUser?._id;
      
      // Don't process messages sent by current user
      if (newMessage.senderId === currentUserId) return;
      
      // If message is from selected user, add to messages
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set({ messages: [...get().messages, newMessage] });
      } else {
        // If message is from other users, increment unread count AND PLAY SOUND
        get().incrementUnreadCount(newMessage.senderId);
        get().playNotificationSound(); // ADD THIS LINE
      }
    });

    socket.on("userTyping", ({ userId, isTyping }) => {
      get().handleTyping(userId, isTyping);
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("userTyping");
    }
  },

  // Updated setSelectedUser to clear unread count
  setSelectedUser: (selectedUser) => {
    const { clearUnreadCount } = get();
    set({ selectedUser });
    if (selectedUser) {
      clearUnreadCount(selectedUser._id);
    }
  },

  addTypingUser: (userId) => {
    set((state) => {
      if (!state.typingUsers.includes(userId)) {
        return { typingUsers: [...state.typingUsers, userId] };
      }
      return state;
    });
  },

  removeTypingUser: (userId) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter((id) => id !== userId),
    }));
  },

  handleTyping: (userId, isTyping) => {
    const { typingTimeouts } = get();

    if (isTyping) {
      get().addTypingUser(userId);

      if (typingTimeouts[userId]) {
        clearTimeout(typingTimeouts[userId]);
      }

      const timeoutId = setTimeout(() => {
        get().removeTypingUser(userId);
        set((state) => {
          const newTimeouts = { ...state.typingTimeouts };
          delete newTimeouts[userId];
          return { typingTimeouts: newTimeouts };
        });
      }, 2500);

      set((state) => ({
        typingTimeouts: { ...state.typingTimeouts, [userId]: timeoutId },
      }));
    } else {
      get().removeTypingUser(userId);
      if (typingTimeouts[userId]) {
        clearTimeout(typingTimeouts[userId]);
        set((state) => {
          const newTimeouts = { ...state.typingTimeouts };
          delete newTimeouts[userId];
          return { typingTimeouts: newTimeouts };
        });
      }
    }
  },

  // Method to increment unread count
  incrementUnreadCount: (userId) => {

    set((state) => {
      const newCount = (state.unreadMessages[userId] || 0) + 1;
      return {
        unreadMessages: {
          ...state.unreadMessages,
          [userId]: newCount,
        },
      };
    });
  },

  // Method to clear unread count when user is selected
  clearUnreadCount: (userId) => {
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [userId]: 0,
      },
    }));
  },

  // Method to reset all unread counts
  resetUnreadCounts: () => {
    set({ unreadMessages: {} });
  },

  testUnreadMessages: () => {
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        'test-user-1': 5,
        'test-user-2': 12,
        'test-user-3': 150,
      },
    }));
  },

  sendTypingStatus: (receiverId, isTyping) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("typing", {
        receiverId,
        isTyping,
      });
    }
  },
}));