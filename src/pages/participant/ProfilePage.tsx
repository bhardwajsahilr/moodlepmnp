import React, { useEffect, useState } from 'react';
import { Save, User } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Toast, useToast } from '../../components/ui/Toast';
import { participantService } from '../../services/participantService';
import { useAuth } from '../../context/AuthContext';
import { TRAINING_TITLES } from '../../data/mockData';
import type { Participant } from '../../types';

export function ProfilePage() {
  const { user } = useAuth();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (!user) return;
    participantService.getParticipantByUserId(user.id).then((p) => {
      setParticipant(p);
      setLoading(false);
    });
  }, [user]);

  const set = (field: keyof Participant) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setParticipant((p) => p ? { ...p, [field]: e.target.value } : p);

  const handleSave = async () => {
    if (!participant) return;
    setSaving(true);
    try {
      await participantService.updateParticipant(participant.id, {
        profession: participant.profession,
        office: participant.office,
        position: participant.position,
        mobile_number: participant.mobile_number,
      });
      showToast('Profile updated successfully.', 'success');
    } catch {
      showToast('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <DashboardLayout role="participant" title="My Profile">
      <div className="max-w-2xl space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-48 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
      </div>
    </DashboardLayout>
  );

  if (!participant) return (
    <DashboardLayout role="participant" title="My Profile">
      <div className="text-center py-12 text-gray-400">No profile found. Please contact an administrator.</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="participant" title="My Profile" subtitle="View and update your information">
      <Toast {...toast} onClose={hideToast} />
      <div className="max-w-2xl space-y-5">
        {/* Account Status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-primary">{participant.first_name[0]}</span>
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-gray-900">{participant.first_name} {participant.middle_initial ? participant.middle_initial + '. ' : ''}{participant.last_name}</p>
            <p className="text-sm text-gray-500">{participant.email}</p>
          </div>
          <StatusBadge status={participant.status} />
        </div>

        {/* Personal Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionHeader
            icon={<User className="w-4 h-4 text-secondary" />}
            title="Personal Information"
            color="bg-secondary-50"
            dividerColor="bg-secondary"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Last Name" value={participant.last_name} onChange={set('last_name')} disabled />
            <Input label="First Name" value={participant.first_name} onChange={set('first_name')} disabled />
            <Input label="Profession" value={participant.profession} onChange={set('profession')} />
            <Input label="Office" value={participant.office} onChange={set('office')} />
            <Input label="Position / Designation" value={participant.position} onChange={set('position')} />
            <Input label="Mobile Number" value={participant.mobile_number} onChange={set('mobile_number')} />
            <Input label="Municipality" value={participant.municipality} onChange={set('municipality')} disabled />
            <Select
              label="Training Title"
              value={participant.training_title}
              onChange={set('training_title')}
              options={TRAINING_TITLES.map((t) => ({ value: t, label: t }))}
              disabled
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} size="lg" icon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
