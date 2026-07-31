import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type AdminActionType = 
  | "CREATE_EVENT" | "UPDATE_EVENT" | "DELETE_EVENT"
  | "CREATE_ALUMNI" | "UPDATE_ALUMNI" | "DELETE_ALUMNI"
  | "CREATE_RESOURCE" | "UPDATE_RESOURCE" | "DELETE_RESOURCE"
  | "UPDATE_USER_ROLE" | "DELETE_USER"
  | "CREATE_MINISTRY" | "UPDATE_MINISTRY" | "DELETE_MINISTRY"
  | "CREATE_GALLERY" | "UPDATE_GALLERY" | "DELETE_GALLERY"
  | "UPDATE_DONATION" | "DELETE_DONATION"
  | "RESPOND_PRAYER" | "DELETE_PRAYER";

export const logAdminAction = async (
  adminId: string,
  adminEmail: string,
  action: AdminActionType,
  details: string,
  targetId?: string
) => {
  try {
    await addDoc(collection(db!, "admin_audit_logs"), {
      adminId,
      adminEmail,
      action,
      details,
      targetId: targetId || null,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
};
