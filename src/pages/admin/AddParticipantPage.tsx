import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, BookOpen, HeartPulse, MapPin, Key, CheckCircle, Copy, ArrowLeft, Loader2 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { Button } from '../../components/ui/Button';
import { Toast, useToast } from '../../components/ui/Toast';
import { participantService, ImportParticipantResult } from '../../services/participantService';
import { useAuth } from '../../context/AuthContext';
import { PROFESSION_OPTIONS, PARTICIPANT_OFFICE_OPTIONS, DESIGNATION_OPTIONS, IP_GROUP_OPTIONS, REGIONS } from '../../data/mockData';

interface FormData {
  last_name: string; first_name: string; middle_initial: string; sex: string;
  profession: string; office: string; position: string; municipality: string;
  lactating: string; pregnant: string; is_ip: string; ip_group: string;
  nlg_status: string; sbc_status: string; dqc_status: string; nphc_status: string;
  hcsc_status: string; se_status: string; ts_status: string; pms_status: string;
  email: string; mobile_number: string;
}

const blank: FormData = {
  last_name: '', first_name: '', middle_initial: '', sex: '',
  profession: '', office: '', position: '', municipality: '',
  lactating: '', pregnant: '', is_ip: '', ip_group: '',
  nlg_status: '', sbc_status: '', dqc_status: '', nphc_status: '',
  hcsc_status: '', se_status: '', ts_status: '', pms_status: '',
  email: '', mobile_number: '',
};

