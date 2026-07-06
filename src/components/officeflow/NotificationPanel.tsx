import { X, Bell, Trash2 } from "lucide-react";
import { useStore } from "@/lib/officeflow/store";
import { format } from "date-fns";

export function NotificationPanel() {
  const {
    notificationHistory,
    showNotificationPanel,
    setShowNotificationPanel,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotificationHistory,
    unreadCount
  } = useStore();

  if (!showNotificationPanel) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => setShowNotificationPanel(false)}
      />

      {/* Panel - slide-in from right, mobile-friendly */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-ink" />
                <h2 className="text-lg font-bold text-ink">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-lime px-1.5 text-[10px] font-bold text-ink">
                      {unreadCount}
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={() => setShowNotificationPanel(false)}
                className="rounded-full p-2 hover:bg-gray-100 tap tap-press"
              >
                <X className="h-5 w-5 text-ink-muted" />
              </button>
            </div>
            {notificationHistory.length > 0 && (
              <div className="px-4 pb-3 flex items-center gap-2">
                <button
                  onClick={markAllNotificationsRead}
                  className="flex-1 rounded-lg bg-canvas px-3 py-2 text-xs font-semibold text-ink tap tap-press"
                >
                  Mark all read
                </button>
                <button
                  onClick={clearNotificationHistory}
                  className="rounded-lg bg-canvas p-2 text-ink-muted tap tap-press"
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto bg-canvas">
            {notificationHistory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-ink-muted p-8">
                <div className="text-center">
                  <Bell className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs mt-1 opacity-60">Your alerts will appear here</p>
                </div>
              </div>
            ) : (
              <div className="py-2">
                {notificationHistory.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => markNotificationRead(notification.id)}
                    className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                      !notification.read
                        ? "bg-white"
                        : "bg-canvas hover:bg-white/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 relative">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              notification.tone === "success"
                                ? "var(--brand-lime)"
                                : notification.tone === "warning"
                                ? "#fbbf24"
                                : "var(--brand-blue)",
                          }}
                        />
                        {!notification.read && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm ${!notification.read ? "font-semibold text-ink" : "font-medium text-ink-muted"}`}>
                          {notification.title}
                        </div>
                        {notification.body && (
                          <div className="mt-0.5 text-xs text-ink-muted line-clamp-2">
                            {notification.body}
                          </div>
                        )}
                        <div className="mt-1 text-[10px] text-ink-muted/60">
                          {format(notification.timestamp, "MMM d, h:mm a")}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}