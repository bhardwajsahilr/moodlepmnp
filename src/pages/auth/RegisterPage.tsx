import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, User, Briefcase, BookOpen, Shield,
  Eye, EyeOff, MapPin, HeartPulse, X, RotateCcw, MessageSquare,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Toast, useToast } from '../../components/ui/Toast';
import { authService } from '../../services/authService';
import {
  PROFESSION_OPTIONS,
  PARTICIPANT_OFFICE_OPTIONS,
  DESIGNATION_OPTIONS,
  IP_GROUP_OPTIONS,
  REGIONS,
} from '../../data/mockData';

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

interface FormData {
  last_name: string;
  first_name: string;
  middle_initial: string;
  sex: string;
  profession: string;
  office: string;
  position: string;
  municipality: string;
  lactating: string;
  pregnant: string;
  is_ip: string;
  ip_group: string;
  nlg_status: string;
  sbc_status: string;
  dqc_status: string;
  nphc_status: string;
  hcsc_status: string;
  se_status: string;
  ts_status: string;
  pms_status: string;
  email: string;
  mobile_number: string;
  password: string;
  confirm_password: string;
}

const initialForm: FormData = {
  last_name: '', first_name: '', middle_initial: '', sex: '',
  profession: '', office: '', position: '', municipality: '',
  lactating: '', pregnant: '', is_ip: '', ip_group: '',
  nlg_status: '', sbc_status: '', dqc_status: '', nphc_status: '',
  hcsc_status: '', se_status: '', ts_status: '', pms_status: '',
  email: '', mobile_number: '', password: '', confirm_password: '',
};

const DRAFT_KEY = 'participant_registration_draft';

const toOpt = (arr: readonly string[]) => arr.map((v) => ({ value: v, label: v }));

