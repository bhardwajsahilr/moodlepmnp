import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Plus, UserCheck } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EnrollParticipantsModal } from '../../components/ui/EnrollParticipantsModal';
import { trainingService } from '../../services/trainingService';
import type { Training, UserRole } from '../../types';

interface TrainingsListPageProps {
  role: UserRole;
}

export function TrainingsListPage({ role }: TrainingsListPageProps) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [enrollTraining, setEnrollTraining] = useState<Training | null>(null);

  const createPath = role === 'admin' ? '/admin/training-registration' : '/manager/training-registration';

  useEffect(() => {
    trainingService.getTrainings().then((data) => {
      setTrainings(data);
      setLoading(false);
    });
  }, []);

  const filtered = trainings.filter((t) =>
    `${t.training_name} ${t.participating_regions} ${t.training_type} ${t.submitter}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role={role} title="Trainings" subtitle="All registered training events">
      <EnrollParticipantsModal open={!!enrollTraining} training={enrollTraining} onClose={() => setEnrollTraining(null)} />
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Search trainings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-gray-400">{filtered.length} training{filtered.length !== 1 ? 's' : ''}</span>
            <Link to={createPath}>
              <Button icon={<Plus className="w-4 h-4" />} size="sm">Create Training</Button>
            </Link>
          </div>
        </div>
        {!loading && trainings.length === 0 && (
          <div className="text-center py-14 border border-dashed border-gray-200 rounded-xl mb-4">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">No trainings registered yet</p>
            <p className="text-xs text-gray-400 mb-4">Create the first training event for this program</p>
            <Link to={createPath}>
              <Button icon={<Plus className="w-4 h-4" />}>Create First Training</Button>
            </Link>
          </div>
        )}
        <Table
          columns={[
            {
              key: 'training_name',
              header: 'Training Name',
              render: (r) => {
                const t = r as unknown as Training;
                return (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-medium text-gray-900">{t.training_name}</span>
                  </div>
                );
              },
            },
            { key: 'training_type', header: 'Type' },
            { key: 'participating_regions', header: 'Regions' },
            {
              key: 'start_date',
              header: 'Date',
              render: (r) => {
                const t = r as unknown as Training;
                return (
                  <span className="text-xs text-gray-500">
                    {t.start_date ? new Date(t.start_date).toLocaleDateString() : '—'}
                    {t.end_date ? ` – ${new Date(t.end_date).toLocaleDateString()}` : ''}
                  </span>
                );
              },
            },
            { key: 'venue', header: 'Venue' },
            { key: 'submitter', header: 'Submitter' },
            {
              key: 'enroll',
              header: '',
              render: (r) => (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<UserCheck className="w-3.5 h-3.5" />}
                  onClick={() => setEnrollTraining(r as unknown as Training)}
                >
                  Enroll
                </Button>
              ),
            },
          ]}
          data={filtered as unknown as Record<string, unknown>[]}
          keyField="id"
          loading={loading}
          emptyMessage="No trainings found."
        />
      </div>
    </DashboardLayout>
  );
}
