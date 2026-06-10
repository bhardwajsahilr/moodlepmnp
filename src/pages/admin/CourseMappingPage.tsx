import React, { useEffect, useState } from 'react';
import { Link2, Edit2, Save, X, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast, useToast } from '../../components/ui/Toast';
import { moodleService } from '../../services/moodleService';
import type { CourseMapping } from '../../types';

export function CourseMappingPage() {
  const [mappings, setMappings] = useState<CourseMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<CourseMapping>>({});
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    moodleService.getCourseMappings().then((data) => {
      setMappings(data);
      setLoading(false);
    });
  }, []);

  const startEdit = (m: CourseMapping) => {
    setEditing(m.id);
    setEditData({ moodle_course_id: m.moodle_course_id, moodle_course_url: m.moodle_course_url, auto_enrol: m.auto_enrol });
  };

  const cancelEdit = () => { setEditing(null); setEditData({}); };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      await moodleService.updateCourseMapping(id, editData);
      setMappings((prev) => prev.map((m) => m.id === id ? { ...m, ...editData } : m));
      showToast('Course mapping updated.', 'success');
      cancelEdit();
    } catch {
      showToast('Failed to save mapping.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin" title="Course Mapping" subtitle="Map training titles to Moodle course IDs">
      <Toast {...toast} onClose={hideToast} />
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <Link2 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-gray-900">Training Title → Moodle Course Mapping</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-primary-50/40 to-secondary-50/30 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Training Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Moodle Course ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Moodle Course URL</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Auto Enrol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mappings.map((m) => (
                  <tr key={m.id} className="hover:bg-primary-50/10 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 bg-primary-50 text-primary text-xs font-bold rounded-lg">
                        {m.training_title}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editing === m.id ? (
                        <input
                          type="text"
                          value={editData.moodle_course_id ?? ''}
                          onChange={(e) => setEditData((d) => ({ ...d, moodle_course_id: e.target.value }))}
                          className="px-2 py-1.5 border border-secondary rounded-lg text-sm w-24 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                        />
                      ) : (
                        <span className="text-gray-700 font-mono">{m.moodle_course_id || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing === m.id ? (
                        <input
                          type="url"
                          value={editData.moodle_course_url ?? ''}
                          onChange={(e) => setEditData((d) => ({ ...d, moodle_course_url: e.target.value }))}
                          className="px-2 py-1.5 border border-secondary rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500 truncate max-w-[220px]">{m.moodle_course_url || '—'}</span>
                          {m.moodle_course_url && (
                            <a href={m.moodle_course_url} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-secondary-600">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing === m.id ? (
                        <button
                          type="button"
                          onClick={() => setEditData((d) => ({ ...d, auto_enrol: !d.auto_enrol }))}
                          className={editData.auto_enrol ? 'text-primary' : 'text-gray-300'}
                        >
                          {editData.auto_enrol ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                        </button>
                      ) : (
                        <span className={`text-xs font-medium ${m.auto_enrol ? 'text-green-600' : 'text-gray-400'}`}>
                          {m.auto_enrol ? 'Enabled' : 'Disabled'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing === m.id ? (
                        <div className="flex items-center gap-1">
                          <Button size="sm" onClick={() => handleSave(m.id)} loading={saving} icon={<Save className="w-3 h-3" />}>Save</Button>
                          <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(m)}
                          className="p-1.5 rounded-lg hover:bg-secondary-50 text-secondary transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
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
