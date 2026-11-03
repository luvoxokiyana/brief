import { supabase } from "../supabase";
import type { UserRole } from "../../context/AuthContext";

export type StaffMember = {
  id: string;
  firm_id: string;
  full_name: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
};

export type StaffInput = {
  full_name: string;
  email: string | null;
};

/**
 * Reads all staff for the caller's firm. RLS scopes the result to
 * firm_id; the client does not need to pass it. Ordered by is_active
 * descending so active staff appear first, then by name.
 */
export async function listStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("id, firm_id, full_name, email, is_active, created_at")
    .order("is_active", { ascending: false })
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StaffMember[];
}

/**
 * Inserts a new staff member. firm_id must be supplied by the caller
 * (read from user_profiles in the auth context). The INSERT policy
 * verifies it matches the caller's own firm — a mismatch is rejected
 * by the database, not by this function.
 */
export async function createStaff(
  input: StaffInput,
  firmId: string
): Promise<StaffMember> {
  const { data, error } = await supabase
    .from("staff")
    .insert({
      firm_id: firmId,
      full_name: input.full_name.trim(),
      email: input.email ? input.email.trim() : null,
    })
    .select("id, firm_id, full_name, email, is_active, created_at")
    .single();

  if (error) throw error;
  return data as StaffMember;
}

/**
 * Updates an existing staff member. Only full_name and email are
 * editable; firm_id is not exposed in the form and is not sent.
 */
export async function updateStaff(
  id: string,
  input: StaffInput
): Promise<StaffMember> {
  const { data, error } = await supabase
    .from("staff")
    .update({
      full_name: input.full_name.trim(),
      email: input.email ? input.email.trim() : null,
    })
    .eq("id", id)
    .select("id, firm_id, full_name, email, is_active, created_at")
    .single();

  if (error) throw error;
  return data as StaffMember;
}

/**
 * Toggles is_active. Soft delete / reactivate. Never hard-deletes:
 * events (later) will reference staff.id, and hard-deleting would
 * orphan them.
 */
export async function setStaffActive(
  id: string,
  isActive: boolean
): Promise<StaffMember> {
  const { data, error } = await supabase
    .from("staff")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("id, firm_id, full_name, email, is_active, created_at")
    .single();

  if (error) throw error;
  return data as StaffMember;
}

/**
 * Unused in the current UI. Exposed for future admin "purge" actions
 * once the app knows how to handle events referencing the staff row.
 */
export async function deleteStaff(id: string): Promise<void> {
  const { error } = await supabase.from("staff").delete().eq("id", id);
  if (error) throw error;
}

/** Type guard for the UI to decide whether to show write controls. */
export function canEditStaff(role: UserRole | undefined): boolean {
  return role === "admin";
}