export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["ai_generation_kind"]
          model: string
          output: Json
          prompt: string
          provider: string
          store_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["ai_generation_kind"]
          model: string
          output: Json
          prompt: string
          provider: string
          store_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["ai_generation_kind"]
          model?: string
          output?: Json
          prompt?: string
          provider?: string
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      block_edit_proposals: {
        Row: {
          applied_at: string | null
          created_at: string
          id: string
          operations: Json
          page_id: string
          prompt: string
          snapshot_before: Json
          status: Database["public"]["Enums"]["block_proposal_status"]
          store_id: string
          validation_errors: Json | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          id?: string
          operations: Json
          page_id: string
          prompt: string
          snapshot_before: Json
          status?: Database["public"]["Enums"]["block_proposal_status"]
          store_id: string
          validation_errors?: Json | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          id?: string
          operations?: Json
          page_id?: string
          prompt?: string
          snapshot_before?: Json
          status?: Database["public"]["Enums"]["block_proposal_status"]
          store_id?: string
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "block_edit_proposals_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "store_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_edit_proposals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      block_types: {
        Row: {
          category: string | null
          created_at: string
          default_props: Json
          description: string | null
          is_active: boolean
          key: string
          max_per_page: number | null
          name: string
          props_schema: Json
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_props?: Json
          description?: string | null
          is_active?: boolean
          key: string
          max_per_page?: number | null
          name: string
          props_schema: Json
        }
        Update: {
          category?: string | null
          created_at?: string
          default_props?: Json
          description?: string | null
          is_active?: boolean
          key?: string
          max_per_page?: number | null
          name?: string
          props_schema?: Json
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount_cents: number
          base_amount_cents: number
          confirmed_at: string | null
          created_at: string
          id: string
          order_id: string
          paid_at: string | null
          payment_reference: string | null
          rate_bps: number
          seller_id: string | null
          seller_user_id: string
          status: Database["public"]["Enums"]["commission_status"]
          store_id: string | null
          store_name: string
        }
        Insert: {
          amount_cents: number
          base_amount_cents: number
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          paid_at?: string | null
          payment_reference?: string | null
          rate_bps: number
          seller_id?: string | null
          seller_user_id: string
          status?: Database["public"]["Enums"]["commission_status"]
          store_id?: string | null
          store_name: string
        }
        Update: {
          amount_cents?: number
          base_amount_cents?: number
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_reference?: string | null
          rate_bps?: number
          seller_id?: string | null
          seller_user_id?: string
          status?: Database["public"]["Enums"]["commission_status"]
          store_id?: string | null
          store_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "mis_ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "mis_vendedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "store_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          posicion: number
          pregunta: string
          spec: Json
          store_id: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          posicion?: number
          pregunta: string
          spec: Json
          store_id: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          posicion?: number
          pregunta?: string
          spec?: Json
          store_id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          store_id: string
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          store_id: string
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          store_id?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "mis_ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "mis_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_email: string | null
          buyer_name: string
          buyer_phone: string
          commission_base_cents: number
          commission_bps: number
          commission_cents: number
          created_at: string
          id: string
          net_to_store_cents: number
          order_number: number
          paid_at: string | null
          payment_proof_url: string | null
          referral_code: string | null
          seller_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          buyer_email?: string | null
          buyer_name: string
          buyer_phone: string
          commission_base_cents?: number
          commission_bps?: number
          commission_cents?: number
          created_at?: string
          id?: string
          net_to_store_cents?: number
          order_number?: number
          paid_at?: string | null
          payment_proof_url?: string | null
          referral_code?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal_cents: number
          total_cents: number
          updated_at?: string
        }
        Update: {
          buyer_email?: string | null
          buyer_name?: string
          buyer_phone?: string
          commission_base_cents?: number
          commission_bps?: number
          commission_cents?: number
          created_at?: string
          id?: string
          net_to_store_cents?: number
          order_number?: number
          paid_at?: string | null
          payment_proof_url?: string | null
          referral_code?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "mis_vendedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "store_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          features: Json
          is_active: boolean
          key: string
          name: string
          trial_days: number
        }
        Insert: {
          created_at?: string
          features?: Json
          is_active?: boolean
          key: string
          name: string
          trial_days?: number
        }
        Update: {
          created_at?: string
          features?: Json
          is_active?: boolean
          key?: string
          name?: string
          trial_days?: number
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          position: number
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          position?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          position?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          category_id: string | null
          compare_at_price_cents: number | null
          condition: Database["public"]["Enums"]["product_condition"]
          condition_note: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          images: string[]
          is_active: boolean
          is_featured: boolean
          low_stock_threshold: number
          name: string
          price_cents: number
          seller_enabled: boolean
          sku: string | null
          stock: number
          store_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          compare_at_price_cents?: number | null
          condition?: Database["public"]["Enums"]["product_condition"]
          condition_note?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          low_stock_threshold?: number
          name: string
          price_cents: number
          seller_enabled?: boolean
          sku?: string | null
          stock?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          category_id?: string | null
          compare_at_price_cents?: number | null
          condition?: Database["public"]["Enums"]["product_condition"]
          condition_note?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          low_stock_threshold?: number
          name?: string
          price_cents?: number
          seller_enabled?: boolean
          sku?: string | null
          stock?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          full_name: string | null
          id: string
          primary_role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
          primary_role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id?: string
          primary_role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          created_at: string
          is_active: boolean
          key: string
          name: string
          position: number
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          key: string
          name: string
          position?: number
        }
        Update: {
          created_at?: string
          is_active?: boolean
          key?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      seller_profiles: {
        Row: {
          bio: string | null
          city: string | null
          created_at: string
          deleted_at: string | null
          display_name: string
          phone: string | null
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          phone?: string | null
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          phone?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          external_account_id: string | null
          id: string
          provider: Database["public"]["Enums"]["social_provider"]
          store_id: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          external_account_id?: string | null
          id?: string
          provider: Database["public"]["Enums"]["social_provider"]
          store_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          external_account_id?: string | null
          id?: string
          provider?: Database["public"]["Enums"]["social_provider"]
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          ai_generation_id: string | null
          content: string
          created_at: string
          deleted_at: string | null
          error: string | null
          external_post_id: string | null
          id: string
          media_url: string | null
          product_id: string | null
          provider: Database["public"]["Enums"]["social_provider"]
          published_at: string | null
          status: Database["public"]["Enums"]["social_post_status"]
          store_id: string
          updated_at: string
        }
        Insert: {
          ai_generation_id?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          error?: string | null
          external_post_id?: string | null
          id?: string
          media_url?: string | null
          product_id?: string | null
          provider: Database["public"]["Enums"]["social_provider"]
          published_at?: string | null
          status?: Database["public"]["Enums"]["social_post_status"]
          store_id: string
          updated_at?: string
        }
        Update: {
          ai_generation_id?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          error?: string | null
          external_post_id?: string | null
          id?: string
          media_url?: string | null
          product_id?: string | null
          provider?: Database["public"]["Enums"]["social_provider"]
          published_at?: string | null
          status?: Database["public"]["Enums"]["social_post_status"]
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_ai_generation_id_fkey"
            columns: ["ai_generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "mis_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_blocks: {
        Row: {
          block_type_key: string
          created_at: string
          deleted_at: string | null
          id: string
          is_visible: boolean
          page_id: string
          position: number
          props: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          block_type_key: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_visible?: boolean
          page_id: string
          position: number
          props?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          block_type_key?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_visible?: boolean
          page_id?: string
          position?: number
          props?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_blocks_block_type_key_fkey"
            columns: ["block_type_key"]
            isOneToOne: false
            referencedRelation: "block_types"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "store_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "store_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_blocks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_invites: {
        Row: {
          code: string
          created_at: string
          store_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_invites_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_pages: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_home: boolean
          key: string
          published_at: string | null
          status: Database["public"]["Enums"]["page_status"]
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_home?: boolean
          key: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["page_status"]
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_home?: boolean
          key?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["page_status"]
          store_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_pages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_sellers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          deleted_at: string | null
          id: string
          joined_at: string
          referral_code: string
          status: Database["public"]["Enums"]["seller_status"]
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          joined_at?: string
          referral_code: string
          status?: Database["public"]["Enums"]["seller_status"]
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          joined_at?: string
          referral_code?: string
          status?: Database["public"]["Enums"]["seller_status"]
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_sellers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          commission_bps: number
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_published: boolean
          logo_url: string | null
          name: string
          owner_id: string
          seller_join_mode: Database["public"]["Enums"]["seller_join_mode"]
          seller_network_enabled: boolean
          slug: string
          tagline: string | null
          template_key: string | null
          theme: Json
          updated_at: string
        }
        Insert: {
          commission_bps?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          seller_join_mode?: Database["public"]["Enums"]["seller_join_mode"]
          seller_network_enabled?: boolean
          slug: string
          tagline?: string | null
          template_key?: string | null
          theme?: Json
          updated_at?: string
        }
        Update: {
          commission_bps?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          seller_join_mode?: Database["public"]["Enums"]["seller_join_mode"]
          seller_network_enabled?: boolean
          slug?: string
          tagline?: string | null
          template_key?: string | null
          theme?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_template_key_fkey"
            columns: ["template_key"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["key"]
          },
        ]
      }
      subscriptions: {
        Row: {
          blocked_at: string | null
          created_at: string
          id: string
          plan_key: string
          purge_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          store_id: string
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          blocked_at?: string | null
          created_at?: string
          id?: string
          plan_key: string
          purge_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          store_id: string
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          blocked_at?: string | null
          created_at?: string
          id?: string
          plan_key?: string
          purge_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          store_id?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      template_pages: {
        Row: {
          blocks: Json
          is_home: boolean
          page_key: string
          template_key: string
          title: string
        }
        Insert: {
          blocks?: Json
          is_home?: boolean
          page_key: string
          template_key: string
          title: string
        }
        Update: {
          blocks?: Json
          is_home?: boolean
          page_key?: string
          template_key?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_pages_template_key_fkey"
            columns: ["template_key"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["key"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          description: string | null
          is_active: boolean
          key: string
          name: string
          preview_image_url: string | null
          sector: string
          theme: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          key: string
          name: string
          preview_image_url?: string | null
          sector: string
          theme?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          key?: string
          name?: string
          preview_image_url?: string | null
          sector?: string
          theme?: Json
        }
        Relationships: [
          {
            foreignKeyName: "templates_sector_fkey"
            columns: ["sector"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["key"]
          },
        ]
      }
    }
    Views: {
      mis_comisiones: {
        Row: {
          amount_cents: number | null
          base_amount_cents: number | null
          created_at: string | null
          id: string | null
          nombre: string | null
          rate_bps: number | null
          status: Database["public"]["Enums"]["commission_status"] | null
        }
        Relationships: []
      }
      mis_items: {
        Row: {
          created_at: string | null
          id: string | null
          order_id: string | null
          product_name: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_cents: number | null
          unit_price_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "mis_ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mis_productos: {
        Row: {
          category: string | null
          compare_at_price_cents: number | null
          condition: Database["public"]["Enums"]["product_condition"] | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          is_featured: boolean | null
          low_stock_threshold: number | null
          name: string | null
          price_cents: number | null
          seller_enabled: boolean | null
          sku: string | null
          stock: number | null
        }
        Insert: {
          category?: string | null
          compare_at_price_cents?: number | null
          condition?: Database["public"]["Enums"]["product_condition"] | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          low_stock_threshold?: number | null
          name?: string | null
          price_cents?: number | null
          seller_enabled?: boolean | null
          sku?: string | null
          stock?: number | null
        }
        Update: {
          category?: string | null
          compare_at_price_cents?: number | null
          condition?: Database["public"]["Enums"]["product_condition"] | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          low_stock_threshold?: number | null
          name?: string | null
          price_cents?: number | null
          seller_enabled?: boolean | null
          sku?: string | null
          stock?: number | null
        }
        Relationships: []
      }
      mis_vendedores: {
        Row: {
          ciudad: string | null
          id: string | null
          joined_at: string | null
          nombre: string | null
          referral_code: string | null
          status: Database["public"]["Enums"]["seller_status"] | null
        }
        Relationships: []
      }
      mis_ventas: {
        Row: {
          commission_base_cents: number | null
          commission_cents: number | null
          created_at: string | null
          id: string | null
          referral_code: string | null
          seller_id: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_cents: number | null
        }
        Insert: {
          commission_base_cents?: number | null
          commission_cents?: number | null
          created_at?: string | null
          id?: string | null
          referral_code?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_cents?: number | null
        }
        Update: {
          commission_base_cents?: number | null
          commission_cents?: number | null
          created_at?: string | null
          id?: string | null
          referral_code?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "mis_vendedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "store_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_template: {
        Args: { p_store_id: string; p_template_key: string }
        Returns: undefined
      }
      create_order: {
        Args: {
          p_buyer_email: string
          p_buyer_name: string
          p_buyer_phone: string
          p_items: Json
          p_referral_code: string
          p_store_id: string
        }
        Returns: string
      }
      create_store: {
        Args: {
          p_commission_bps?: number
          p_description: string
          p_name: string
          p_sellers?: boolean
          p_template_key: string
        }
        Returns: string
      }
      ensure_seller_profile: { Args: { p_user_id: string }; Returns: undefined }
      generate_invite_code: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      insight_filtro: {
        Args: { p_dataset: string; p_fecha: string }
        Returns: string
      }
      join_store: {
        Args: { p_invite_code?: string; p_store_slug: string }
        Returns: string
      }
      my_seller_ids: { Args: never; Returns: string[] }
      my_seller_invite: { Args: never; Returns: string }
      my_store_id: { Args: never; Returns: string }
      referido_publico: {
        Args: { p_codigo: string; p_store_id: string }
        Returns: {
          codigo: string
          nombre: string
        }[]
      }
      rotate_seller_invite: { Args: never; Returns: string }
      run_insight: {
        Args: {
          p_dataset: string
          p_desde?: string
          p_dimension: string
          p_hasta?: string
          p_limite?: number
          p_metrica: string
        }
        Returns: {
          etiqueta: string
          orden: string
          valor: number
        }[]
      }
      run_insight_sql: {
        Args: { p_sql: string }
        Returns: {
          etiqueta: string
          valor: number
        }[]
      }
      seller_public_stats: {
        Args: { p_slug: string }
        Returns: {
          avatar_url: string
          bio: string
          city: string
          desde: string
          display_name: string
          tiendas: number
          ventas: number
          volumen_cents: number
        }[]
      }
      seller_public_stores: {
        Args: { p_slug: string }
        Returns: {
          desde: string
          store_name: string
          ventas: number
        }[]
      }
      store_is_live: { Args: { p_store_id: string }; Returns: boolean }
      take_product: { Args: { p_product_id: string }; Returns: string }
    }
    Enums: {
      ai_generation_kind: "tienda" | "bloques" | "analisis" | "marketing"
      block_proposal_status: "propuesta" | "aplicada" | "rechazada" | "invalida"
      commission_status: "pendiente" | "confirmada" | "pagada" | "anulada"
      order_status:
        "pendiente" | "pagado" | "enviado" | "entregado" | "cancelado"
      page_status: "borrador" | "publicada"
      product_condition: "nuevo" | "segunda_mano" | "reacondicionado"
      seller_join_mode: "abierta" | "con_aprobacion"
      seller_status: "pendiente" | "activo" | "rechazado" | "suspendido"
      social_post_status: "borrador" | "publicado" | "compartido" | "fallido"
      social_provider: "facebook" | "whatsapp"
      subscription_status: "prueba" | "activa" | "bloqueada" | "cancelada"
      user_role: "emprendedor" | "vendedor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_generation_kind: ["tienda", "bloques", "analisis", "marketing"],
      block_proposal_status: ["propuesta", "aplicada", "rechazada", "invalida"],
      commission_status: ["pendiente", "confirmada", "pagada", "anulada"],
      order_status: [
        "pendiente",
        "pagado",
        "enviado",
        "entregado",
        "cancelado",
      ],
      page_status: ["borrador", "publicada"],
      product_condition: ["nuevo", "segunda_mano", "reacondicionado"],
      seller_join_mode: ["abierta", "con_aprobacion"],
      seller_status: ["pendiente", "activo", "rechazado", "suspendido"],
      social_post_status: ["borrador", "publicado", "compartido", "fallido"],
      social_provider: ["facebook", "whatsapp"],
      subscription_status: ["prueba", "activa", "bloqueada", "cancelada"],
      user_role: ["emprendedor", "vendedor"],
    },
  },
} as const
