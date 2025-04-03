export interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  driver_id?: string;
  phone?: string;
  hub_id?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface City {
  id: number;
  name: string;
  cep?: string;
  hub_id?: string;
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  status: "pending" | "accepted" | "completed";
  period: "AM" | "PM" | "OUROBOROS";
  city_id?: number;
  city?: City;
  packages?: number;
  distance?: string;
  estimated_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  id?: string;
  user_id: string;
  primary_regions: number[];
  backup_regions: number[];
  created_at?: string;
  updated_at?: string;
}
