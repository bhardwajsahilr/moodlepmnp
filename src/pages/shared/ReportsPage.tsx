import React, { useEffect, useState } from 'react';
import { BarChart2, Users, BookOpen, GraduationCap, MapPin } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/ui/Card';
import { participantService } from '../../services/participantService';
import { trainingService } from '../../services/trainingService';
import { supabase } from '../../lib/supabase';
import type { Participant, Training, UserRole } from '../../types';

const MODULES: Array<{ field: keyof Participant; label: string }> = [
  { field: 'nlg_status', label: 'NLG' },
  { field: 'sbc_status', label: 'SBC' },
  { field: 'dqc_status', label: 'DQC' },
  { field: 'nphc_status', label: 'NPHC' },
  { field: 'hcsc_status', label: 'HCSC' },
  { field: 'se_status', label: 'SE' },
  { field: 'ts_status', label: 'TS' },
  { field: 'pms_status', label: 'PMS' },
];

interface ReportsPageProps {
  role: UserRole;
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs font-semibold text-gray-700">{d.value}</span>
          <div
            className="w-full rounded-t-lg transition-all duration-500"
            style={{ height: `${(d.value / max) * 100}px`, backgroundColor: d.color, minHeight: d.value > 0 ? '4px' : '0' }}
          />
          <span className="text-[10px] text-gray-400 text-center leading-tight">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ReportsPage({ role }: ReportsPageProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [moodleEnrolments, setMoodleEnrolments] = useState(0);
  const [completedCourses, setCompletedCourses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      participantService.getParticipants(),
      trainingService.getTrainings(),
      supabase.from('participant_trainings').select('id', { count: 'exact', head: true }).eq('moodle_status', 'enrolled'),
      supabase.from('participant_trainings').select('id', { count: 'exact', head: true }).eq('course_status', 'completed'),
    ]).then(([p, t, { count: enrolled }, { count: completed }]) => {
      setParticipants(p);
      setTrainings(t);
      setMoodleEnrolments(enrolled ?? 0);
      setCompletedCourses(completed ?? 0);
      setLoading(false);
    });
  }, []);

  const moduleChartData = MODULES.map(({ field, label }) => ({
    label,
    value: participants.filter((p) => p[field] === 'Yes' || p[field] === 'Trained').length,
    color: '#F68E22',
  }));

  const moduleCounts = MODULES.map(({ field, label }) => ({
    label,
    enrolled: participants.filter((p) => p[field] === 'Yes').length,
    trained: participants.filter((p) => p[field] === 'Trained').length,
  }));

  const municipalityCounts = participants.reduce<Record<string, number>>((acc, p) => {
    if (p.municipality) acc[p.municipality] = (acc[p.municipality] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardLayout role={role} title="Reports" subtitle="Program-wide training and participation summary">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Participants" value={loading ? '—' : participants.length} icon={<Users className="w-5 h-5 text-primary" />} iconBg="bg-primary-50" />
        <StatCard title="Total Trainings" value={loading ? '—' : trainings.length} icon={<BookOpen className="w-5 h-5 text-secondary" />} iconBg="bg-secondary-50" />
        <StatCard title="Moodle Enrolments" value={loading ? '—' : moodleEnrolments} icon={<GraduationCap className="w-5 h-5 text-primary" />} iconBg="bg-primary-50" />
        <StatCard title="Completed Courses" value={loading ? '—' : completedCourses} icon={<GraduationCap className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Participants by Training Module bar chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-secondary" />
            <h2 className="text-sm font-semibold text-gray-900">Participants by Training Module</h2>
          </div>
          {loading ? <div className="h-32 bg-gray-50 rounded-lg animate-pulse" /> : (
            <BarChart data={moduleChartData} />
          )}
        </div>

        {/* Module enrollment breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-gray-900">Module Enrollment Breakdown</h2>
          </div>
          {loading ? <div className="h-32 bg-gray-50 rounded-lg animate-pulse" /> : (
            <div className="space-y-2.5">
              {moduleCounts.map(({ label, enrolled, trained }) => {
                const total = participants.length;
                const active = enrolled + trained;
                const pct = total > 0 ? Math.round((active / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700">{label}</span>
                      <span className="text-gray-500">{trained} trained · {enrolled} enrolled</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Municipality Breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-gray-900">Municipality-wise Participants</h2>
        </div>
        {loading ? <div className="h-48 bg-gray-50 rounded-lg animate-pulse" /> : (
          Object.keys(municipalityCounts).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No data available.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(municipalityCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([municipality, count]) => (
                  <div key={municipality} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 truncate">{municipality}</span>
                    <span className="text-xs font-semibold text-primary bg-primary-50 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">{count}</span>
                  </div>
                ))}
            </div>
          )
        )}
      </div>

      {/* Training Summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-gray-900">Training Summary</h2>
        </div>
        {loading ? (
          <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-primary-50/40 to-secondary-50/30 border-b border-gray-100">
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Training Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Regions</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Start Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trainings.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">No trainings registered yet.</td></tr>
                ) : trainings.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{t.training_name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{t.training_type}</td>
                    <td className="px-4 py-2.5 text-gray-600">{t.participating_regions}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{t.start_date ? new Date(t.start_date).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
