export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      cities: {
        Row: {
          cep: string;
          created_at: string | null;
          hub_id: string;
          id: number;
          name: string;
        };
        Insert: {
          cep: string;
          created_at?: string | null;
          hub_id: string;
          id?: number;
          name: string;
        };
        Update: {
          cep?: string;
          created_at?: string | null;
          hub_id?: string;
          id?: number;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cities_hub_id_fkey";
            columns: ["hub_id"];
            isOneToOne: false;
            referencedRelation: "hubs";
            referencedColumns: ["id"];
          },
        ];
      };
      disp: {
        Row: {
          created_at: string;
          disp: boolean | null;
          id: number;
          name: string | null;
          turno: string | null;
          user_id: string;
          vehicle: string | null;
        };
        Insert: {
          created_at?: string;
          disp?: boolean | null;
          id?: number;
          name?: string | null;
          turno?: string | null;
          user_id?: string;
          vehicle?: string | null;
        };
        Update: {
          created_at?: string;
          disp?: boolean | null;
          id?: number;
          name?: string | null;
          turno?: string | null;
          user_id?: string;
          vehicle?: string | null;
        };
        Relationships: [];
      };
      hubs: {
        Row: {
          cep: string;
          city: string;
          code: string;
          complement: string | null;
          created_at: string | null;
          id: string;
          name: string;
          neighborhood: string;
          residence_number: number;
          state: Database["public"]["Enums"]["state_enum"];
          street: string;
          updated_at: string | null;
        };
        Insert: {
          cep: string;
          city: string;
          code: string;
          complement?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          neighborhood: string;
          residence_number: number;
          state: Database["public"]["Enums"]["state_enum"];
          street: string;
          updated_at?: string | null;
        };
        Update: {
          cep?: string;
          city?: string;
          code?: string;
          complement?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          neighborhood?: string;
          residence_number?: number;
          state?: Database["public"]["Enums"]["state_enum"];
          street?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      route_interests: {
        Row: {
          created_at: string | null;
          id: number;
          route_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          route_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          route_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "route_interests_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_interests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      routes: {
        Row: {
          city_id: number;
          content: string;
          created_at: string | null;
          distance: string;
          hub_id: string;
          id: string;
          name: string;
          neighborhoods: string;
          packages: number;
          shift: Database["public"]["Enums"]["routes_shift"];
          status: Database["public"]["Enums"]["routes_status"] | null;
          updated_at: string | null;
          loading_time: string | null;
        };
        Insert: {
          city_id: number;
          content: string;
          created_at?: string | null;
          distance: string;
          hub_id: string;
          id?: string;
          name: string;
          neighborhoods: string;
          packages: number;
          shift: Database["public"]["Enums"]["routes_shift"];
          status?: Database["public"]["Enums"]["routes_status"] | null;
          updated_at?: string | null;
          loading_time?: string | null;
        };
        Update: {
          city_id?: number;
          content?: string;
          created_at?: string | null;
          distance?: string;
          hub_id?: string;
          id?: string;
          name?: string;
          neighborhoods?: string;
          packages?: number;
          shift?: Database["public"]["Enums"]["routes_shift"];
          status?: Database["public"]["Enums"]["routes_status"] | null;
          updated_at?: string | null;
          loading_time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "routes_hub_id_fkey";
            columns: ["hub_id"];
            isOneToOne: false;
            referencedRelation: "hubs";
            referencedColumns: ["id"];
          },
        ];
      };
      user_blocked_routes: {
        Row: {
          created_at: string | null;
          id: number;
          route_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          route_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          route_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_blocked_routes_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_blocked_routes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          backup_regions: number[] | null;
          created_at: string | null;
          hub_id: string | null;
          id: number;
          primary_regions: number[] | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          backup_regions?: number[] | null;
          created_at?: string | null;
          hub_id?: string | null;
          id?: number;
          primary_regions?: number[] | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          backup_regions?: number[] | null;
          created_at?: string | null;
          hub_id?: string | null;
          id?: number;
          primary_regions?: number[] | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          account_locked_until: string | null;
          created_at: string | null;
          driver_id: string | null;
          failed_login_attempts: number | null;
          hub_id: string;
          id: string;
          last_failed_login: string | null;
          last_login: string | null;
          name: string;
          permissions: Database["public"]["Enums"]["user_permissions"] | null;
          phone: string;
          updated_at: string | null;
          vehicle: string | null;
        };
        Insert: {
          account_locked_until?: string | null;
          created_at?: string | null;
          driver_id?: string | null;
          failed_login_attempts?: number | null;
          hub_id: string;
          id?: string;
          last_failed_login?: string | null;
          last_login?: string | null;
          name: string;
          permissions?: Database["public"]["Enums"]["user_permissions"] | null;
          phone: string;
          updated_at?: string | null;
          vehicle?: string | null;
        };
        Update: {
          account_locked_until?: string | null;
          created_at?: string | null;
          driver_id?: string | null;
          failed_login_attempts?: number | null;
          hub_id?: string;
          id?: string;
          last_failed_login?: string | null;
          last_login?: string | null;
          name?: string;
          permissions?: Database["public"]["Enums"]["user_permissions"] | null;
          phone?: string;
          updated_at?: string | null;
          vehicle?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_hub_id_fkey";
            columns: ["hub_id"];
            isOneToOne: false;
            referencedRelation: "hubs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      routes_shift: "AM" | "PM" | "OUROBOROS";
      routes_status: "pending" | "accepted" | "under-review";
      state_enum:
        | "AC"
        | "AL"
        | "AP"
        | "AM"
        | "BA"
        | "CE"
        | "DF"
        | "ES"
        | "GO"
        | "MA"
        | "MT"
        | "MS"
        | "MG"
        | "PA"
        | "PB"
        | "PR"
        | "PE"
        | "PI"
        | "RJ"
        | "RN"
        | "RS"
        | "RO"
        | "RR"
        | "SC"
        | "SP"
        | "SE"
        | "TO";
      user_permissions: "admin" | "USER";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
