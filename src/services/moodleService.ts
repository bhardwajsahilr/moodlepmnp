import { supabase } from '../lib/supabase';
import type { CourseMapping, MoodleSettings } from '../types';
import { mockCourseMappings } from '../data/mockData';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function functionsHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

export const moodleService = {
  async testMoodleConnection(): Promise<{ success: boolean; message: string; data?: unknown }> {
    const headers = await functionsHeaders();
    const res = await fetch(`${FUNCTIONS_URL}/moodle-test`, { headers });
    const json = await res.json();
    return { success: json.success, message: json.message, data: json.data };
  },

  async getMoodleCourses(): Promise<unknown[]> {
    const headers = await functionsHeaders();
    const res = await fetch(`${FUNCTIONS_URL}/moodle-courses`, { headers });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return Array.isArray(json.data) ? json.data : [];
  },

  async getCourseMappings(): Promise<CourseMapping[]> {
    const { data, error } = await supabase
      .from('course_mappings')
      .select('*')
      .order('training_title');
    if (error || !data?.length) return mockCourseMappings;
    return data as CourseMapping[];
  },

  async updateCourseMapping(id: string, updates: Partial<CourseMapping>): Promise<void> {
    const { error } = await supabase
      .from('course_mappings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getMoodleSettings(): Promise<MoodleSettings | null> {
    const { data } = await supabase
      .from('moodle_settings')
      .select('*')
      .maybeSingle();
    if (data) return data as MoodleSettings;
    return {
      id: '',
      base_url: '',
      api_token: '',
      default_category: 'Capacity Building',
      auto_user_creation: true,
      auto_course_enrolment: true,
      sso_enabled: false,
      updated_at: new Date().toISOString(),
    };
  },

  async saveMoodleSettings(settings: Partial<MoodleSettings>): Promise<void> {
    const { data: existing } = await supabase.from('moodle_settings').select('id').maybeSingle();
    if (existing) {
      await supabase.from('moodle_settings').update({ ...settings, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('moodle_settings').insert(settings);
    }
  },
};