const toOpt = (arr: readonly string[]) => arr.map((v) => ({ value: v, label: v }));
const STATUS_OPTS = [
  { value: '', label: '— Not set —' }, { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' }, { value: 'Trained', label: 'Trained' },
];
const TRAINING_FIELDS: { key: keyof FormData; abbr: string; label: string }[] = [
  { key: 'nlg_status', abbr: 'NLG', label: 'Nutrition Leadership and Governance' },
  { key: 'sbc_status', abbr: 'SBC', label: 'Social and Behavior Change' },
  { key: 'dqc_status', abbr: 'DQC', label: 'Data Quality Check' },
  { key: 'nphc_status', abbr: 'NPHC', label: 'Nutrition and Primary Health Care' },
  { key: 'hcsc_status', abbr: 'HCSC', label: 'Household Convergence Scorecard' },
  { key: 'se_status', abbr: 'SE', label: 'Stakeholder Engagements' },
  { key: 'ts_status', abbr: 'TS', label: 'Technical Sessions' },
  { key: 'pms_status', abbr: 'PMS', label: 'Project Management Sessions' },
];

interface Props { role: 'admin' | 'training_manager' }

export function AddParticipantPage({ role }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState<FormData>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportParticipantResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const backTo = role === 'admin' ? '/admin/participants' : '/manager/participants';

  const set = (f: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));
  const setD = (f: keyof FormData) => (v: string) => setForm((p) => ({ ...p, [f]: v }));
  const setRadio = (f: keyof FormData) => (v: string) =>
    setForm((p) => { const n = { ...p, [f]: v }; if (f === 'is_ip' && v === 'No') n.ip_group = ''; return n; });

  const validate = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.last_name.trim()) e.last_name = 'Required';
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.sex) e.sex = 'Required';
    if (!form.profession) e.profession = 'Required';
    if (!form.office) e.office = 'Required';
    if (!form.position) e.position = 'Required';
    if (!form.lactating) e.lactating = 'Required';
    if (!form.pregnant) e.pregnant = 'Required';
    if (!form.is_ip) e.is_ip = 'Required';
    if (form.is_ip === 'Yes' && !form.ip_group) e.ip_group = 'Required';
    if (!form.municipality) e.municipality = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.mobile_number.trim()) e.mobile_number = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { showToast('Please fix the errors below.', 'error'); return; }
    setLoading(true);
    try {
      const res = await participantService.importParticipant({
        ...form,
        lactating: form.lactating === 'Yes', pregnant: form.pregnant === 'Yes',
        is_ip: form.is_ip === 'Yes', imported_by: user?.id,
      });
      setResult(res);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create participant.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000); });
  };

  const RadioGroup = ({ field, options, label, required }: { field: keyof FormData; options: string[]; label: string; required?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-5">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name={field} value={opt} checked={form[field] === opt}
              onChange={() => setRadio(field)(opt)} className="accent-primary w-3.5 h-3.5" />
            <span className="text-sm text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
      {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
    </div>
  );

  if (result) {
    return (
      <DashboardLayout role={role} title="Participant Created" subtitle="Share credentials with the participant">
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-green-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Participant Created!</h2>
            <p className="text-sm text-gray-500 mb-6">Share these credentials. The password cannot be recovered later.</p>
            <div className="space-y-3 text-left mb-6">
              {[{ label: 'Portal Login Email', value: result.email, key: 'email' }, { label: 'Temporary Password', value: result.temporaryPassword, key: 'password' }].map(({ label, value, key }) => (
                <div key={key} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{value}</p>
                  </div>
                  <button onClick={() => copyToClipboard(value, key)}
                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
                    {copied === key ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
            {result.enrollments.length > 0 && (
              <div className="mb-6 text-left">
                <p className="text-xs font-medium text-gray-500 mb-2">Enrolled in {result.enrollments.length} Moodle course(s):</p>
                <div className="flex flex-wrap gap-2">
                  {result.enrollments.map((e) => (
                    <span key={e.trainingTitle} className="px-2.5 py-1 bg-primary-50 text-primary text-xs font-semibold rounded-lg">{e.trainingTitle}</span>
                  ))}
                </div>
              </div>
            )}
            {result.failed && result.failed.length > 0 && (
              <div className="mb-6 p-3 bg-amber-50 rounded-xl text-left">
                <p className="text-xs font-medium text-amber-700 mb-1">Some enrollments failed:</p>
                {result.failed.map((f) => <p key={f.trainingTitle} className="text-xs text-amber-600">{f.trainingTitle}: {f.error}</p>)}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setForm(blank); setResult(null); }}>Add Another</Button>
              <Button className="flex-1" onClick={() => navigate(backTo)}>
                <ArrowLeft className="w-4 h-4" /> Back to Participants
              </Button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role} title="Add Participant" subtitle="Create a participant account — credentials are auto-generated">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeader icon={<User className="w-4 h-4 text-secondary" />} title="Personal Information" helper="Basic identity details" color="bg-secondary-50" dividerColor="bg-secondary" />
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label="Last Name *" value={form.last_name} onChange={set('last_name')} error={errors.last_name} placeholder="Last name" />
                <Input label="First Name *" value={form.first_name} onChange={set('first_name')} error={errors.first_name} placeholder="First name" />
                <Input label="M.I." value={form.middle_initial} onChange={set('middle_initial')} placeholder="M.I." />
              </div>
              <RadioGroup field="sex" options={['Male', 'Female']} label="Sex" required />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeader icon={<Briefcase className="w-4 h-4 text-primary" />} title="Professional Information" helper="Work assignment and role" color="bg-primary-50" dividerColor="bg-primary-500" />
            <div className="space-y-4">
              <Select label="Profession *" value={form.profession} onChange={set('profession')} error={errors.profession} options={toOpt(PROFESSION_OPTIONS)} placeholder="Select profession" />
              <SearchableSelect label="Office *" value={form.office} onChange={setD('office')} error={errors.office} options={toOpt(PARTICIPANT_OFFICE_OPTIONS)} placeholder="Search office" />
              <SearchableSelect label="Position / Designation *" value={form.position} onChange={setD('position')} error={errors.position} options={toOpt(DESIGNATION_OPTIONS)} placeholder="Search designation" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeader icon={<HeartPulse className="w-4 h-4 text-rose-500" />} title="Health & Demographic Status" helper="Health and IP indicators" color="bg-rose-50" dividerColor="bg-rose-400" />
            <div className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-6">
                <RadioGroup field="lactating" options={['Yes', 'No']} label="Lactating" required />
                <RadioGroup field="pregnant" options={['Yes', 'No']} label="Pregnant" required />
                <RadioGroup field="is_ip" options={['Yes', 'No']} label="Indigenous Person" required />
              </div>
              <AnimatePresence>
                {form.is_ip === 'Yes' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                    <SearchableSelect label="IP Group *" value={form.ip_group} onChange={setD('ip_group')} error={errors.ip_group} options={toOpt(IP_GROUP_OPTIONS)} placeholder="Select IP group" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeader icon={<MapPin className="w-4 h-4 text-teal-600" />} title="Location" helper="Municipality / region assignment" color="bg-teal-50" dividerColor="bg-teal-500" />
            <SearchableSelect label="Municipality *" value={form.municipality} onChange={setD('municipality')} error={errors.municipality} options={toOpt(REGIONS)} placeholder="Select municipality / region" />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeader icon={<BookOpen className="w-4 h-4 text-amber-600" />} title="Training Status" helper="Set Yes to enroll in Moodle immediately" color="bg-amber-50" dividerColor="bg-amber-500" />
            <div className="grid sm:grid-cols-2 gap-4">
              {TRAINING_FIELDS.map(({ key, abbr, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <span className="font-semibold text-gray-800">{abbr}</span> — {label}
                  </label>
                  <select value={form[key] as string} onChange={set(key)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary">
                    {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeader icon={<Key className="w-4 h-4 text-green-600" />} title="Contact & Account" helper="Login credentials are auto-generated" color="bg-green-50" dividerColor="bg-green-500" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Email Address *" type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="participant@example.com" />
              <Input label="Mobile Number *" type="tel" value={form.mobile_number} onChange={set('mobile_number')} error={errors.mobile_number} placeholder="09XX-XXX-XXXX" />
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">A secure temporary password is auto-generated and shown after submission.</p>
            </div>
          </div>

          <div className="flex justify-between gap-3 pb-6">
            <Button type="button" variant="secondary" onClick={() => navigate(backTo)}>
              <ArrowLeft className="w-4 h-4" /> Cancel
            </Button>
            <Button type="submit" loading={loading} size="lg">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {loading ? 'Creating…' : 'Create Participant'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
