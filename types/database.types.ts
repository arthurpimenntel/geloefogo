// types/database.types.ts

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          parent_id: string | null
          image_url: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          parent_id?: string | null
          image_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          parent_id?: string | null
          image_url?: string | null
          active?: boolean
          updated_at?: string
        }
      }

      products: {
        Row: {
          id: string
          slug: string
          sku: string
          name: string
          description: string
          category_id: string
          sale_price: number
          compare_price: number | null
          cost_price: number
          stock: number
          images: string[]
          video_url: string | null
          intensity: 'suave' | 'medio' | 'forte' | 'muito_forte' | null
          brand: string | null
          origin_country: string | null
          tags: string[]
          harmonization: {
            drink: string
            occasion: string
            notes: string
          } | null
          average_rating: number | null
          review_count: number | null
          active: boolean
          attributes: Array<{ label: string; value: string }>
          supplier_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          sku: string
          name: string
          description: string
          category_id: string
          sale_price: number
          compare_price?: number | null
          cost_price: number
          stock?: number
          images?: string[]
          video_url?: string | null
          intensity?: 'suave' | 'medio' | 'forte' | 'muito_forte' | null
          brand?: string | null
          origin_country?: string | null
          tags?: string[]
          harmonization?: {
            drink: string
            occasion: string
            notes: string
          } | null
          average_rating?: number | null
          review_count?: number | null
          active?: boolean
          attributes?: Array<{ label: string; value: string }>
          supplier_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          sku?: string
          name?: string
          description?: string
          category_id?: string
          sale_price?: number
          compare_price?: number | null
          cost_price?: number
          stock?: number
          images?: string[]
          video_url?: string | null
          intensity?: 'suave' | 'medio' | 'forte' | 'muito_forte' | null
          brand?: string | null
          origin_country?: string | null
          tags?: string[]
          harmonization?: {
            drink: string
            occasion: string
            notes: string
          } | null
          average_rating?: number | null
          review_count?: number | null
          active?: boolean
          attributes?: Array<{ label: string; value: string }>
          supplier_id?: string | null
          updated_at?: string
        }
      }

      orders: {
        Row: {
          id: string
          user_id: string
          status:
            | 'aguardando_pagamento'
            | 'pago'
            | 'processando'
            | 'enviado'
            | 'entregue'
            | 'devolvido'
            | 'cancelado'
          subtotal: number
          shipping_cost: number
          discount: number
          total: number
          shipping_address: {
            name: string
            street: string
            number: string
            complement?: string
            district: string
            city: string
            state: string
            zipCode: string
          }
          tracking_code: string | null
          tracking_events: Array<{
            date: string
            location: string
            description: string
            status: string
          }> | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?:
            | 'aguardando_pagamento'
            | 'pago'
            | 'processando'
            | 'enviado'
            | 'entregue'
            | 'devolvido'
            | 'cancelado'
          subtotal: number
          shipping_cost?: number
          discount?: number
          total: number
          shipping_address: {
            name: string
            street: string
            number: string
            complement?: string
            district: string
            city: string
            state: string
            zipCode: string
          }
          tracking_code?: string | null
          tracking_events?: Array<{
            date: string
            location: string
            description: string
            status: string
          }> | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?:
            | 'aguardando_pagamento'
            | 'pago'
            | 'processando'
            | 'enviado'
            | 'entregue'
            | 'devolvido'
            | 'cancelado'
          subtotal?: number
          shipping_cost?: number
          discount?: number
          total?: number
          shipping_address?: {
            name: string
            street: string
            number: string
            complement?: string
            district: string
            city: string
            state: string
            zipCode: string
          }
          tracking_code?: string | null
          tracking_events?: Array<{
            date: string
            location: string
            description: string
            status: string
          }> | null
          notes?: string | null
          updated_at?: string
        }
      }

      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          name: string
          quantity: number
          unit_price: number
          image: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          name: string
          quantity: number
          unit_price: number
          image?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          name?: string
          quantity?: number
          unit_price?: number
          image?: string | null
        }
      }

      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: 'super_admin' | 'manager' | 'support' | 'customer'
          cpf: string | null
          birth_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'super_admin' | 'manager' | 'support' | 'customer'
          cpf?: string | null
          birth_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'super_admin' | 'manager' | 'support' | 'customer'
          cpf?: string | null
          birth_date?: string | null
          updated_at?: string
        }
      }

      payments: {
        Row: {
          id: string
          order_id: string
          method: 'pix' | 'boleto' | 'card'
          status: 'pendente' | 'aprovado' | 'cancelado' | 'expirado'
          amount: number
          gateway_id: string | null
          gateway_data: Record<string, unknown> | null
          pix_code: string | null
          pix_qr_code: string | null
          boleto_url: string | null
          boleto_barcode: string | null
          expires_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          method: 'pix' | 'boleto' | 'card'
          status?: 'pendente' | 'aprovado' | 'cancelado' | 'expirado'
          amount: number
          gateway_id?: string | null
          gateway_data?: Record<string, unknown> | null
          pix_code?: string | null
          pix_qr_code?: string | null
          boleto_url?: string | null
          boleto_barcode?: string | null
          expires_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          method?: 'pix' | 'boleto' | 'card'
          status?: 'pendente' | 'aprovado' | 'cancelado' | 'expirado'
          amount?: number
          gateway_id?: string | null
          gateway_data?: Record<string, unknown> | null
          pix_code?: string | null
          pix_qr_code?: string | null
          boleto_url?: string | null
          boleto_barcode?: string | null
          expires_at?: string | null
          paid_at?: string | null
          updated_at?: string
        }
      }

      suppliers: {
        Row: {
          id: string
          name: string
          slug: string
          api_url: string | null
          api_key: string | null
          api_type: 'rest' | 'soap' | 'graphql' | 'csv' | null
          active: boolean
          sync_interval_minutes: number
          last_sync_at: string | null
          markup_percentage: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          api_url?: string | null
          api_key?: string | null
          api_type?: 'rest' | 'soap' | 'graphql' | 'csv' | null
          active?: boolean
          sync_interval_minutes?: number
          last_sync_at?: string | null
          markup_percentage?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          api_url?: string | null
          api_key?: string | null
          api_type?: 'rest' | 'soap' | 'graphql' | 'csv' | null
          active?: boolean
          sync_interval_minutes?: number
          last_sync_at?: string | null
          markup_percentage?: number
          notes?: string | null
          updated_at?: string
        }
      }

      supplier_sync_logs: {
        Row: {
          id: string
          supplier_id: string
          started_at: string
          finished_at: string | null
          status: 'running' | 'success' | 'error'
          products_synced: number
          products_created: number
          products_updated: number
          products_deactivated: number
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          started_at?: string
          finished_at?: string | null
          status?: 'running' | 'success' | 'error'
          products_synced?: number
          products_created?: number
          products_updated?: number
          products_deactivated?: number
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          started_at?: string
          finished_at?: string | null
          status?: 'running' | 'success' | 'error'
          products_synced?: number
          products_created?: number
          products_updated?: number
          products_deactivated?: number
          error_message?: string | null
        }
      }

      supplier_orders: {
        Row: {
          id: string
          supplier_id: string
          order_id: string
          supplier_order_id: string | null
          status: 'pendente' | 'confirmado' | 'enviado' | 'cancelado' | 'erro'
          items: Array<{
            product_id: string
            supplier_sku: string
            quantity: number
            unit_cost: number
          }>
          total_cost: number
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          order_id: string
          supplier_order_id?: string | null
          status?: 'pendente' | 'confirmado' | 'enviado' | 'cancelado' | 'erro'
          items: Array<{
            product_id: string
            supplier_sku: string
            quantity: number
            unit_cost: number
          }>
          total_cost: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          order_id?: string
          supplier_order_id?: string | null
          status?: 'pendente' | 'confirmado' | 'enviado' | 'cancelado' | 'erro'
          items?: Array<{
            product_id: string
            supplier_sku: string
            quantity: number
            unit_cost: number
          }>
          total_cost?: number
          error_message?: string | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      order_status:
        | 'aguardando_pagamento'
        | 'pago'
        | 'processando'
        | 'enviado'
        | 'entregue'
        | 'devolvido'
        | 'cancelado'
      payment_method: 'pix' | 'boleto' | 'card'
      payment_status: 'pendente' | 'aprovado' | 'cancelado' | 'expirado'
      product_intensity: 'suave' | 'medio' | 'forte' | 'muito_forte'
      user_role: 'super_admin' | 'manager' | 'support' | 'customer'
    }
  }
}

// Helpers de conveniência
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]