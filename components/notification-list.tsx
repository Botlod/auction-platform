import { markNotificationRead } from "@/app/dashboard/actions";

type Notification = { id: string; type: string; payload: { title?: string; amount?: number | string }; read: boolean; created_at: string };

function messageFor(notification: Notification) {
  const title = notification.payload.title ?? "an auction";
  const amount = notification.payload.amount === undefined ? null : `$${Number(notification.payload.amount).toFixed(2)}`;
  if (notification.type === "won") return `You won ${title}${amount ? ` for ${amount}` : ""}.`;
  if (notification.type === "sold") return `${title} sold${amount ? ` for ${amount}` : ""}.`;
  if (notification.type === "outbid") return `You have been outbid on ${title}.`;
  return `Payment confirmed for ${title}.`;
}

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  return <section className="notification-list" aria-label="Notifications"><div className="notification-heading"><p className="eyebrow">Notifications</p><h2>Recent activity</h2></div>{notifications.length ? <ol>{notifications.map((notification) => <li className={notification.read ? "notification-read" : ""} key={notification.id}><div><p>{messageFor(notification)}</p><time dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString()}</time></div>{!notification.read && <form action={markNotificationRead}><input type="hidden" name="notificationId" value={notification.id} /><button className="secondary-button" type="submit">Mark read</button></form>}</li>)}</ol> : <p className="empty-message">No notifications yet.</p>}</section>;
}