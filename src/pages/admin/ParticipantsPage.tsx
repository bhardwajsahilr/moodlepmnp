import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Upload, Users, Filter } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CsvImportModal } from '../../components/ui/CsvImportModal';
import { participantService } from '../../services/participantService';
import type { Participant, UserRole } from '../../types';

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

function ModuleBadges({ participant }: { participant: Participant }) {
  const active = MODULES.filter((m) => participant[m.field] === 'Yes' || participant[m.field] === 'Trained');
  if (active.length === 0) return <span className="text-xs text-gray-400">—</span>;
  const visible = active.slice(0, 3);
  const rest = active.length - 3;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(({ field, label }) => (
        <span
          key={field}
          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
            participant[field] === 'Trained' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {label}
        </span>
      ))}
      {rest > 0 && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">+{rest}</span>}
    </div>
  );
}

interface ParticipantsPageProps {
  role: UserRole;
}

export function ParticipantsPage({ role }: ParticipantsPageProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSex, setFilterSex] = useState('');
  const [filterMunicipality, setFilterMunicipality] = useState('');
  const [filterProfession, setFilterProfession] = useState('');
  const [csvOpen, setCsvOpen] = useState(false);

  const addPath = role === 'admin' ? '/admin/participants/add' : '/manager/participants/add';

  const load = () => {
    participantService.getParticipants().then((data) => {
      setParticipants(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const municipalities = [...new Set(participants.map((p) => p.municipality).filter(Boolean))].sort();
  const professions = [...new Set(participants.map((p) => p.profession).filter(Boolean))].sort();

  const hasFilters = filterSex || filterMunicipality || filterProfession;

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${p.first_name} ${p.last_name} ${p.email} ${p.municipality} ${p.profession}`.toLowerCase().includes(q);
    const matchSex = !filterSex || p.sex === filterSex;
    const matchMuni = !filterMunicipality || p.municipality === filterMunicipality;
    const matchProf = !filterProfession || p.profession === filterProfession;
    return matchSearch && matchSex && matchMuni && matchProf;
  });

  const selectClass = 'text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]';

  return (
    <DashboardLayout role={role} title="Participants" subtitle="All imported participants and their training module assignments">
      <CsvImportModal open={csvOpen} onClose={() => setCsvOpen(false)} onDone={load} />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Search participants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-400">{filtered.length} participant{filtered.length !== 1 ? 's' : ''}</span>
            <Button icon={<Upload className="w-4 h-4" />} variant="secondary" size="sm" onClick={() => setCsvOpen(true)}>Import CSV</Button>
            <Link to={addPath}>
              <Button icon={<Plus className="w-4 h-4" />} size="sm">Add Participant</Button>
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-100">
          <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <select value={filterSex} onChange={(e) => setFilterSex(e.target.value)} className={selectClass}>
            <option value="">All sexes</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select value={filterMunicipality} onChange={(e) => setFilterMunicipality(e.target.value)} className={selectClass}>
            <option value="">All municipalities</option>
            {municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filterProfession} onChange={(e) => setFilterProfession(e.target.value)} className={selectClass}>
            <option value="">All professions</option>
            {professions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={() => { setFilterSex(''); setFilterMunicipality(''); setFilterProfession(''); }}
              className="text-xs text-secondary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {!loading && participants.length === 0 && (
          <div className="text-center py-14 border border-dashed border-gray-200 rounded-xl mb-4">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">No participants yet</p>
            <p className="text-xs text-gray-400 mb-4">Import participants via CSV or add them manually</p>
            <div className="flex gap-2 justify-center">
              <Button icon={<Upload className="w-4 h-4" />} variant="secondary" size="sm" onClick={() => setCsvOpen(true)}>Import CSV</Button>
              <Link to={addPath}><Button icon={<Plus className="w-4 h-4" />} size="sm">Add Participant</Button></Link>
            </div>
          </div>
        )}

        <Table
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => {
                const p = r as unknown as Participant;
                return (
                  <div>
                    <p className="font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-gray-400">{p.profession}</p>
                  </div>
                );
              },
            },
            { key: 'email', header: 'Email' },
            { key: 'municipality', header: 'Municipality' },
            { key: 'sex', header: 'Sex' },
            {
              key: 'modules',
              header: 'Modules',
              render: (r) => <ModuleBadges participant={r as unknown as Participant} />,
            },
          ]}
          data={filtered as unknown as Record<string, unknown>[]}
          keyField="id"
          loading={loading}
          emptyMessage="No participants match the selected filters."
        />
      </div>
    </DashboardLayout>
  );
}
