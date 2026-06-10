export type UserRole = 'admin' | 'training_manager' | 'participant';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type CourseStatus = 'not_started' | 'in_progress' | 'completed';

export type MoodleStatus = 'not_enrolled' | 'enrolled' | 'completed';

export type TrainingStatus = 'Yes' | 'No' | 'Trained' | '';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url: string;
  created_at: string;
}

export interface Participant {
  id: string;
  last_name: string;
  first_name: string;
  middle_initial: string;
  sex: 'Male' | 'Female' | '';
  profession: string;
  office: string;
  position: string;
  municipality: string;
  lactating: boolean;
  pregnant: boolean;
  is_ip: boolean;
  ip_group: string;
  training_title: string;
  training_status: TrainingStatus;
  nlg_status: TrainingStatus;
  sbc_status: TrainingStatus;
  dqc_status: TrainingStatus;
  nphc_status: TrainingStatus;
  hcsc_status: TrainingStatus;
  se_status: TrainingStatus;
  ts_status: TrainingStatus;
  pms_status: TrainingStatus;
  email: string;
  mobile_number: string;
  status: ApprovalStatus;
  rejection_reason: string;
  approved_at: string | null;
  approved_by: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Training {
  id: string;
  training_type: string;
  participating_regions: string;
  participating_province: string;
  participating_provinces: string;
  participating_city_municipality: string;
  participating_cities_municipalities: string;
  participating_barangays: string;
  training_name: string;
  provider_department: string;
  provider_office: string;
  start_date: string | null;
  end_date: string | null;
  venue: string;
  submitter: string;
  remarks: string;
  created_by: string | null;
  created_at: string;
}

export interface ParticipantTraining {
  id: string;
  participant_id: string;
  training_id: string | null;
  training_title: string;
  moodle_course_id: string;
  moodle_course_url?: string;
  moodle_user_id?: string;
  moodle_status: MoodleStatus;
  course_status: CourseStatus;
  progress_percentage: number;
  created_at: string;
  updated_at?: string;
}

export interface CourseMapping {
  id: string;
  training_title: string;
  moodle_course_id: string;
  moodle_course_url: string;
  auto_enrol: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoodleSettings {
  id: string;
  base_url: string;
  api_token: string;
  default_category: string;
  auto_user_creation: boolean;
  auto_course_enrolment: boolean;
  sso_enabled: boolean;
  updated_at: string;
}

export interface Certificate {
  id: string;
  participant_id: string;
  training_title: string;
  issued_at: string;
  certificate_number: string;
  certificate_url: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}
