import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, BookOpen, Building, Calendar, User, MessageSquare, X, RotateCcw } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { Textarea } from '../../components/ui/Textarea';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Toast, useToast } from '../../components/ui/Toast';
import { trainingService } from '../../services/trainingService';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

const TRAINING_TYPE_OPTIONS = [
  'Nutrition Leadership and Governance (NLG)',
  'Social and Behavior Change (SBC)',
  'Data Quality Check (DQC)',
  'Nutrition and Primary Health Care (NPHC)',
  'Household Convergence Scorecard (HCSC)',
  'Stakeholder Engagements (SE)',
  'Technical Sessions (TS)',
  'Project Management Sessions (PMS)',
].map((v) => ({ value: v, label: v }));

const TRAINING_NAME_OPTIONS = [
  'Nutrition Leadership and Governance (NLG)',
  'Social and Behavior Change (SBC)',
  'Data Quality Check (DQC)',
  'Nutrition and Primary Health Care (NPHC)',
  'Household Convergence Scorecard (HCSC)',
  'Stakeholder Engagement',
  'Technical Sessions',
  'Project Management Sessions',
  'Integrated Supportive Supervision and Mentoring (ISSM)',
].map((v) => ({ value: v, label: v }));

const PROVIDER_DEPT_OPTIONS = [
  'National and Subnational Implementers',
  'Centers for Health Development (CHDs)',
  'Capacity Building Contractors',
  'Project Municipalities',
  'Provincial LGUs / Health Offices',
].map((v) => ({ value: v, label: v }));

const PROVIDER_OFFICE_OPTIONS = [
  'PMNP National Project Management Office (NPMO)',
  'PMNP Regional Project Management Office (RPMO)',
  'Central Luzon Center for Health Development (CLCHD)',
  'CALABARZON Center for Health Development (CHD 4A)',
  'MIMAROPA Center for Health Development (CHD 4B)',
  'Bicol Center for Health Development (Bicol CHD)',
  'Western Visayas Center for Health Development (WVCHD)',
  'Central Visayas Center for Health Development (CVCHD)',
  'Eastern Visayas Center for Health Development (EVCHD)',
  'Zamboanga Peninsula Center for Health Development (ZPCHD)',
  'Northern Mindanao Center for Health Development (NMCHD)',
  'Davao Center for Health Development (Davao CHD)',
  'SOCCSKSARGEN Center for Health Development (CHD XII)',
  'Caraga Center for Health Development (Caraga CHD)',
  'University of the Philippines Los Baños Foundation Inc. (UPLBFI)',
  'Human Capital Asia (HCA) Inc.',
  'Strategic Engagement for Enabling Development (SEED) Inc.',
  'Action Against Hunger (AAH)',
  'Nutrition Center of the Philippines (NCP)',
  'AHA Behavioral Design (AHA BD)',
  'American Institute of Research (AIR)',
  'Lochan and Co.',
  'National Nutrition Council (NNC)',
  'Project Municipalities',
  'Provincial LGUs / Health Offices',
].map((v) => ({ value: v, label: v }));

const REMARKS_LIMIT = 500;

interface FormData {
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
  start_date: string;
  end_date: string;
  venue: string;
  submitter: string;
  remarks: string;
}

const initialForm: FormData = {
  training_type: '',
  participating_regions: '',
  participating_province: '',
  participating_provinces: '',
  participating_city_municipality: '',
  participating_cities_municipalities: '',
  participating_barangays: '',
  training_name: '',
  provider_department: '',
  provider_office: '',
  start_date: '',
  end_date: '',
  venue: '',
  submitter: '',
  remarks: '',
};

interface TrainingRegistrationPageProps {
  role: UserRole;
  backTo: string;
}

