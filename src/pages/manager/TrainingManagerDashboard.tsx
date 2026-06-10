import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, BookOpen, UserPlus, GraduationCap } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { participantService } from '../../services/participantService';
import { trainingService } from '../../services/trainingService';
import { supabase } from '../../lib/supabase';
import type { Participant, Training } from '../../types';

const MODULES = [
  { field: 'nlg_status' as keyof Participant, label: 'NLG' },
  { field: 'sbc_status' as keyof Participant, label: 'SBC' },
  { field: 'dqc_status' as keyof Participant, label: 'DQC' },
  { field: 'nphc_status' as keyof Participant, label: 'NPHC' },
  { field: 'hcsc_status' as keyof Participant, label: 'HCSC' },
  { field: 'se_status' as keyof Participant, label: 'SE' },
  { field: 'ts_status' as keyof Participant, label: 'TS' },
  { field: 'pms_status' as keyof Participant, label: 'PMS' },
];

export function TrainingManagerDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [moodleEnrolments, setMoodleEnrolments] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      participantService.getParticipants(),
      trainingService.getTrainings(),
      supabase.from('participant_trainings').select('id', { count: 'exact', head: true }).eq('moodle_status', 'enrolled'),
    ]).then(([p, t, { count }]) => {
      setParticipants(p);
      setTrainings(t);
      setMoodleEnrolments(count ?? 0);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout role="training_manager" title="Training Manager Dashboard" subtitle="Manage trainings and participant tracking">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Trainings" value={loading ? '—' : trainings.length} icon={<BookOpen className="w-5 h-5 text-primary" />} iconBg="bg-primary-50" />
        <StatCard title="Total Participants" value={loading ? '—' : participants.length} icon={<Users className="w-5 h-5 text-secondary" />} iconBg="bg-secondary-50" />
        <StatCard title="Moodle Enrolments" value={loading ? '—' : moodleEnrolments} icon={<GraduationCap className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Actions</h2>
        <div className="flex gap-3">
          <Link to="/manager/training-registration">
            <Button icon={<Plus className="w-4 h-4" />} size="sm">Create Training</Button>
          </Link>
          <Link to="/manager/participants/add">
            <Button icon={<UserPlus className="w-4 h-4" />} variant="secondary" size="sm">Add Participant</Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Trainings</h2>
            <Link to="/manager/trainings" className="text-xs text-secondary hover:underline">View all</Link>
          </div>
          <Table
            columns={[
              { key: 'training_name', header: 'Training', render: (r) => <span className="font-medium text-gray-900">{(r as unknown as Training).training_name}</span> },
              { key: 'region', header: 'Region' },
              { key: 'start_date', header: 'Start', render: (r) => <span className="text-xs">{(r as unknown as Training).start_date ? new Date((r as unknown as Training).start_date!).toLocaleDateString() : '—'}</span> },
            ]}
            data={trainings.slice(0, 5) as unknown as Record<string, unknown>[]}
            keyField="id"
            loading={loading}
            emptyMessage="No trainings found."
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Participant List</h2>
            <Link to="/manager/participants" className="text-xs text-secondary hover:underline">View all</Link>
          </div>
          <Table
            columns={[
              { key: 'name', header: 'Name', render: (r) => { const p = r as unknown as Participant; return <span className="font-medium">{p.first_name} {p.last_name}</span>; } },
              { key: 'municipality', header: 'Municipality' },
              { key: 'profession', header: 'Profession' },
            ]}
            data={participants.slice(0, 5) as unknown as Record<string, unknown>[]}
            keyField="id"
            loading={loading}
          />
        </div>
      </div>

      {/* Module Overview */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Training Module Overview</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULES.map(({ field, label }) => {
            const enrolled = participants.filter((p) => p[field] === 'Yes').length;
            const trained = participants.filter((p) => p[field] === 'Trained').length;
            const total = participants.length;
            const pct = total > 0 ? Math.round(((enrolled + trained) / total) * 100) : 0;
            return (
              <div key={field} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-lg">{label}</span>
                  <span className="text-xs text-gray-500">{enrolled + trained}/{total}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{trained} trained · {enrolled} enrolled</p>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
