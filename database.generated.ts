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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_number: string
          appointment_time: string | null
          appointment_type: string
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          engineer_id: string
          id: string
          inspection_id: string
          location_address: string | null
          location_city: string | null
          location_notes: string | null
          location_province: string | null
          notes: string | null
          request_id: string
          reschedule_count: number | null
          reschedule_reason: string | null
          rescheduled_from_date: string | null
          special_instructions: string | null
          status: string
          updated_at: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_registration: string | null
          vehicle_year: number | null
        }
        Insert: {
          appointment_date: string
          appointment_number: string
          appointment_time?: string | null
          appointment_type: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          engineer_id: string
          id?: string
          inspection_id: string
          location_address?: string | null
          location_city?: string | null
          location_notes?: string | null
          location_province?: string | null
          notes?: string | null
          request_id: string
          reschedule_count?: number | null
          reschedule_reason?: string | null
          rescheduled_from_date?: string | null
          special_instructions?: string | null
          status?: string
          updated_at?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_registration?: string | null
          vehicle_year?: number | null
        }
        Update: {
          appointment_date?: string
          appointment_number?: string
          appointment_time?: string | null
          appointment_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          engineer_id?: string
          id?: string
          inspection_id?: string
          location_address?: string | null
          location_city?: string | null
          location_notes?: string | null
          location_province?: string | null
          notes?: string | null
          request_id?: string
          reschedule_count?: number | null
          reschedule_reason?: string | null
          rescheduled_from_date?: string | null
          special_instructions?: string | null
          status?: string
          updated_at?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_registration?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_engineer_id_fkey"
            columns: ["engineer_id"]
            isOneToOne: false
            referencedRelation: "engineers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_360_exterior: {
        Row: {
          assessment_id: string
          created_at: string | null
          front_left_photo_url: string | null
          front_photo_url: string | null
          front_right_photo_url: string | null
          id: string
          left_photo_url: string | null
          overall_condition: string | null
          rear_left_photo_url: string | null
          rear_photo_url: string | null
          rear_right_photo_url: string | null
          right_photo_url: string | null
          updated_at: string | null
          vehicle_color: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          front_left_photo_url?: string | null
          front_photo_url?: string | null
          front_right_photo_url?: string | null
          id?: string
          left_photo_url?: string | null
          overall_condition?: string | null
          rear_left_photo_url?: string | null
          rear_photo_url?: string | null
          rear_right_photo_url?: string | null
          right_photo_url?: string | null
          updated_at?: string | null
          vehicle_color?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          front_left_photo_url?: string | null
          front_photo_url?: string | null
          front_right_photo_url?: string | null
          id?: string
          left_photo_url?: string | null
          overall_condition?: string | null
          rear_left_photo_url?: string | null
          rear_photo_url?: string | null
          rear_right_photo_url?: string | null
          right_photo_url?: string | null
          updated_at?: string | null
          vehicle_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_360_exterior_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_accessories: {
        Row: {
          accessory_type: string
          assessment_id: string
          condition: string | null
          created_at: string | null
          custom_name: string | null
          id: string
          notes: string | null
          photo_url: string | null
          updated_at: string | null
        }
        Insert: {
          accessory_type: string
          assessment_id: string
          condition?: string | null
          created_at?: string | null
          custom_name?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          accessory_type?: string
          assessment_id?: string
          condition?: string | null
          created_at?: string | null
          custom_name?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_accessories_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_additionals: {
        Row: {
          additionals_letter_url: string | null
          alt_markup_percentage: number
          assessment_id: string
          created_at: string | null
          excluded_line_item_ids: Json
          id: string
          labour_rate: number
          line_items: Json | null
          oem_markup_percentage: number
          outwork_markup_percentage: number
          paint_rate: number
          repairer_id: string | null
          second_hand_markup_percentage: number
          subtotal_approved: number | null
          total_approved: number | null
          updated_at: string | null
          vat_amount_approved: number | null
          vat_percentage: number
        }
        Insert: {
          additionals_letter_url?: string | null
          alt_markup_percentage?: number
          assessment_id: string
          created_at?: string | null
          excluded_line_item_ids?: Json
          id?: string
          labour_rate?: number
          line_items?: Json | null
          oem_markup_percentage?: number
          outwork_markup_percentage?: number
          paint_rate?: number
          repairer_id?: string | null
          second_hand_markup_percentage?: number
          subtotal_approved?: number | null
          total_approved?: number | null
          updated_at?: string | null
          vat_amount_approved?: number | null
          vat_percentage?: number
        }
        Update: {
          additionals_letter_url?: string | null
          alt_markup_percentage?: number
          assessment_id?: string
          created_at?: string | null
          excluded_line_item_ids?: Json
          id?: string
          labour_rate?: number
          line_items?: Json | null
          oem_markup_percentage?: number
          outwork_markup_percentage?: number
          paint_rate?: number
          repairer_id?: string | null
          second_hand_markup_percentage?: number
          subtotal_approved?: number | null
          total_approved?: number | null
          updated_at?: string | null
          vat_amount_approved?: number | null
          vat_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_additionals_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_additionals_repairer_id_fkey"
            columns: ["repairer_id"]
            isOneToOne: false
            referencedRelation: "repairers"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_additionals_photos: {
        Row: {
          additionals_id: string
          created_at: string | null
          display_order: number | null
          id: string
          label: string | null
          photo_path: string
          photo_url: string
          updated_at: string | null
        }
        Insert: {
          additionals_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          label?: string | null
          photo_path: string
          photo_url: string
          updated_at?: string | null
        }
        Update: {
          additionals_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          label?: string | null
          photo_path?: string
          photo_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_additionals_photos_additionals_id_fkey"
            columns: ["additionals_id"]
            isOneToOne: false
            referencedRelation: "assessment_additionals"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_damage: {
        Row: {
          affected_panels: Json | null
          assessment_id: string
          created_at: string | null
          damage_area: string
          damage_description: string | null
          damage_type: string
          estimated_repair_duration_days: number | null
          id: string
          location_description: string | null
          matches_description: boolean | null
          mismatch_notes: string | null
          photos: Json | null
          repair_method: string | null
          severity: string | null
          updated_at: string | null
        }
        Insert: {
          affected_panels?: Json | null
          assessment_id: string
          created_at?: string | null
          damage_area: string
          damage_description?: string | null
          damage_type: string
          estimated_repair_duration_days?: number | null
          id?: string
          location_description?: string | null
          matches_description?: boolean | null
          mismatch_notes?: string | null
          photos?: Json | null
          repair_method?: string | null
          severity?: string | null
          updated_at?: string | null
        }
        Update: {
          affected_panels?: Json | null
          assessment_id?: string
          created_at?: string | null
          damage_area?: string
          damage_description?: string | null
          damage_type?: string
          estimated_repair_duration_days?: number | null
          id?: string
          location_description?: string | null
          matches_description?: boolean | null
          mismatch_notes?: string | null
          photos?: Json | null
          repair_method?: string | null
          severity?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_damage_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_damage_photos: {
        Row: {
          assessment_id: string
          created_at: string
          display_order: number | null
          id: string
          label: string | null
          panel: string | null
          photo_path: string
          photo_url: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          label?: string | null
          panel?: string | null
          photo_path: string
          photo_url: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          label?: string | null
          panel?: string | null
          photo_path?: string
          photo_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_damage_photos_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_estimates: {
        Row: {
          alt_markup_percentage: number | null
          assessment_id: string
          assessment_result:
            | Database["public"]["Enums"]["assessment_result_type"]
            | null
          created_at: string | null
          currency: string | null
          id: string
          labour_rate: number | null
          line_items: Json | null
          notes: string | null
          oem_markup_percentage: number | null
          outwork_markup_percentage: number | null
          paint_rate: number | null
          repairer_id: string | null
          second_hand_markup_percentage: number | null
          subtotal: number | null
          sundries_amount: number
          sundries_percentage: number
          total: number | null
          updated_at: string | null
          vat_amount: number | null
          vat_percentage: number | null
        }
        Insert: {
          alt_markup_percentage?: number | null
          assessment_id: string
          assessment_result?:
            | Database["public"]["Enums"]["assessment_result_type"]
            | null
          created_at?: string | null
          currency?: string | null
          id?: string
          labour_rate?: number | null
          line_items?: Json | null
          notes?: string | null
          oem_markup_percentage?: number | null
          outwork_markup_percentage?: number | null
          paint_rate?: number | null
          repairer_id?: string | null
          second_hand_markup_percentage?: number | null
          subtotal?: number | null
          sundries_amount?: number
          sundries_percentage?: number
          total?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_percentage?: number | null
        }
        Update: {
          alt_markup_percentage?: number | null
          assessment_id?: string
          assessment_result?:
            | Database["public"]["Enums"]["assessment_result_type"]
            | null
          created_at?: string | null
          currency?: string | null
          id?: string
          labour_rate?: number | null
          line_items?: Json | null
          notes?: string | null
          oem_markup_percentage?: number | null
          outwork_markup_percentage?: number | null
          paint_rate?: number | null
          repairer_id?: string | null
          second_hand_markup_percentage?: number | null
          subtotal?: number | null
          sundries_amount?: number
          sundries_percentage?: number
          total?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_estimates_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_estimates_repairer_id_fkey"
            columns: ["repairer_id"]
            isOneToOne: false
            referencedRelation: "repairers"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_exterior_360_photos: {
        Row: {
          assessment_id: string
          created_at: string
          display_order: number | null
          id: string
          label: string | null
          photo_path: string
          photo_url: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          label?: string | null
          photo_path: string
          photo_url: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          label?: string | null
          photo_path?: string
          photo_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_exterior_360_photos_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_frc: {
        Row: {
          actual_additionals_labour: number | null
          actual_additionals_markup: number | null
          actual_additionals_outwork_nett: number | null
          actual_additionals_paint: number | null
          actual_additionals_parts_nett: number | null
          actual_additionals_subtotal: number | null
          actual_estimate_labour: number | null
          actual_estimate_markup: number | null
          actual_estimate_outwork_nett: number | null
          actual_estimate_paint: number | null
          actual_estimate_parts_nett: number | null
          actual_estimate_subtotal: number | null
          actual_labour_total: number
          actual_outwork_total: number
          actual_paint_total: number
          actual_parts_total: number
          actual_subtotal: number
          actual_total: number
          actual_vat_amount: number
          assessment_id: string
          completed_at: string | null
          created_at: string
          frc_report_url: string | null
          id: string
          last_merge_at: string | null
          line_items: Json
          line_items_version: number | null
          needs_sync: boolean | null
          quoted_additionals_labour: number | null
          quoted_additionals_markup: number | null
          quoted_additionals_outwork_nett: number | null
          quoted_additionals_paint: number | null
          quoted_additionals_parts_nett: number | null
          quoted_additionals_subtotal: number | null
          quoted_estimate_labour: number | null
          quoted_estimate_markup: number | null
          quoted_estimate_outwork_nett: number | null
          quoted_estimate_paint: number | null
          quoted_estimate_parts_nett: number | null
          quoted_estimate_subtotal: number | null
          quoted_labour_total: number
          quoted_outwork_total: number
          quoted_paint_total: number
          quoted_parts_total: number
          quoted_subtotal: number
          quoted_total: number
          quoted_vat_amount: number
          sign_off_notes: string | null
          signed_off_at: string | null
          signed_off_by_email: string | null
          signed_off_by_name: string | null
          signed_off_by_role: string | null
          started_at: string | null
          status: string
          updated_at: string
          vat_percentage: number
        }
        Insert: {
          actual_additionals_labour?: number | null
          actual_additionals_markup?: number | null
          actual_additionals_outwork_nett?: number | null
          actual_additionals_paint?: number | null
          actual_additionals_parts_nett?: number | null
          actual_additionals_subtotal?: number | null
          actual_estimate_labour?: number | null
          actual_estimate_markup?: number | null
          actual_estimate_outwork_nett?: number | null
          actual_estimate_paint?: number | null
          actual_estimate_parts_nett?: number | null
          actual_estimate_subtotal?: number | null
          actual_labour_total?: number
          actual_outwork_total?: number
          actual_paint_total?: number
          actual_parts_total?: number
          actual_subtotal?: number
          actual_total?: number
          actual_vat_amount?: number
          assessment_id: string
          completed_at?: string | null
          created_at?: string
          frc_report_url?: string | null
          id?: string
          last_merge_at?: string | null
          line_items?: Json
          line_items_version?: number | null
          needs_sync?: boolean | null
          quoted_additionals_labour?: number | null
          quoted_additionals_markup?: number | null
          quoted_additionals_outwork_nett?: number | null
          quoted_additionals_paint?: number | null
          quoted_additionals_parts_nett?: number | null
          quoted_additionals_subtotal?: number | null
          quoted_estimate_labour?: number | null
          quoted_estimate_markup?: number | null
          quoted_estimate_outwork_nett?: number | null
          quoted_estimate_paint?: number | null
          quoted_estimate_parts_nett?: number | null
          quoted_estimate_subtotal?: number | null
          quoted_labour_total?: number
          quoted_outwork_total?: number
          quoted_paint_total?: number
          quoted_parts_total?: number
          quoted_subtotal?: number
          quoted_total?: number
          quoted_vat_amount?: number
          sign_off_notes?: string | null
          signed_off_at?: string | null
          signed_off_by_email?: string | null
          signed_off_by_name?: string | null
          signed_off_by_role?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          vat_percentage?: number
        }
        Update: {
          actual_additionals_labour?: number | null
          actual_additionals_markup?: number | null
          actual_additionals_outwork_nett?: number | null
          actual_additionals_paint?: number | null
          actual_additionals_parts_nett?: number | null
          actual_additionals_subtotal?: number | null
          actual_estimate_labour?: number | null
          actual_estimate_markup?: number | null
          actual_estimate_outwork_nett?: number | null
          actual_estimate_paint?: number | null
          actual_estimate_parts_nett?: number | null
          actual_estimate_subtotal?: number | null
          actual_labour_total?: number
          actual_outwork_total?: number
          actual_paint_total?: number
          actual_parts_total?: number
          actual_subtotal?: number
          actual_total?: number
          actual_vat_amount?: number
          assessment_id?: string
          completed_at?: string | null
          created_at?: string
          frc_report_url?: string | null
          id?: string
          last_merge_at?: string | null
          line_items?: Json
          line_items_version?: number | null
          needs_sync?: boolean | null
          quoted_additionals_labour?: number | null
          quoted_additionals_markup?: number | null
          quoted_additionals_outwork_nett?: number | null
          quoted_additionals_paint?: number | null
          quoted_additionals_parts_nett?: number | null
          quoted_additionals_subtotal?: number | null
          quoted_estimate_labour?: number | null
          quoted_estimate_markup?: number | null
          quoted_estimate_outwork_nett?: number | null
          quoted_estimate_paint?: number | null
          quoted_estimate_parts_nett?: number | null
          quoted_estimate_subtotal?: number | null
          quoted_labour_total?: number
          quoted_outwork_total?: number
          quoted_paint_total?: number
          quoted_parts_total?: number
          quoted_subtotal?: number
          quoted_total?: number
          quoted_vat_amount?: number
          sign_off_notes?: string | null
          signed_off_at?: string | null
          signed_off_by_email?: string | null
          signed_off_by_name?: string | null
          signed_off_by_role?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          vat_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_frc_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_frc_documents: {
        Row: {
          created_at: string
          document_path: string
          document_type: string
          document_url: string
          file_size_bytes: number | null
          frc_id: string
          id: string
          label: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_path: string
          document_type?: string
          document_url: string
          file_size_bytes?: number | null
          frc_id: string
          id?: string
          label?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_path?: string
          document_type?: string
          document_url?: string
          file_size_bytes?: number | null
          frc_id?: string
          id?: string
          label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_frc_documents_frc_id_fkey"
            columns: ["frc_id"]
            isOneToOne: false
            referencedRelation: "assessment_frc"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_interior_mechanical: {
        Row: {
          assessment_id: string
          battery_photo_url: string | null
          brakes: string | null
          coolant_photo_url: string | null
          created_at: string | null
          dashboard_photo_url: string | null
          engine_bay_photo_url: string | null
          gear_lever_photo_url: string | null
          handbrake: string | null
          id: string
          interior_condition: string | null
          interior_front_photo_url: string | null
          interior_rear_photo_url: string | null
          mileage_photo_url: string | null
          mileage_reading: number | null
          oil_level_photo_url: string | null
          srs_system: string | null
          steering: string | null
          transmission_type: string | null
          updated_at: string | null
          vehicle_has_power: boolean | null
        }
        Insert: {
          assessment_id: string
          battery_photo_url?: string | null
          brakes?: string | null
          coolant_photo_url?: string | null
          created_at?: string | null
          dashboard_photo_url?: string | null
          engine_bay_photo_url?: string | null
          gear_lever_photo_url?: string | null
          handbrake?: string | null
          id?: string
          interior_condition?: string | null
          interior_front_photo_url?: string | null
          interior_rear_photo_url?: string | null
          mileage_photo_url?: string | null
          mileage_reading?: number | null
          oil_level_photo_url?: string | null
          srs_system?: string | null
          steering?: string | null
          transmission_type?: string | null
          updated_at?: string | null
          vehicle_has_power?: boolean | null
        }
        Update: {
          assessment_id?: string
          battery_photo_url?: string | null
          brakes?: string | null
          coolant_photo_url?: string | null
          created_at?: string | null
          dashboard_photo_url?: string | null
          engine_bay_photo_url?: string | null
          gear_lever_photo_url?: string | null
          handbrake?: string | null
          id?: string
          interior_condition?: string | null
          interior_front_photo_url?: string | null
          interior_rear_photo_url?: string | null
          mileage_photo_url?: string | null
          mileage_reading?: number | null
          oil_level_photo_url?: string | null
          srs_system?: string | null
          steering?: string | null
          transmission_type?: string | null
          updated_at?: string | null
          vehicle_has_power?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_interior_mechanical_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_interior_photos: {
        Row: {
          assessment_id: string
          created_at: string
          display_order: number | null
          id: string
          label: string | null
          photo_path: string
          photo_url: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          label?: string | null
          photo_path: string
          photo_url: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          label?: string | null
          photo_path?: string
          photo_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_interior_photos_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_notes: {
        Row: {
          assessment_id: string
          created_at: string
          created_by: string | null
          edited_at: string | null
          edited_by: string | null
          id: string
          is_edited: boolean | null
          note_text: string
          note_title: string | null
          note_type: string
          source_tab: string | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          created_by?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          is_edited?: boolean | null
          note_text: string
          note_title?: string | null
          note_type?: string
          source_tab?: string | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          created_by?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          is_edited?: boolean | null
          note_text?: string
          note_title?: string | null
          note_type?: string
          source_tab?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_notes_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_tyre_photos: {
        Row: {
          assessment_id: string
          created_at: string | null
          display_order: number | null
          id: string
          label: string | null
          photo_path: string
          photo_url: string
          tyre_id: string
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          label?: string | null
          photo_path: string
          photo_url: string
          tyre_id: string
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          label?: string | null
          photo_path?: string
          photo_url?: string
          tyre_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_tyre_photos_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_tyre_photos_tyre_id_fkey"
            columns: ["tyre_id"]
            isOneToOne: false
            referencedRelation: "assessment_tyres"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_tyres: {
        Row: {
          assessment_id: string
          condition: string | null
          created_at: string | null
          id: string
          load_index: string | null
          notes: string | null
          position: string
          position_label: string | null
          speed_rating: string | null
          tread_depth_mm: number | null
          tyre_make: string | null
          tyre_size: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          condition?: string | null
          created_at?: string | null
          id?: string
          load_index?: string | null
          notes?: string | null
          position: string
          position_label?: string | null
          speed_rating?: string | null
          tread_depth_mm?: number | null
          tyre_make?: string | null
          tyre_size?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          condition?: string | null
          created_at?: string | null
          id?: string
          load_index?: string | null
          notes?: string | null
          position?: string
          position_label?: string | null
          speed_rating?: string | null
          tread_depth_mm?: number | null
          tyre_make?: string | null
          tyre_size?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_tyres_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_vehicle_identification: {
        Row: {
          assessment_id: string
          created_at: string | null
          driver_license_number: string | null
          driver_license_photo_url: string | null
          engine_number: string | null
          engine_number_photo_url: string | null
          id: string
          license_disc_expiry: string | null
          license_disc_photo_url: string | null
          registration_number: string | null
          registration_photo_url: string | null
          updated_at: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          vin_number: string | null
          vin_photo_url: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          driver_license_number?: string | null
          driver_license_photo_url?: string | null
          engine_number?: string | null
          engine_number_photo_url?: string | null
          id?: string
          license_disc_expiry?: string | null
          license_disc_photo_url?: string | null
          registration_number?: string | null
          registration_photo_url?: string | null
          updated_at?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vin_number?: string | null
          vin_photo_url?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          driver_license_number?: string | null
          driver_license_photo_url?: string | null
          engine_number?: string | null
          engine_number_photo_url?: string | null
          id?: string
          license_disc_expiry?: string | null
          license_disc_photo_url?: string | null
          registration_number?: string | null
          registration_photo_url?: string | null
          updated_at?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vin_number?: string | null
          vin_photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_vehicle_identification_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_vehicle_values: {
        Row: {
          assessment_id: string
          borderline_writeoff_market: number | null
          borderline_writeoff_retail: number | null
          borderline_writeoff_trade: number | null
          condition_adjustment_value: number | null
          created_at: string | null
          depreciation_percentage: number | null
          extras: Json | null
          id: string
          market_adjusted_value: number | null
          market_extras_total: number | null
          market_total_adjusted_value: number | null
          market_value: number | null
          new_list_price: number | null
          remarks: string | null
          retail_adjusted_value: number | null
          retail_extras_total: number | null
          retail_total_adjusted_value: number | null
          retail_value: number | null
          salvage_market: number | null
          salvage_retail: number | null
          salvage_trade: number | null
          service_history_status: string | null
          sourced_code: string | null
          sourced_date: string | null
          sourced_from: string | null
          total_writeoff_market: number | null
          total_writeoff_retail: number | null
          total_writeoff_trade: number | null
          trade_adjusted_value: number | null
          trade_extras_total: number | null
          trade_total_adjusted_value: number | null
          trade_value: number | null
          updated_at: string | null
          valuation_adjustment: number | null
          valuation_adjustment_percentage: number | null
          valuation_pdf_path: string | null
          valuation_pdf_url: string | null
          warranty_end_date: string | null
          warranty_expiry_mileage: string | null
          warranty_notes: string | null
          warranty_period_years: number | null
          warranty_start_date: string | null
          warranty_status: string | null
        }
        Insert: {
          assessment_id: string
          borderline_writeoff_market?: number | null
          borderline_writeoff_retail?: number | null
          borderline_writeoff_trade?: number | null
          condition_adjustment_value?: number | null
          created_at?: string | null
          depreciation_percentage?: number | null
          extras?: Json | null
          id?: string
          market_adjusted_value?: number | null
          market_extras_total?: number | null
          market_total_adjusted_value?: number | null
          market_value?: number | null
          new_list_price?: number | null
          remarks?: string | null
          retail_adjusted_value?: number | null
          retail_extras_total?: number | null
          retail_total_adjusted_value?: number | null
          retail_value?: number | null
          salvage_market?: number | null
          salvage_retail?: number | null
          salvage_trade?: number | null
          service_history_status?: string | null
          sourced_code?: string | null
          sourced_date?: string | null
          sourced_from?: string | null
          total_writeoff_market?: number | null
          total_writeoff_retail?: number | null
          total_writeoff_trade?: number | null
          trade_adjusted_value?: number | null
          trade_extras_total?: number | null
          trade_total_adjusted_value?: number | null
          trade_value?: number | null
          updated_at?: string | null
          valuation_adjustment?: number | null
          valuation_adjustment_percentage?: number | null
          valuation_pdf_path?: string | null
          valuation_pdf_url?: string | null
          warranty_end_date?: string | null
          warranty_expiry_mileage?: string | null
          warranty_notes?: string | null
          warranty_period_years?: number | null
          warranty_start_date?: string | null
          warranty_status?: string | null
        }
        Update: {
          assessment_id?: string
          borderline_writeoff_market?: number | null
          borderline_writeoff_retail?: number | null
          borderline_writeoff_trade?: number | null
          condition_adjustment_value?: number | null
          created_at?: string | null
          depreciation_percentage?: number | null
          extras?: Json | null
          id?: string
          market_adjusted_value?: number | null
          market_extras_total?: number | null
          market_total_adjusted_value?: number | null
          market_value?: number | null
          new_list_price?: number | null
          remarks?: string | null
          retail_adjusted_value?: number | null
          retail_extras_total?: number | null
          retail_total_adjusted_value?: number | null
          retail_value?: number | null
          salvage_market?: number | null
          salvage_retail?: number | null
          salvage_trade?: number | null
          service_history_status?: string | null
          sourced_code?: string | null
          sourced_date?: string | null
          sourced_from?: string | null
          total_writeoff_market?: number | null
          total_writeoff_retail?: number | null
          total_writeoff_trade?: number | null
          trade_adjusted_value?: number | null
          trade_extras_total?: number | null
          trade_total_adjusted_value?: number | null
          trade_value?: number | null
          updated_at?: string | null
          valuation_adjustment?: number | null
          valuation_adjustment_percentage?: number | null
          valuation_pdf_path?: string | null
          valuation_pdf_url?: string | null
          warranty_end_date?: string | null
          warranty_expiry_mileage?: string | null
          warranty_notes?: string | null
          warranty_period_years?: number | null
          warranty_start_date?: string | null
          warranty_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_vehicle_values_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          appointment_id: string | null
          assessment_number: string
          assessor_contact: string | null
          assessor_email: string | null
          assessor_name: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          current_tab: string | null
          documents_generated_at: string | null
          estimate_finalized_at: string | null
          estimate_pdf_path: string | null
          estimate_pdf_url: string | null
          finalized_alt_markup: number | null
          finalized_labour_rate: number | null
          finalized_oem_markup: number | null
          finalized_outwork_markup: number | null
          finalized_paint_rate: number | null
          finalized_second_hand_markup: number | null
          id: string
          inspection_id: string | null
          photos_pdf_path: string | null
          photos_pdf_url: string | null
          photos_zip_path: string | null
          photos_zip_url: string | null
          report_number: string | null
          report_pdf_path: string | null
          report_pdf_url: string | null
          request_id: string
          stage: Database["public"]["Enums"]["assessment_stage"]
          started_at: string | null
          status: string
          submitted_at: string | null
          tabs_completed: Json | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          assessment_number: string
          assessor_contact?: string | null
          assessor_email?: string | null
          assessor_name?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_tab?: string | null
          documents_generated_at?: string | null
          estimate_finalized_at?: string | null
          estimate_pdf_path?: string | null
          estimate_pdf_url?: string | null
          finalized_alt_markup?: number | null
          finalized_labour_rate?: number | null
          finalized_oem_markup?: number | null
          finalized_outwork_markup?: number | null
          finalized_paint_rate?: number | null
          finalized_second_hand_markup?: number | null
          id?: string
          inspection_id?: string | null
          photos_pdf_path?: string | null
          photos_pdf_url?: string | null
          photos_zip_path?: string | null
          photos_zip_url?: string | null
          report_number?: string | null
          report_pdf_path?: string | null
          report_pdf_url?: string | null
          request_id: string
          stage?: Database["public"]["Enums"]["assessment_stage"]
          started_at?: string | null
          status?: string
          submitted_at?: string | null
          tabs_completed?: Json | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          assessment_number?: string
          assessor_contact?: string | null
          assessor_email?: string | null
          assessor_name?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_tab?: string | null
          documents_generated_at?: string | null
          estimate_finalized_at?: string | null
          estimate_pdf_path?: string | null
          estimate_pdf_url?: string | null
          finalized_alt_markup?: number | null
          finalized_labour_rate?: number | null
          finalized_oem_markup?: number | null
          finalized_outwork_markup?: number | null
          finalized_paint_rate?: number | null
          finalized_second_hand_markup?: number | null
          id?: string
          inspection_id?: string | null
          photos_pdf_path?: string | null
          photos_pdf_url?: string | null
          photos_zip_path?: string | null
          photos_zip_url?: string | null
          report_number?: string | null
          report_pdf_path?: string | null
          report_pdf_url?: string | null
          request_id?: string
          stage?: Database["public"]["Enums"]["assessment_stage"]
          started_at?: string | null
          status?: string
          submitted_at?: string | null
          tabs_completed?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          field_name: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          additionals_terms_and_conditions: string | null
          address: string | null
          assessment_terms_and_conditions: string | null
          borderline_writeoff_percentage: number | null
          city: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          estimate_terms_and_conditions: string | null
          frc_terms_and_conditions: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          salvage_percentage: number | null
          total_writeoff_percentage: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          additionals_terms_and_conditions?: string | null
          address?: string | null
          assessment_terms_and_conditions?: string | null
          borderline_writeoff_percentage?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          estimate_terms_and_conditions?: string | null
          frc_terms_and_conditions?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          salvage_percentage?: number | null
          total_writeoff_percentage?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          additionals_terms_and_conditions?: string | null
          address?: string | null
          assessment_terms_and_conditions?: string | null
          borderline_writeoff_percentage?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          estimate_terms_and_conditions?: string | null
          frc_terms_and_conditions?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          salvage_percentage?: number | null
          total_writeoff_percentage?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          additionals_terms_and_conditions: string | null
          assessment_terms_and_conditions: string | null
          city: string | null
          company_name: string
          created_at: string | null
          email: string | null
          estimate_terms_and_conditions: string | null
          fax: string | null
          frc_terms_and_conditions: string | null
          id: string
          logo_url: string | null
          phone: string | null
          po_box: string | null
          postal_code: string | null
          province: string | null
          sundries_percentage: number
          updated_at: string | null
          website: string | null
        }
        Insert: {
          additionals_terms_and_conditions?: string | null
          assessment_terms_and_conditions?: string | null
          city?: string | null
          company_name?: string
          created_at?: string | null
          email?: string | null
          estimate_terms_and_conditions?: string | null
          fax?: string | null
          frc_terms_and_conditions?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          po_box?: string | null
          postal_code?: string | null
          province?: string | null
          sundries_percentage?: number
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          additionals_terms_and_conditions?: string | null
          assessment_terms_and_conditions?: string | null
          city?: string | null
          company_name?: string
          created_at?: string | null
          email?: string | null
          estimate_terms_and_conditions?: string | null
          fax?: string | null
          frc_terms_and_conditions?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          po_box?: string | null
          postal_code?: string | null
          province?: string | null
          sundries_percentage?: number
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      engineers: {
        Row: {
          auth_user_id: string | null
          company_name: string | null
          company_type: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          province: string | null
          specialization: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          province?: string | null
          specialization?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          province?: string | null
          specialization?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      estimate_photos: {
        Row: {
          created_at: string
          display_order: number | null
          estimate_id: string
          id: string
          label: string | null
          photo_path: string
          photo_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          estimate_id: string
          id?: string
          label?: string | null
          photo_path: string
          photo_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          estimate_id?: string
          id?: string
          label?: string | null
          photo_path?: string
          photo_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_photos_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "assessment_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          assigned_engineer_id: string | null
          claim_number: string | null
          client_id: string
          created_at: string | null
          id: string
          inspection_location: string | null
          inspection_number: string
          notes: string | null
          request_id: string
          request_number: string
          scheduled_date: string | null
          status: string
          type: string
          updated_at: string | null
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_mileage: number | null
          vehicle_model: string | null
          vehicle_province: string | null
          vehicle_registration: string | null
          vehicle_vin: string | null
          vehicle_year: number | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          assigned_engineer_id?: string | null
          claim_number?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          inspection_location?: string | null
          inspection_number: string
          notes?: string | null
          request_id: string
          request_number: string
          scheduled_date?: string | null
          status?: string
          type: string
          updated_at?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_mileage?: number | null
          vehicle_model?: string | null
          vehicle_province?: string | null
          vehicle_registration?: string | null
          vehicle_vin?: string | null
          vehicle_year?: number | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          assigned_engineer_id?: string | null
          claim_number?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          inspection_location?: string | null
          inspection_number?: string
          notes?: string | null
          request_id?: string
          request_number?: string
          scheduled_date?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_mileage?: number | null
          vehicle_model?: string | null
          vehicle_province?: string | null
          vehicle_registration?: string | null
          vehicle_vin?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_assigned_engineer_id_fkey"
            columns: ["assigned_engineer_id"]
            isOneToOne: false
            referencedRelation: "engineers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_incident_estimate_photos: {
        Row: {
          created_at: string | null
          display_order: number | null
          estimate_id: string
          id: string
          label: string | null
          photo_path: string
          photo_url: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          estimate_id: string
          id?: string
          label?: string | null
          photo_path: string
          photo_url: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          estimate_id?: string
          id?: string
          label?: string | null
          photo_path?: string
          photo_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_incident_estimate_photos_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "pre_incident_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_incident_estimates: {
        Row: {
          alt_markup_percentage: number | null
          assessment_id: string
          created_at: string | null
          currency: string | null
          id: string
          labour_rate: number | null
          line_items: Json | null
          notes: string | null
          oem_markup_percentage: number | null
          outwork_markup_percentage: number | null
          paint_rate: number | null
          second_hand_markup_percentage: number | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
          vat_amount: number | null
          vat_percentage: number | null
        }
        Insert: {
          alt_markup_percentage?: number | null
          assessment_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          labour_rate?: number | null
          line_items?: Json | null
          notes?: string | null
          oem_markup_percentage?: number | null
          outwork_markup_percentage?: number | null
          paint_rate?: number | null
          second_hand_markup_percentage?: number | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_percentage?: number | null
        }
        Update: {
          alt_markup_percentage?: number | null
          assessment_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          labour_rate?: number | null
          line_items?: Json | null
          notes?: string | null
          oem_markup_percentage?: number | null
          outwork_markup_percentage?: number | null
          paint_rate?: number | null
          second_hand_markup_percentage?: number | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_incident_estimates_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      repairers: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          created_at: string | null
          default_alt_markup_percentage: number | null
          default_labour_rate: number | null
          default_oem_markup_percentage: number | null
          default_outwork_markup_percentage: number | null
          default_paint_rate: number | null
          default_second_hand_markup_percentage: number | null
          default_vat_percentage: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          default_alt_markup_percentage?: number | null
          default_labour_rate?: number | null
          default_oem_markup_percentage?: number | null
          default_outwork_markup_percentage?: number | null
          default_paint_rate?: number | null
          default_second_hand_markup_percentage?: number | null
          default_vat_percentage?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          default_alt_markup_percentage?: number | null
          default_labour_rate?: number | null
          default_oem_markup_percentage?: number | null
          default_outwork_markup_percentage?: number | null
          default_paint_rate?: number | null
          default_second_hand_markup_percentage?: number | null
          default_vat_percentage?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      request_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          request_id: string | null
          status: string
          step: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          request_id?: string | null
          status?: string
          step: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          request_id?: string | null
          status?: string
          step?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_tasks_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          assigned_engineer_id: string | null
          claim_number: string | null
          client_id: string
          created_at: string | null
          current_step: string | null
          date_of_loss: string | null
          description: string | null
          id: string
          incident_description: string | null
          incident_location: string | null
          incident_type: string | null
          insured_value: number | null
          owner_address: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          request_number: string
          status: string
          third_party_email: string | null
          third_party_insurance: string | null
          third_party_name: string | null
          third_party_phone: string | null
          type: string
          updated_at: string | null
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_mileage: number | null
          vehicle_model: string | null
          vehicle_province: string | null
          vehicle_registration: string | null
          vehicle_vin: string | null
          vehicle_year: number | null
        }
        Insert: {
          assigned_engineer_id?: string | null
          claim_number?: string | null
          client_id: string
          created_at?: string | null
          current_step?: string | null
          date_of_loss?: string | null
          description?: string | null
          id?: string
          incident_description?: string | null
          incident_location?: string | null
          incident_type?: string | null
          insured_value?: number | null
          owner_address?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          request_number: string
          status?: string
          third_party_email?: string | null
          third_party_insurance?: string | null
          third_party_name?: string | null
          third_party_phone?: string | null
          type: string
          updated_at?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_mileage?: number | null
          vehicle_model?: string | null
          vehicle_province?: string | null
          vehicle_registration?: string | null
          vehicle_vin?: string | null
          vehicle_year?: number | null
        }
        Update: {
          assigned_engineer_id?: string | null
          claim_number?: string | null
          client_id?: string
          created_at?: string | null
          current_step?: string | null
          date_of_loss?: string | null
          description?: string | null
          id?: string
          incident_description?: string | null
          incident_location?: string | null
          incident_type?: string | null
          insured_value?: number | null
          owner_address?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          request_number?: string
          status?: string
          third_party_email?: string | null
          third_party_insurance?: string | null
          third_party_name?: string | null
          third_party_phone?: string | null
          type?: string
          updated_at?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_mileage?: number | null
          vehicle_model?: string | null
          vehicle_province?: string | null
          vehicle_registration?: string | null
          vehicle_vin?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          province: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          province?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          province?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      get_user_engineer_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      assessment_result_type: "repair" | "code_2" | "code_3" | "total_loss"
      assessment_stage:
        | "request_submitted"
        | "request_reviewed"
        | "inspection_scheduled"
        | "appointment_scheduled"
        | "assessment_in_progress"
        | "estimate_review"
        | "estimate_sent"
        | "estimate_finalized"
        | "frc_in_progress"
        | "archived"
        | "cancelled"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      assessment_result_type: ["repair", "code_2", "code_3", "total_loss"],
      assessment_stage: [
        "request_submitted",
        "request_reviewed",
        "inspection_scheduled",
        "appointment_scheduled",
        "assessment_in_progress",
        "estimate_review",
        "estimate_sent",
        "estimate_finalized",
        "frc_in_progress",
        "archived",
        "cancelled",
      ],
    },
  },
} as const