const TRAINING_STATUS_OPTS = [
  { value: '', label: '— Not set —' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
  { value: 'Trained', label: 'Trained' },
];

const TRAINING_STATUS_FIELDS: { key: keyof FormData; label: string; abbr: string }[] = [
  { key: 'nlg_status', label: 'Nutrition Leadership and Governance', abbr: 'NLG' },
  { key: 'sbc_status', label: 'Social and Behavior Change', abbr: 'SBC' },
  { key: 'dqc_status', label: 'Data Quality Check', abbr: 'DQC' },
  { key: 'nphc_status', label: 'Nutrition and Primary Health Care', abbr: 'NPHC' },
  { key: 'hcsc_status', label: 'Household Convergence Scorecard', abbr: 'HCSC' },
  { key: 'se_status', label: 'Stakeholder Engagements', abbr: 'SE' },
  { key: 'ts_status', label: 'Technical Sessions', abbr: 'TS' },
  { key: 'pms_status', label: 'Project Management Sessions', abbr: 'PMS' },
];

// -------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------

export function RegisterPage() {
  const [form, setForm] = useState<FormData>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? { ...initialForm, ...JSON.parse(saved) } : initialForm;
    } catch {
      return initialForm;
    }
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const navigate = useNavigate();

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const setDirect = (field: keyof FormData) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setRadio = (field: keyof FormData) => (value: string) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === 'is_ip' && value === 'No') next.ip_group = '';
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.last_name.trim()) errs.last_name = 'Last name is required.';
    if (!form.first_name.trim()) errs.first_name = 'First name is required.';
    if (!form.sex) errs.sex = 'Sex is required.';
    if (!form.profession) errs.profession = 'Profession is required.';
    if (!form.office) errs.office = 'Office is required.';
    if (!form.position) errs.position = 'Position / Designation is required.';
    if (!form.lactating) errs.lactating = 'Lactating status is required.';
    if (!form.pregnant) errs.pregnant = 'Pregnant status is required.';
    if (!form.is_ip) errs.is_ip = 'IP status is required.';
    if (form.is_ip === 'Yes' && !form.ip_group) errs.ip_group = 'IP group is required when IP is Yes.';
    if (!form.municipality) errs.municipality = 'Municipality is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.mobile_number.trim()) errs.mobile_number = 'Mobile number is required.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!form.confirm_password) errs.confirm_password = 'Please confirm your password.';
    else if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildDhis2Payload = () => ({
    'Last Name': form.last_name.trim(),
    'First Name': form.first_name.trim(),
    'Middle Name': form.middle_initial.trim(),
    'Sex': form.sex,
    'Profession': form.profession,
    'Office': form.office,
    'Designation': form.position,
    'Lactating': form.lactating,
    'Pregnant': form.pregnant,
    'IP': form.is_ip,
    'Specify IP': form.is_ip === 'Yes' ? form.ip_group : '',
    'Municipality': form.municipality,
    'Training Title - NLG': form.nlg_status,
    'Training Title - SBC': form.sbc_status,
    'Training Title - DQC': form.dqc_status,
    'Training Title - NPHC': form.nphc_status,
    'Training Title - HCSC': form.hcsc_status,
    'Training Title - SE': form.se_status,
    'Training Title - TS': form.ts_status,
    'Training Title - PMS': form.pms_status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { showToast('Please correct the errors below.', 'error'); return; }
    setLoading(true);
    try {
      await authService.registerParticipant({
        last_name: form.last_name.trim(),
        first_name: form.first_name.trim(),
        middle_initial: form.middle_initial.trim(),
        sex: form.sex,
        profession: form.profession,
        office: form.office,
        position: form.position,
        municipality: form.municipality,
        lactating: form.lactating === 'Yes',
        pregnant: form.pregnant === 'Yes',
        is_ip: form.is_ip === 'Yes',
        ip_group: form.is_ip === 'Yes' ? form.ip_group : '',
        training_title: '',
        training_status: '',
        nlg_status: form.nlg_status,
        sbc_status: form.sbc_status,
        dqc_status: form.dqc_status,
        nphc_status: form.nphc_status,
        hcsc_status: form.hcsc_status,
        se_status: form.se_status,
        ts_status: form.ts_status,
        pms_status: form.pms_status,
        email: form.email,
        mobile_number: form.mobile_number,
        password: form.password,
      });
      console.log('DHIS2 payload:', buildDhis2Payload());
      localStorage.removeItem(DRAFT_KEY);
      showToast('Participant registration submitted successfully.', 'success');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    showToast('Draft saved. Your progress has been stored locally.', 'info');
  };

  const handleReset = () => {
    if (!window.confirm('Reset all fields? This will clear your draft too.')) return;
    setForm(initialForm);
    setErrors({});
    localStorage.removeItem(DRAFT_KEY);
  };

  const RadioGroup = ({
    field,
    options,
    label,
    required,
  }: {
    field: keyof FormData;
    options: string[];
    label: string;
    required?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-5 flex-wrap">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer group">
            <input
              type="radio"
              name={field}
              value={opt}
              checked={form[field] === opt}
              onChange={() => setRadio(field)(opt)}
              className="accent-primary w-3.5 h-3.5"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
          </label>
        ))}
      </div>
      {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <Toast {...toast} onClose={hideToast} />
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Participant Registration</h1>
            <p className="text-sm text-gray-500">PMNP Capacity Building Program Portal</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-xs font-medium text-teal-700">
                <MapPin className="w-3 h-3" /> Assigned at: Barangay
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 border border-primary-200 text-xs font-medium text-primary">
                <Shield className="w-3 h-3" /> User: NPMO / RPMO
              </span>
            </div>
          </div>
          <Link to="/login" className="text-xs text-gray-500 hover:text-primary mt-1">
            Already registered? Sign in
          </Link>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* ── Section 1: Personal Information ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeader
              icon={<User className="w-4 h-4 text-secondary" />}
              title="Personal Information"
              helper="Basic identity details of the participant"
              color="bg-secondary-50"
              dividerColor="bg-secondary"
            />
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <Input
                  label="Last Name *"
                  value={form.last_name}
                  onChange={set('last_name')}
                  error={errors.last_name}
                  placeholder="Enter last name"
                />
                <Input
                  label="First Name *"
                  value={form.first_name}
                  onChange={set('first_name')}
                  error={errors.first_name}
                  placeholder="Enter first name"
                />
                <Input
                  label="M.I."
                  value={form.middle_initial}
                  onChange={set('middle_initial')}
                  placeholder="Enter middle initial"
                />
              </div>
              <RadioGroup field="sex" options={['Male', 'Female']} label="Sex (M/F)" required />
            </div>
          </motion.div>

          {/* ── Section 2: Professional Information ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeader
              icon={<Briefcase className="w-4 h-4 text-primary" />}
              title="Professional Information"
              helper="Work assignment and professional role"
              color="bg-primary-50"
              dividerColor="bg-primary-500"
            />
            <div className="space-y-4">
              <Select
                label="Profession / Nature of Work *"
                value={form.profession}
                onChange={set('profession')}
                error={errors.profession}
                options={toOpt(PROFESSION_OPTIONS)}
                placeholder="Select profession"
              />
              <SearchableSelect
                label="Office *"
                value={form.office}
                onChange={setDirect('office')}
                error={errors.office}
                options={toOpt(PARTICIPANT_OFFICE_OPTIONS)}
                placeholder="Search and select office"
                helper="Type to filter the list of offices"
              />
              <SearchableSelect
                label="Position / Designation *"
                value={form.position}
                onChange={setDirect('position')}
                error={errors.position}
                options={toOpt(DESIGNATION_OPTIONS)}
                placeholder="Search and select designation"
                helper="Type to filter the list of designations"
              />
            </div>
          </motion.div>

          {/* ── Section 3: Health and Demographic Status ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeader
              icon={<HeartPulse className="w-4 h-4 text-rose-500" />}
              title="Health and Demographic Status"
              helper="Health and indigenous people indicators"
              color="bg-rose-50"
              dividerColor="bg-rose-400"
            />
            <div className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-6">
                <RadioGroup field="lactating" options={['Yes', 'No']} label="Lactating (Y/N)" required />
                <RadioGroup field="pregnant" options={['Yes', 'No']} label="Pregnant (Y/N)" required />
                <RadioGroup field="is_ip" options={['Yes', 'No']} label="IP — Indigenous Person (Y/N)" required />
              </div>
              <AnimatePresence>
                {form.is_ip === 'Yes' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SearchableSelect
                      label="If Yes, name of IP group *"
                      value={form.ip_group}
                      onChange={setDirect('ip_group')}
                      error={errors.ip_group}
                      options={toOpt(IP_GROUP_OPTIONS)}
                      placeholder="Search and select IP group"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Section 4: Location Details ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeader
              icon={<MapPin className="w-4 h-4 text-teal-600" />}
              title="Location Details"
              helper="Municipality or region where the participant is assigned"
              color="bg-teal-50"
              dividerColor="bg-teal-500"
            />
            <SearchableSelect
              label="Name of Municipality *"
              value={form.municipality}
              onChange={setDirect('municipality')}
              error={errors.municipality}
              options={toOpt(REGIONS)}
              placeholder="Select municipality / region"
            />
          </motion.div>

          {/* ── Section 5: Training Status ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeader
              icon={<BookOpen className="w-4 h-4 text-amber-600" />}
              title="Training Status"
              helper="Indicate the participant's training status for each PMNP module (optional)"
              color="bg-amber-50"
              dividerColor="bg-amber-500"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              {TRAINING_STATUS_FIELDS.map(({ key, label, abbr }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <span className="font-semibold text-gray-800">{abbr}</span>
                    {' '}— {label}
                  </label>
                  <select
                    value={form[key] as string}
                    onChange={set(key)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary appearance-none transition-colors"
                  >
                    {TRAINING_STATUS_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Account Details ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeader
              icon={<Shield className="w-4 h-4 text-green-600" />}
              title="Account Setup"
              helper="Create login credentials for portal access"
              color="bg-green-50"
              dividerColor="bg-green-500"
            />
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address *"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  error={errors.email}
                  placeholder="you@example.com"
                />
                <Input
                  label="Mobile Number *"
                  type="tel"
                  value={form.mobile_number}
                  onChange={set('mobile_number')}
                  error={errors.mobile_number}
                  placeholder="09XX-XXX-XXXX"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Password *"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    error={errors.password}
                    helper="Minimum 8 characters"
                    placeholder="Create a strong password"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    label="Confirm Password *"
                    type={showConfirmPw ? 'text' : 'password'}
                    value={form.confirm_password}
                    onChange={set('confirm_password')}
                    error={errors.confirm_password}
                    placeholder="Repeat your password"
                  />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} tabIndex={-1} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pb-6">
            <div className="flex gap-2">
              <Link to="/login">
                <Button type="button" variant="secondary">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </Link>
              <Button type="button" variant="secondary" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={handleSaveDraft}>
                <MessageSquare className="w-4 h-4" />
                Save Draft
              </Button>
              <Button type="submit" loading={loading} size="lg">
                <Briefcase className="w-4 h-4" />
                Submit Registration
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
