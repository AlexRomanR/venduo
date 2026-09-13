/**
 * Tipos de la base de datos.
 *
 * Escritos a mano para que el proyecto compile sin conexión a Supabase.
 * Una vez creado el proyecto real, regeneralos con:
 *   npm run db:types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type OrderStatus =
  "pendiente" | "pagado" | "enviado" | "entregado" | "cancelado"

export type AIGenerationKind = "tienda" | "analisis" | "marketing"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          tagline: string | null
          description: string | null
          logo_url: string | null
          currency: string
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          tagline?: string | null
          description?: string | null
          logo_url?: string | null
          currency?: string
          is_published?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          tagline?: string | null
          description?: string | null
          logo_url?: string | null
          currency?: string
          is_published?: boolean
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          store_id: string
          name: string
          description: string | null
          price_cents: number
          stock: number
          category: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          description?: string | null
          price_cents: number
          stock?: number
          category?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          price_cents?: number
          stock?: number
          category?: string | null
          image_url?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          store_id: string
          buyer_name: string
          buyer_email: string | null
          buyer_phone: string | null
          total_cents: number
          status: OrderStatus
          payment_proof_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          buyer_name: string
          buyer_email?: string | null
          buyer_phone?: string | null
          total_cents: number
          status?: OrderStatus
          payment_proof_url?: string | null
          created_at?: string
        }
        Update: {
          status?: OrderStatus
          payment_proof_url?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
        }
        Update: {
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: []
      }
      ai_generations: {
        Row: {
          id: string
          user_id: string
          store_id: string | null
          kind: AIGenerationKind
          provider: string
          model: string
          prompt: string
          output: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          store_id?: string | null
          kind: AIGenerationKind
          provider: string
          model: string
          prompt: string
          output: Json
          created_at?: string
        }
        Update: never
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: {
      order_status: OrderStatus
      ai_generation_kind: AIGenerationKind
    }
    CompositeTypes: Record<never, never>
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]

export type Store = Tables<"stores">
export type Product = Tables<"products">
export type Order = Tables<"orders">
export type OrderItem = Tables<"order_items">
export type Profile = Tables<"profiles">
