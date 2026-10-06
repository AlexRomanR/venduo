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
          theme_before: Json | null
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
          theme_before?: Json | null
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
          theme_before?: Json | null
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
      catalogs: {
        Row: {
          config: Json
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          share_token: string
          store_id: string
          template_key: string
          updated_at: string
        }
        Insert: {
          config: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          share_token?: string
          store_id: string
          template_key: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          share_token?: string
          store_id?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogs_store_id_fkey"
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
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string
          id: string
          order_number: number
          paid_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          id?: string
          order_number?: number
          paid_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal_cents: number
          total_cents: number
          updated_at?: string
        }
        Update: {
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          id?: string
          order_number?: number
          paid_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
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
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id?: string
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
      social_connections: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          external_account_id: string | null
          id: string
          provider: Database["public"]["Enums"]["social_provider"]
          refresh_token: string | null
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
          refresh_token?: string | null
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
          refresh_token?: string | null
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
      store_design_versions: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          logo_url: string | null
          note: string | null
          number: number
          origin: Database["public"]["Enums"]["design_origin"]
          pages: Json
          store_id: string
          template_key: string | null
          template_version: number | null
          theme_overrides: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          note?: string | null
          number: number
          origin: Database["public"]["Enums"]["design_origin"]
          pages?: Json
          store_id: string
          template_key?: string | null
          template_version?: number | null
          theme_overrides?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          note?: string | null
          number?: number
          origin?: Database["public"]["Enums"]["design_origin"]
          pages?: Json
          store_id?: string
          template_key?: string | null
          template_version?: number | null
          theme_overrides?: Json
        }
        Relationships: [
          {
            foreignKeyName: "store_design_versions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_design_versions_template_key_fkey"
            columns: ["template_key"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["key"]
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
      stores: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_published: boolean
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          tagline: string | null
          template_key: string | null
          theme_overrides: Json
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
          tagline?: string | null
          template_key?: string | null
          theme_overrides?: Json
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
          tagline?: string | null
          template_key?: string | null
          theme_overrides?: Json
          updated_at?: string
          whatsapp?: string | null
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
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          key: string
          name: string
          preview_image_url?: string | null
          sector: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          key?: string
          name?: string
          preview_image_url?: string | null
          sector?: string
          version?: number
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
          sku?: string | null
          stock?: number | null
        }
        Relationships: []
      }
      mis_ventas: {
        Row: {
          created_at: string | null
          id: string | null
          numero: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_cents: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          numero?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_cents?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          numero?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_cents?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_template: {
        Args: { p_store_id: string; p_template_key: string }
        Returns: undefined
      }
      capture_design_version: {
        Args: {
          p_note?: string
          p_origin: Database["public"]["Enums"]["design_origin"]
          p_store_id: string
        }
        Returns: string
      }
      catalogo_compartido: {
        Args: { p_token: string }
        Returns: {
          config: Json
          id: string
          name: string
          store_id: string
        }[]
      }
      change_store_template: {
        Args: { p_keep_sections?: boolean; p_template_key: string }
        Returns: string
      }
      create_order: {
        Args: { p_items: Json; p_store_id: string }
        Returns: Json
      }
      create_store: {
        Args: {
          p_description: string
          p_name: string
          p_template_key: string
          p_whatsapp: string
        }
        Returns: string
      }
      my_store_id: { Args: never; Returns: string }
      portada_de_tienda: { Args: { p_store_id: string }; Returns: string }
      publicar_diseno: {
        Args: { p_bloques: Json; p_logo_url: string; p_theme_overrides: Json }
        Returns: string
      }
      restaurar_version: { Args: { p_version_id: string }; Returns: string }
      run_insight_sql: {
        Args: { p_sql: string }
        Returns: {
          etiqueta: string
          valor: number
        }[]
      }
      seed_template_pages: {
        Args: { p_store_id: string; p_template_key: string }
        Returns: undefined
      }
      store_is_live: { Args: { p_store_id: string }; Returns: boolean }
    }
    Enums: {
      ai_generation_kind: "tienda" | "bloques" | "analisis" | "marketing"
      block_proposal_status: "propuesta" | "aplicada" | "rechazada" | "invalida"
      design_origin:
        | "inicial"
        | "alta"
        | "antes_de_cambiar_plantilla"
        | "antes_de_publicar"
        | "antes_de_restaurar"
      order_status: "pendiente" | "pagado" | "cancelado"
      page_status: "borrador" | "publicada"
      product_condition: "nuevo" | "segunda_mano" | "reacondicionado"
      social_post_status: "borrador" | "publicado" | "compartido" | "fallido"
      social_provider: "facebook" | "whatsapp" | "canva"
      subscription_status: "prueba" | "activa" | "bloqueada" | "cancelada"
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
      design_origin: [
        "inicial",
        "alta",
        "antes_de_cambiar_plantilla",
        "antes_de_publicar",
        "antes_de_restaurar",
      ],
      order_status: ["pendiente", "pagado", "cancelado"],
      page_status: ["borrador", "publicada"],
      product_condition: ["nuevo", "segunda_mano", "reacondicionado"],
      social_post_status: ["borrador", "publicado", "compartido", "fallido"],
      social_provider: ["facebook", "whatsapp", "canva"],
      subscription_status: ["prueba", "activa", "bloqueada", "cancelada"],
    },
  },
} as const
