import { supabase } from "../supabase";

export type Room = {
    id: string;
    firm_id: string;
    name: string;
    is_default: boolean;
    created_at: string;
}

/**
 * Returns the firm's default room. There is exactly one, enforced by a
 * partial unique index on rooms. Throws if no default exists — which
 * should never happen on the pilot firm, but fail loud rather than
 * silently write an event with the wrong room.
 */
export async function getDefaultRoom(): Promise<Room> {
    const { data, error } = await supabase
        .from("rooms")
        .select("id, firm_id, name, is_default, created_at")
        .eq("is_default", true)
        .maybeSingle();

        if (error) throw error
        if (!data) throw new Error("No default room found");
        return data as Room;
}