export function TrainingRegistrationPage({ role, backTo }: TrainingRegistrationPageProps) {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const setDirect = (field: keyof FormData) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.training_type) errs.training_type = 'Training type is required.';
    if (!form.training_name) errs.training_name = 'Training name is required.';
    if (!form.provider_department) errs.provider_department = 'Provider department is required.';
    if (!form.provider_office) errs.provider_office = 'Provider office is required.';
    if (!form.start_date) errs.start_date = 'Start date is required.';
    if (!form.end_date) errs.end_date = 'End date is required.';
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      errs.end_date = 'End date cannot be before start date.';
    if (!form.venue.trim()) errs.venue = 'Training venue is required.';
    if (!form.submitter.trim()) errs.submitter = 'Submitter is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildDhis2Payload = () => ({
    'TR_Training Type': form.training_type,
    'TR_Participating Regions': form.participating_regions,
    'TR_Participating Province': form.participating_province,
    'TR_Participating Provinces': form.participating_provinces,
    'TR_Participating City/Municipality': form.participating_city_municipality,
    'TR_Participating Cities/Municipalities': form.participating_cities_municipalities,
    'TR_Participating Barangays': form.participating_barangays,
    'TR_Training Name': form.training_name,
    'TR_Training Provider - Department': form.provider_department,
    'TR_Training Provider - Office': form.provider_office,
    'TR_Training Start Date': form.start_date,
    'TR_Training End Date': form.end_date,
    'TR_Training Venue': form.venue,
    'TR_Submitter': form.submitter,
    'TR_Remarks': form.remarks,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { showToast('Please correct the errors below.', 'error'); return; }
    setLoading(true);
    try {
      await trainingService.createTraining(form, user?.id);
      console.log('DHIS2 payload:', buildDhis2Payload());
      setSubmitted(true);
      showToast('Training registration submitted successfully.', 'success');
      setTimeout(() => navigate(backTo), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register training.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => showToast('Draft saved successfully.', 'info');
  const handleReset = () => { setForm(initialForm); setErrors({}); setSubmitted(false); };
  const handleCancel = () => navigate(backTo);

  return (
    <DashboardLayout role={role} title="Training Registration" subtitle="Register a new training event">
      <Toast {...toast} onClose={hideToast} />

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Training registration submitted successfully.</p>
            <p className="text-xs text-green-600 mt-0.5">Redirecting you back…</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} noValidate className="max-w-4xl space-y-5">

        {/* Section 1 — Training Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionHeader
            icon={<BookOpen className="w-4 h-4 text-primary" />}
            title="Training Details"
            helper="Select the type and name of this training event"
            color="bg-primary-50"
            dividerColor="bg-primary-500"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Training Type *"
              value={form.training_type}
              onChange={set('training_type')}
              error={errors.training_type}
              options={TRAINING_TYPE_OPTIONS}
              placeholder="Select training type"
              helper="The PMNP training category"
            />
            <Select
              label="Training Name *"
              value={form.training_name}
              onChange={set('training_name')}
              error={errors.training_name}
              options={TRAINING_NAME_OPTIONS}
              placeholder="Select training name"
              helper="Specific name of the training module"
            />
          </div>
        </motion.div>

        {/* Section 2 — Participating Areas */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionHeader
            icon={<MapPin className="w-4 h-4 text-secondary" />}
            title="Participating Areas"
            helper="Geographic coverage of this training (all fields optional)"
            color="bg-secondary-50"
            dividerColor="bg-secondary"
          />
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Participating Regions"
                value={form.participating_regions}
                onChange={set('participating_regions')}
                placeholder="e.g., NCR, Region IV-A, Region VII"
              />
              <Input
                label="Participating Province"
                value={form.participating_province}
                onChange={set('participating_province')}
                placeholder="e.g., Cebu"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Participating Provinces"
                value={form.participating_provinces}
                onChange={set('participating_provinces')}
                placeholder="e.g., Cebu, Bohol, Negros Oriental"
              />
              <Input
                label="Participating City/Municipality"
                value={form.participating_city_municipality}
                onChange={set('participating_city_municipality')}
                placeholder="e.g., Cebu City"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Participating Cities/Municipalities"
                value={form.participating_cities_municipalities}
                onChange={set('participating_cities_municipalities')}
                placeholder="e.g., Cebu City, Mandaue, Lapu-Lapu"
              />
              <Input
                label="Participating Barangays"
                value={form.participating_barangays}
                onChange={set('participating_barangays')}
                placeholder="e.g., All Barangays, Selected Barangays"
              />
            </div>
          </div>
        </motion.div>

        {/* Section 3 — Training Provider */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionHeader
            icon={<Building className="w-4 h-4 text-green-600" />}
            title="Training Provider"
            helper="Department and office responsible for organizing this training"
            color="bg-green-50"
            dividerColor="bg-green-500"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Training Provider — Department *"
              value={form.provider_department}
              onChange={set('provider_department')}
              error={errors.provider_department}
              options={PROVIDER_DEPT_OPTIONS}
              placeholder="Select department"
            />
            <SearchableSelect
              label="Training Provider — Office *"
              value={form.provider_office}
              onChange={setDirect('provider_office')}
              error={errors.provider_office}
              options={PROVIDER_OFFICE_OPTIONS}
              placeholder="Search and select office"
              helper="Type to filter the list of offices"
            />
          </div>
        </motion.div>

        {/* Section 4 — Schedule and Venue */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionHeader
            icon={<Calendar className="w-4 h-4 text-teal-600" />}
            title="Schedule and Venue"
            helper="Training dates and location details"
            color="bg-teal-50"
            dividerColor="bg-teal-500"
          />
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Training Start Date *"
                type="date"
                value={form.start_date}
                onChange={set('start_date')}
                error={errors.start_date}
              />
              <Input
                label="Training End Date *"
                type="date"
                value={form.end_date}
                onChange={set('end_date')}
                error={errors.end_date}
                helper="Must be the same as or later than the start date"
              />
            </div>
            <Input
              label="Training Venue *"
              value={form.venue}
              onChange={set('venue')}
              error={errors.venue}
              placeholder="e.g., DOH Conference Room, Manila"
            />
          </div>
        </motion.div>

        {/* Section 5 — Submission Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionHeader
            icon={<User className="w-4 h-4 text-amber-600" />}
            title="Submission Details"
            color="bg-amber-50"
            dividerColor="bg-amber-500"
          />
          <div className="space-y-4">
            <Input
              label="Submitter *"
              value={form.submitter}
              onChange={set('submitter')}
              error={errors.submitter}
              placeholder="Full name of the person submitting this registration"
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-gray-600">Remarks</label>
                <span className={`text-xs tabular-nums ${form.remarks.length > REMARKS_LIMIT ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {form.remarks.length} / {REMARKS_LIMIT}
                </span>
              </div>
              <Textarea
                value={form.remarks}
                onChange={set('remarks')}
                placeholder="Additional notes or remarks about this training…"
                rows={4}
              />
              <p className="text-xs text-gray-400">Suggested maximum of {REMARKS_LIMIT} characters.</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pb-4">
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              <X className="w-4 h-4" />
              Cancel
            </Button>
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
              <BookOpen className="w-4 h-4" />
              Submit
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
