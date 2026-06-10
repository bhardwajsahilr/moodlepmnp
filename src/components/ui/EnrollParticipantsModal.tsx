import React, { useEffect, useState } from 'react';
import { X, Search, UserCheck, Loader2, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { participantService } from '../../services/participantService';
import type { Participant, Training, TrainingStatus } from '../../types';

const ABBR_TO_FIELD: Record<string, keyof Participant> = {
  NLG: 'nlg_status', SBC: 'sbc_status', DQC: 'dqc_status',
  NPHC: 'nphc_status', HCSC: 'hcsc_status', SE: 'se_status',
  TS: 'ts_status', PMS: 'pms_status',
};

function extractAbbr(trainingType: string): string {
  const m = trainingType.match(/\((\w+)\)\s*$/);
  return m ? m[1].toUpperCase() : trainingType.toUpperCase().slice(0, 4);
}

const STATUS_OPTIONS: TrainingStatus[] = ['Yes', 'No', 'Trained'];

interface EnrollParticipantsModalProps {
  open: boolean;
  training: Training | null;
  onClose: () => void;
}

export function EnrollParticipantsModal({ open, training, onClose }: EnrollParticipantsModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSex, setFilterSex] = useState('');
  const [filterMunicipality, setFilterMunicipality] = useState('');
  const [filterProfession, setFilterProfession] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [statusMap, setStatusMap] = useState<Record<string, TrainingStatus>>({});
  const [bulkStatus, setBulkStatus] = useState<TrainingStatus>('Yes');
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const abbr = training ? extractAbbr(training.training_type) : '';

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected({});
    setStatusMap({});
    setSavedIds(new Set());
    setErrors({});
    participantService.getParticipants().then((data) => {
      setParticipants(data);
      // Pre-populate statuses from existing field values
      const map: Record<string, TrainingStatus> = {};
      const field = ABBR_TO_FIELD[abbr];
      if (field) {
        data.forEach((p) => { map[p.id] = (p[field] as TrainingStatus) || 'No'; });
      }
      setStatusMap(map);
      setLoading(false);
    });
  }, [open, abbr]);

  if (!open || !training) return null;

  const municipalities = [...new Set(participants.map((p) => p.municipality).filter(Boolean))].sort();
  const professions = [...new Set(participants.map((p) => p.profession).filter(Boolean))].sort();

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(q);
    const matchSex = !filterSex || p.sex === filterSex;
    const matchMuni = !filterMunicipality || p.municipality === filterMunicipality;
    const matchProf = !filterProfession || p.profession === filterProfession;
    return matchSearch && matchSex && matchMuni && matchProf;
  });

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const allVisible = filtered.length > 0 && filtered.every((p) => selected[p.id]);

  const toggleAll = () => {
    if (allVisible) {
      setSelected((prev) => { const next = { ...prev }; filtered.forEach((p) => { delete next[p.id]; }); return next; });
    } else {
      setSelected((prev) => { const next = { ...prev }; filtered.forEach((p) => { next[p.id] = true; }); return next; });
    }
  };

  const applyBulkStatus = () => {
    setStatusMap((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => { next[id] = bulkStatus; });
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedIds.length === 0 || !abbr) return;
    setSaving(true);
    const newErrors: Record<string, string> = {};
    const newSaved = new Set(savedIds);

    for (const id of selectedIds) {
      const status = statusMap[id] || 'No';
      try {
        await participantService.enrollParticipantInTraining(id, abbr, status);
        newSaved.add(id);
      } catch (e) {
        newErrors[id] = e instanceof Error ? e.message : 'Failed';
      }
    }

    setSavedIds(newSaved);
    setErrors(newErrors);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Enroll Participants</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {training.training_name}
              {abbr && <span className="ml-2 px-1.5 py-0.5 bg-primary-50 text-primary rounded text-[10px] font-bold">{abbr}</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50">
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[180px]">
              <Input
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-3.5 h-3.5" />}
              />
            </div>
            <select
              value={filterSex}
              onChange={(e) => setFilterSex(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All sexes</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select
              value={filterMunicipality}
              onChange={(e) => setFilterMunicipality(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[160px]"
            >
              <option value="">All municipalities</option>
              {municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={filterProfession}
              onChange={(e) => setFilterProfession(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[160px]"
            >
              <option value="">All professions</option>
              {professions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="px-6 py-2 border-b border-primary-100 bg-primary-50 flex items-center gap-3">
            <span className="text-xs font-semibold text-primary">{selectedIds.length} selected</span>
            <span className="text-xs text-primary-600">Set status:</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as TrainingStatus)}
              className="text-xs border border-primary/30 rounded-lg px-2 py-1 bg-white text-gray-800 focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button size="sm" variant="secondary" onClick={applyBulkStatus}>Apply to selected</Button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 text-left w-8">
                    <input type="checkbox" checked={allVisible} onChange={toggleAll} className="rounded border-gray-300" />
                  </th>
                  {['Name', 'Municipality', 'Profession', 'Sex', `${abbr || 'Module'} Status`].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-xs text-gray-400 py-8">No participants match filters</td></tr>
                )}
                {filtered.map((p) => {
                  const isSelected = !!selected[p.id];
                  const isSaved = savedIds.has(p.id);
                  const hasError = errors[p.id];
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary-50/40' : ''} ${isSaved ? 'bg-green-50/40' : ''}`}
                    >
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelected((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                        <p className="text-xs text-gray-400">{p.email}</p>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{p.municipality}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{p.profession}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{p.sex}</td>
                      <td className="px-3 py-2.5">
                        {isSaved ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />Saved
                          </span>
                        ) : isSelected ? (
                          <select
                            value={statusMap[p.id] || 'No'}
                            onChange={(e) => setStatusMap((prev) => ({ ...prev, [p.id]: e.target.value as TrainingStatus }))}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={`text-xs font-medium ${
                            statusMap[p.id] === 'Yes' ? 'text-blue-600' :
                            statusMap[p.id] === 'Trained' ? 'text-green-600' :
                            'text-gray-400'
                          }`}>
                            {statusMap[p.id] || '—'}
                          </span>
                        )}
                        {hasError && <p className="text-xs text-red-500 mt-0.5">{hasError}</p>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">{filtered.length} participant{filtered.length !== 1 ? 's' : ''} shown</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              loading={saving}
              disabled={selectedIds.length === 0}
              onClick={handleSave}
            >
              {saving ? 'Enrolling…' : `Enroll ${selectedIds.length > 0 ? selectedIds.length : ''} Selected`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
