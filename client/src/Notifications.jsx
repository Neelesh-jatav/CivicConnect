import React from "react";
import "./notification.css";

const Notifications = ({ onNavigate, notifications, setNotifications }) => {

  const markAllRead = async () => {
    await fetch("http://localhost:5002/api/v1/notifications/read", {
      method: "PUT",
      credentials: "include",
    });

    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h2>Notifications</h2>
        {notifications.length > 0 && <button onClick={markAllRead}>Mark all as read</button>}
      </div>

      {notifications.length === 0 && (
        <p className="empty">No notifications yet</p>
      )}

      {notifications.map(n => (
        <div key={n._id} className={`notification-card ${n.isRead ? "read" : "unread"}`} onClick={() => onNavigate && onNavigate(n.link)}>
          <h4>{n.title}</h4>
          <p>{n.message}</p>
          <span>{new Date(n.createdAt).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default Notifications;