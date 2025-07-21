import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/sidebarSkeleton";
import { UsersRound } from "lucide-react";

const Sidebar = () => {
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading, 
    typingUsers,
    unreadMessages
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  // Function to get unread count for a specific user
  const getUnreadCount = (userId) => {
    return unreadMessages[userId] || 0;
  };

  // Function to format unread count (1-99+)
  const formatUnreadCount = (count) => {
    if (count === 0) return null;
    return count > 99 ? "99+" : count.toString();
  };



  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <UsersRound className="size-5" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        


        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
          const unreadCount = getUnreadCount(user._id);
          const formattedCount = formatUnreadCount(unreadCount);

          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3 relative
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
                
                {/* Unread counter for mobile view (shows on avatar) */}
                {formattedCount && (
                  <span className="lg:hidden absolute -top-1 -right-1 badge badge-primary text-primary-content text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                    {formattedCount}
                  </span>
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">{user.fullName}</div>
                  {/* Unread message counter */}
                  {formattedCount && (
                    <span className="badge badge-primary text-primary-content text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-2">
                      {formattedCount}
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  {typingUsers.includes(user._id) ? (
                    <span className="text-white drop-shadow-md animate-pulse">Typing...</span>
                  ) : onlineUsers.includes(user._id) ? (
                    <span className="text-zinc-400">Online</span>
                  ) : (
                    <span className="text-zinc-400">Offline</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;