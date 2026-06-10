import { supabase } from '../lib/supabase';
import type { AuthUser, UserRole } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
}

export interface RegisterParticipantPayload {
  last_name: string;
  first_name: string;
  middle_initial?: string;
  sex: string;
  profession: string;
  office: string;
  position: string;
  municipality: string;
  lactating: boolean;
  pregnant: boolean;
  is_ip: boolean;
  ip_group?: string;
  training_title: string;
  training_status: string;
  nlg_status?: string;
  sbc_status?: string;
  dqc_status?: string;
  nphc_status?: string;
  hcsc_status?: string;
  se_status?: string;
  ts_status?: string;
  pms_status?: string;
  email: string;
  mobile_number: string;
  password: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error) throw new Error(error.message);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    return {
      id: data.user.id,
      email: data.user.email ?? '',
      role: (profile?.role as UserRole) ?? 'participant',
      full_name: profile?.full_name ?? '',
    };
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async registerParticipant(payload: RegisterParticipantPayload) {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
    });
    if (signUpError) throw new Error(signUpError.message);

    const userId = authData.user?.id;

    if (userId) {
      await supabase.from('profiles').upsert({
        id: userId,
        role: 'participant',
        full_name: `${payload.first_name} ${payload.last_name}`,
        email: payload.email,
      });
    }

    const { error: participantError } = await supabase.from('participants').insert({
      last_name: payload.last_name,
      first_name: payload.first_name,
      middle_initial: payload.middle_initial ?? '',
      sex: payload.sex,
      profession: payload.profession,
      office: payload.office,
      position: payload.position,
      municipality: payload.municipality,
      lactating: payload.lactating,
      pregnant: payload.pregnant,
      is_ip: payload.is_ip,
      ip_group: payload.ip_group ?? '',
      training_title: payload.training_title,
      training_status: payload.training_status,
      nlg_status: payload.nlg_status ?? '',
      sbc_status: payload.sbc_status ?? '',
      dqc_status: payload.dqc_status ?? '',
      nphc_status: payload.nphc_status ?? '',
      hcsc_status: payload.hcsc_status ?? '',
      se_status: payload.se_status ?? '',
      ts_status: payload.ts_status ?? '',
      pms_status: payload.pms_status ?? '',
      email: payload.email,
      mobile_number: payload.mobile_number,
      status: 'pending',
      user_id: userId ?? null,
      moodle_password: payload.password,
    });

    if (participantError) throw new Error(participantError.message);
    return { success: true };
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    return {
      id: data.user.id,
      email: data.user.email ?? '',
      role: (profile?.role as UserRole) ?? 'participant',
      full_name: profile?.full_name ?? '',
    };
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};
