import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, Award, Plus, Eye, Link2, RefreshCw, Loader2, UserPlus } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Toast, useToast } from '../../components/ui/Toast';
import { participantService } from '../../services/participantService';
import { trainingService } from '../../services/trainingService';
import { supabase } from '../../lib/supabase';
import type { Participant, Training } from '../../types';

export function AdminDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [completedCourses, setCompletedCourses] = useState(0);
  const [moodleEnrolments, setMoodleEnrolments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    Promise.all([
      participantService.getParticipants(),
      trainingService.getTrainings(),
      supabase.from('participant_trainings').select('id', { count: 'exact', head: true }).eq('course_status', 'completed'),
      supabase.from('participant_trainings').select('id', { count: 'exact', head: true }).eq('moodle_status', 'enrolled'),
    ]).then(([p, t, { count: completed }, { count: enrolled }]) => {
      setParticipants(p);
      setTrainings(t);
      setCompletedCourses(completed ?? 0);
      setMoodleEnrolments(enrolled ?? 0);
      setLoading(false);
    });
  }, []);

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const result = await participantService.syncMoodleProgress();
      const { count } = await supabase
        .from('participant_trainings')
        .select('id', { count: 'exact', head: true })
        .eq('course_status', 'completed');
      setCompletedCourses(count ?? 0);
      showToast(`Synced ${result.synced} participant(s) from Moodle.${result.errors > 0 ? ` ${result.errors} error(s).` : ''}`, result.errors > 0 ? 'warning' : 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Sync failed.', 'error');
    } finally {
      setSyncingAll(false);
    }
  };

  const recentParticipants = participants.slice(0, 5);
  const recentTrainings = trainings.slice(0, 3);

  return (
    <DashboardLayout role="admin" title="Admin Dashboard" subtitle="Overview of the Capacity Building Program">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Participants" value={loading ? '—' : participants.length} icon={<Users className="w-5 h-5 text-primary" />} iconBg="bg-primary-50" />
        <StatCard title="Trainings" value={loading ? '—' : trainings.length} icon={<BookOpen className="w-5 h-5 text-secondary" />} iconBg="bg-secondary-50" />
        <StatCard title="Moodle Enrolments" value={loading ? '—' : moodleEnrolments} icon={<GraduationCap className="w-5 h-5 text-primary" />} iconBg="bg-primary-50" />
        <StatCard title="Completed Courses" value={loading ? '—' : completedCourses} icon={<Award className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/training-registration">
            <Button icon={<Plus className="w-4 h-4" />} size="sm">Add Training</Button>
          </Link>
          <Link to="/admin/participants/add">
            <Button icon={<UserPlus className="w-4 h-4" />} size="sm">Add Participant</Button>
          </Link>
          <Link to="/admin/participants">
            <Button icon={<Eye className="w-4 h-4" />} variant="secondary" size="sm">Manage Participants</Button>
          </Link>
          <Link to="/admin/course-mapping">
            <Button icon={<Link2 className="w-4 h-4" />} variant="secondary" size="sm">Course Mapping</Button>
          </Link>
          <Button
            icon={syncingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            variant="secondary"
            size="sm"
            loading={syncingAll}
            onClick={handleSyncAll}
          >
            {syncingAll ? 'Syncing…' : 'Sync Moodle Progress'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent Participants */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Participants</h2>
            <Link to="/admin/participants" className="text-xs text-secondary hover:underline">View all</Link>
          </div>
          <Table
            columns={[
              { key: 'name', header: 'Name', render: (r) => { const p = r as unknown as Participant; return <span className="font-medium text-gray-900">{p.first_name} {p.last_name}</span>; } },
              { key: 'email', header: 'Email' },
              { key: 'municipality', header: 'Municipality' },
            ]}
            data={recentParticipants as unknown as Record<string, unknown>[]}
            keyField="id"
            loading={loading}
            emptyMessage="No participants yet."
          />
        </div>

        {/* Recent Trainings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Trainings</h2>
            <Link to="/admin/trainings" className="text-xs text-secondary hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : recentTrainings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No trainings registered yet.</p>
          ) : (
            <div className="space-y-3">
              {recentTrainings.map((t) => (
                <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.training_name}</p>
                    <p className="text-xs text-gray-400">{t.start_date ? new Date(t.start_date).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
