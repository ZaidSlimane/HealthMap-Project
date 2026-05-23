export interface RadioDemandeDto {
  id: number;
  patient_name: string;
  service_name: string;
  exam_type: string;
  exam_type_icon: string;
  urgency: 'normale' | 'semi-urgente' | 'urgente';
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  created_at: string;
}
