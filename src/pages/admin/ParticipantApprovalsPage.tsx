import React, { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle, Search } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Toast, useToast } from '../../components/ui/Toast';
import { ActionOverlay, useActionOverlay } from '../../components/ui/ActionOverlay';
import { participantService } from '../../services/participantService';
import { TabSwitcher } from '../../components/ui/TabSwitcher';
import type { Participant } from '../../types';
import { useAuth } from '../../context/AuthContext';

export function ParticipantApprovalsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewTarget, setViewTarget] = useState<Participant | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Participant | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { toast, showToast, hideToast } = useToast();
  const overlay = useActionOverlay();
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    const data = await participantService.getParticipants();
    setParticipants(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = participants.filter((p) => {
    const matchSearch =
      `${p.first_name} ${p.last_name} ${p.email} ${p.municipality} ${p.training_title}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchTab = activeTab === 'all' || p.status === activeTab;
    return matchSearch && matchTab;
  });

  const counts = {
    all: participants.length,
    pending: participants.filter((p) => p.status === 'pending').length,
    approved: participants.filter((p) => p.status === 'approved').length,
    rejected: participants.filter((p) => p.status === 'rejected').length,
  };

  const handleApprove = async (p: Participant) => {
    overlay.startAction(`Approving ${p.first_name} ${p.last_name} and enrolling them in Moodle…`);
    try {
      const result = await participantService.approveParticipant(p.id);
      setParticipants((prev) => prev.map((x) => x.id === p.id ? { ...x, status: 'approved' } : x));
      overlay.setSuccess({
        participantName: `${p.first_name} ${p.last_name}`,
        action: 'approved',
        result,
      });
    } catch (e) {
      overlay.setError(e instanceof Error ? e.message : 'Failed to approve participant.');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      showToast('Please provide a rejection reason.', 'warning');
      return;
    }
    setRejectTarget(null);
    const reason = rejectReason;
    setRejectReason('');
    overlay.startAction(`Rejecting registration for ${rejectTarget.first_name} ${rejectTarget.last_name}…`);
    try {
      await participantService.rejectParticipant(rejectTarget.id, reason);
      setParticipants((prev) =>
        prev.map((x) => x.id === rejectTarget.id ? { ...x, status: 'rejected', rejection_reason: reason } : x)
      );
      overlay.setSuccess({
        participantName: `${rejectTarget.first_name} ${rejectTarget.last_name}`,
        action: 'rejected',
        rejectionReason: reason,
      });
    } catch {
      overlay.setError('Failed to reject participant. Please try again.');
    }
  };

  return (
    <DashboardLayout role="admin" title="Participant Approvals" subtitle="Review and approve participant registrations">
      <Toast {...toast} onClose={hideToast} />
      <ActionOverlay controls={overlay} />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <TabSwitcher
            tabs={[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'pending', label: 'Pending', count: counts.pending },
              { id: 'approved', label: 'Approved', count: counts.approved },
              { id: 'rejected', label: 'Rejected', count: counts.rejected },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          <div className="flex-1 max-w-xs ml-auto">
            <Input
              placeholder="Search by name, email, municipality…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        <Table
          columns={[
            {
              key: 'name',
              header: 'Participant',
              render: (r) => {
                const p = r as unknown as Participant;
                return (
                  <div>
                    <p className="font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </div>
                );
              },
            },
            { key: 'municipality', header: 'Municipality' },
            { key: 'training_title', header: 'Training' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as unknown as Participant).status} /> },
            {
              key: 'created_at',
              header: 'Submitted',
              render: (r) => <span className="text-xs text-gray-400">{new Date((r as unknown as Participant).created_at).toLocaleDateString()}</span>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => {
                const p = r as unknown as Participant;
                return (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewTarget(p)}
                      className="p-1.5 rounded-lg hover:bg-secondary-50 text-secondary transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {p.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(p)}
                          disabled={overlay.isActive}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-40"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRejectTarget(p)}
                          disabled={overlay.isActive}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-40"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                );
              },
            },
          ]}
          data={filtered as unknown as Record<string, unknown>[]}
          keyField="id"
          loading={loading}
          emptyMessage="No participants found."
        />
      </div>

      {/* View Modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Participant Details" maxWidth="max-w-2xl">
        {viewTarget && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{viewTarget.first_name[0]}</span>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{viewTarget.first_name} {viewTarget.last_name}</p>
                <p className="text-sm text-gray-500">{viewTarget.email}</p>
              </div>
              <div className="ml-auto"><StatusBadge status={viewTarget.status} /></div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Sex', viewTarget.sex],
                ['Profession', viewTarget.profession],
                ['Office', viewTarget.office],
                ['Position', viewTarget.position],
                ['Municipality', viewTarget.municipality],
                ['Mobile', viewTarget.mobile_number],
                ['Pregnant', viewTarget.pregnant ? 'Yes' : 'No'],
                ['Lactating', viewTarget.lactating ? 'Yes' : 'No'],
                ['IP', viewTarget.is_ip ? `Yes – ${viewTarget.ip_group}` : 'No'],
                ['Registered', new Date(viewTarget.created_at).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-400 uppercase">{label}</p>
                  <p className="text-gray-800">{value || '—'}</p>
                </div>
              ))}
            </div>

            {/* Training status grid */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-2">Training Status</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  ['NLG', viewTarget.nlg_status],
                  ['SBC', viewTarget.sbc_status],
                  ['DQC', viewTarget.dqc_status],
                  ['NPHC', viewTarget.nphc_status],
                  ['HCSC', viewTarget.hcsc_status],
                  ['SE', viewTarget.se_status],
                  ['TS', viewTarget.ts_status],
                  ['PMS', viewTarget.pms_status],
                ] as [string, string][]).map(([abbr, val]) => (
                  <div key={abbr} className={`rounded-lg border px-3 py-2 text-center ${
                    val === 'Yes' ? 'bg-green-50 border-green-200' :
                    val === 'Trained' ? 'bg-blue-50 border-blue-200' :
                    val === 'No' ? 'bg-gray-50 border-gray-200' :
                    'bg-gray-50 border-gray-100'
                  }`}>
                    <p className="text-xs font-bold text-gray-700">{abbr}</p>
                    <p className={`text-xs mt-0.5 font-medium ${
                      val === 'Yes' ? 'text-green-700' :
                      val === 'Trained' ? 'text-blue-700' :
                      val === 'No' ? 'text-gray-500' :
                      'text-gray-400'
                    }`}>{val || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
            {viewTarget.status === 'rejected' && viewTarget.rejection_reason && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason</p>
                <p className="text-sm text-red-600">{viewTarget.rejection_reason}</p>
              </div>
            )}
            {viewTarget.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => { setViewTarget(null); handleApprove(viewTarget); }}
                  loading={overlay.isActive}
                  size="sm"
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </Button>
                <Button
                  onClick={() => { setRejectTarget(viewTarget); setViewTarget(null); }}
                  variant="danger"
                  size="sm"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason(''); }} title="Reject Participant">
        {rejectTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Rejecting registration for <strong>{rejectTarget.first_name} {rejectTarget.last_name}</strong>. Please provide a reason.
            </p>
            <Textarea
              label="Rejection Reason *"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this registration is being rejected…"
              rows={3}
            />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={handleReject} className="flex-1">Confirm Rejection</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
