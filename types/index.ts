/**
 * Atajos sobre los tipos de la base.
 *
 * `database.ts` lo genera la CLI de Supabase con `npm run db:types` y se
 * sobrescribe entero: no se edita a mano. Los alias viven acá para que
 * regenerar no los borre.
 */
import type { Tables, TablesInsert, TablesUpdate, Enums } from "./database"

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "./database"

// Identidad
export type Profile = Tables<"profiles">
export type SellerProfile = Tables<"seller_profiles">

// Tenant
export type Store = Tables<"stores">
export type Subscription = Tables<"subscriptions">
export type Plan = Tables<"plans">

// Catálogo
export type Product = Tables<"products">
export type ProductInsert = TablesInsert<"products">
export type ProductUpdate = TablesUpdate<"products">
export type ProductCategory = Tables<"product_categories">
export type ProductCategoryInsert = TablesInsert<"product_categories">

// Venta
export type Order = Tables<"orders">
export type OrderItem = Tables<"order_items">

// Red de vendedores
export type StoreSeller = Tables<"store_sellers">
export type Commission = Tables<"commissions">

// Tienda visual
export type StorePage = Tables<"store_pages">
export type StoreBlock = Tables<"store_blocks">
export type BlockType = Tables<"block_types">
export type Template = Tables<"templates">
export type TemplatePage = Tables<"template_pages">
export type Sector = Tables<"sectors">
export type BlockEditProposal = Tables<"block_edit_proposals">

// IA y difusión
export type AIGeneration = Tables<"ai_generations">
export type SocialPost = Tables<"social_posts">

// Enums
export type OrderStatus = Enums<"order_status">
export type ProductCondition = Enums<"product_condition">
export type SellerStatus = Enums<"seller_status">
export type SellerJoinMode = Enums<"seller_join_mode">
export type CommissionStatus = Enums<"commission_status">
export type SubscriptionStatus = Enums<"subscription_status">
export type PageStatus = Enums<"page_status">
export type SocialProvider = Enums<"social_provider">
export type SocialPostStatus = Enums<"social_post_status">
export type BlockProposalStatus = Enums<"block_proposal_status">
export type AIGenerationKind = Enums<"ai_generation_kind">
