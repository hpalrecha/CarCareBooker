// Augment express-session with the fields this app stores on the session.
import "express-session";

declare module "express-session" {
  interface SessionData {
    adminId?: string;
  }
}
