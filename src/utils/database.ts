import { supabase } from "@/lib/supabase";

/**
 * Checks if a table exists in the database
 * @param tableName The name of the table to check
 * @returns True if the table exists, false otherwise
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    // Sanitize the table name to prevent SQL injection
    const sanitizedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");

    // Use a more reliable method to check if table exists using system catalog
    const { data, error } = await supabase.rpc("execute_sql", {
      sql: `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${sanitizedTableName}'
      )`,
    });

    if (error) {
      console.error(
        `Error checking if table ${sanitizedTableName} exists using RPC:`,
        error,
      );

      // Fallback to direct query method
      const fallbackCheck = await supabase
        .from(sanitizedTableName)
        .select("*", { count: "exact", head: true });

      // If there's no error, the table exists
      if (!fallbackCheck.error) return true;

      // Check if the error is specifically about the table not existing
      if (
        fallbackCheck.error.code === "42P01" ||
        fallbackCheck.error.message?.includes("does not exist")
      ) {
        return false;
      }

      // For other errors, log and assume table might not exist to be safe
      console.error(
        `Fallback error checking if table ${sanitizedTableName} exists:`,
        fallbackCheck.error,
      );
      return false;
    }

    // Parse the result from the RPC call
    if (data && typeof data === "object") {
      // Check if data has an execute_sql property
      if (data.execute_sql !== undefined) {
        // If it's a boolean, return it directly
        if (typeof data.execute_sql === "boolean") {
          return data.execute_sql;
        }
        // If it's an array, get the first item
        else if (
          Array.isArray(data.execute_sql) &&
          data.execute_sql.length > 0
        ) {
          const firstResult = data.execute_sql[0];
          // Check if the first item has an 'exists' property
          if (
            typeof firstResult === "object" &&
            firstResult !== null &&
            "exists" in firstResult
          ) {
            return !!firstResult.exists;
          }
          // Otherwise, treat the first item as the result
          return !!firstResult;
        }
      }
    }

    return false;
  } catch (error) {
    console.error(`Exception checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Inserts a record into the hub_location_history table
 * @param hubId The ID of the hub
 * @param userId The ID of the user
 * @param latitude The latitude coordinate
 * @param longitude The longitude coordinate
 * @param radius The radius in meters
 * @param action The action description
 * @returns The inserted record or null if insertion failed
 */
export async function insertHubLocationHistory(
  hubId: string,
  userId: string,
  latitude: number,
  longitude: number,
  radius: number,
  action: string,
) {
  try {
    const { data, error } = await supabase
      .from("hub_location_history")
      .insert([
        {
          hub_id: hubId,
          user_id: userId,
          latitude: parseFloat(String(latitude)),
          longitude: parseFloat(String(longitude)),
          radius: parseInt(String(radius)),
          action: action,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error inserting hub location history:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error in insertHubLocationHistory:", error);
    return null;
  }
}

/**
 * Updates a hub's location in the hubs table
 * @param hubId The ID of the hub
 * @param latitude The latitude coordinate
 * @param longitude The longitude coordinate
 * @param radius The radius in meters
 * @returns True if update was successful, false otherwise
 */
export async function updateHubLocation(
  hubId: string,
  latitude: number,
  longitude: number,
  radius: number,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("hubs")
      .update({
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude)),
        check_in_radius: parseInt(String(radius)),
        updated_at: new Date().toISOString(),
      })
      .eq("id", hubId);

    if (error) {
      console.error("Error updating hub location:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in updateHubLocation:", error);
    return false;
  }
}
