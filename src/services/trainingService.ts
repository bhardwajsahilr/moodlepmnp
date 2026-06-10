import { supabase } from '../lib/supabase';
import type { Training } from '../types';
import { mockTrainings } from '../data/mockData';

export interface CreateTrainingPayload {
  training_type: string;
  participating_regions?: string;
  participating_province?: string;
  participating_provinces?: string;
  participating_city_municipality?: string;
  participating_cities_municipalities?: string;
  participating_barangays?: string;
  training_name: string;
  provider_department: string;
  provider_office: string;
  start_date: string;
  end_date: string;
  venue: string;
  submitter: string;
  remarks?: string;
}

export const trainingService = {
  async getTrainings(): Promise<Training[]> {
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .order('start_date', { ascending: false });
    if (error || !data?.length) return mockTrainings;
    return data as Training[];
  },

  async createTraining(payload: CreateTrainingPayload, createdBy?: string): Promise<Training> {
    const { data, error } = await supabase
      .from('trainings')
      .insert({
        ...payload,
        created_by: createdBy ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Training;
  },

  async updateTraining(id: string, updates: Partial<Training>): Promise<void> {
    const { error } = await supabase
      .from('trainings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};
