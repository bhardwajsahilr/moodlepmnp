import { supabase } from '../lib/supabase';
import type { Participant, ParticipantTraining } from '../types';
import { mockParticipants } from '../data/mockData';

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

async function callFunction<T>(slug: string, body: unknown): Promise<T> {
  const headers = await functionsHeaders();
  const res = await fetch(`${FUNCTIONS_URL}/${slug}`, { method: 'POST', headers, body: JSON.stringify(body) });
  let json: Record<string, unknown>;
  try { json = await res.json(); } catch { throw new Error(`Server error (HTTP ${res.status})`); }
  if (!res.ok || !json.success) {
    const msg = (json.message ?? json.msg ?? json.error ?? `HTTP ${res.status}`) as string;
    throw new Error(msg);
  }
  return json.data as T;
}

export interface ImportParticipantPayload {
  last_name: string; first_name: string; middle_initial?: string; sex: string;
  profession: string; office: string; position: string; municipality: string;
  lactating: boolean; pregnant: boolean; is_ip: boolean; ip_group?: string;
  nlg_status?: string; sbc_status?: string; dqc_status?: string; nphc_status?: string;
  hcsc_status?: string; se_status?: string; ts_status?: string; pms_status?: string;
  email: string; mobile_number: string; imported_by?: string;
}

export interface ImportParticipantResult {
  participantId: string; userId: string; email: string; temporaryPassword: string;
  moodleUserId: number | null;
  enrollments: Array<{ trainingTitle: string; moodleCourseId: number; moodleCourseUrl: string }>;
  failed?: Array<{ trainingTitle: string; error: string }>;
}

export interface EnrollParticipantResult {
  participantId: string; trainingTitle: string; status: string;
  enrolled: boolean; moodleUserId?: number; moodleCourseId?: number; moodleCourseUrl?: string;
}

export const participantService = {
  async getParticipants(): Promise<Participant[]> {
    const { data, error } = await supabase
      .from('participants').select('*').order('created_at', { ascending: false });
    if (error || !data?.length) return mockParticipants;
    return data as Participant[];
  },

  async getParticipantByUserId(userId: string): Promise<Participant | null> {
    const { data } = await supabase
      .from('participants').select('*').eq('user_id', userId).maybeSingle();
    return data as Participant | null;
  },

  async importParticipant(payload: ImportParticipantPayload): Promise<ImportParticipantResult> {
    return callFunction<ImportParticipantResult>('import-participant', payload);
  },

  async enrollParticipantInTraining(participantId: string, trainingTitle: string, status: string): Promise<EnrollParticipantResult> {
    return callFunction<EnrollParticipantResult>('enroll-participant', { participantId, trainingTitle, status });
  },

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<void> {
    const { error } = await supabase
      .from('participants').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getParticipantTrainings(participantId: string): Promise<ParticipantTraining[]> {
    const { data, error } = await supabase
      .from('participant_trainings').select('*').eq('participant_id', participantId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as ParticipantTraining[];
  },

  async syncMoodleProgress(participantId?: string): Promise<{ synced: number; errors: number }> {
    return callFunction<{ synced: number; errors: number }>(
      'moodle-sync-progress', participantId ? { participantId } : {},
    );
  },

  async getMoodleAutoLoginUrl(participantId: string, targetUrl?: string): Promise<{ loginUrl: string; method: 'userkey' | 'direct' }> {
    return callFunction<{ loginUrl: string; method: 'userkey' | 'direct' }>(
      'moodle-autologin', { participantId, targetUrl },
    );
  },
};
