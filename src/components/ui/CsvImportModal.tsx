import React, { useRef, useState } from 'react';
import { X, Upload, Download, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Button } from './Button';
import { participantService } from '../../services/participantService';
import type { ImportParticipantPayload, ImportParticipantResult } from '../../services/participantService';

const CSV_HEADERS = [
  'last_name', 'first_name', 'middle_initial', 'sex', 'profession', 'office',
  'position', 'municipality', 'email', 'mobile_number',
  'lactating', 'pregnant', 'is_ip', 'ip_group',
  'nlg_status', 'sbc_status', 'dqc_status', 'nphc_status',
  'hcsc_status', 'se_status', 'ts_status', 'pms_status',
];

const SAMPLE_ROW = [
  'dela Cruz', 'Maria', 'A', 'Female', 'Nurse', 'RHU Taguig', 'Nutrition Officer',
  'Taguig', 'maria.delacruz@example.com', '09171234567',
  'No', 'No', 'No', '',
  'Yes', 'No', '', '', '', '', '', '',
];

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
    return row;
  });
}

function rowToPayload(row: Record<string, string>): ImportParticipantPayload {
  const bool = (v: string) => v?.toLowerCase() === 'yes' || v?.toLowerCase() === 'true';
  return {
    last_name: row.last_name ?? '',
    first_name: row.first_name ?? '',
    middle_initial: row.middle_initial ?? '',
    sex: row.sex ?? '',
    profession: row.profession ?? '',
    office: row.office ?? '',
    position: row.position ?? '',
    municipality: row.municipality ?? '',
    email: row.email ?? '',
    mobile_number: row.mobile_number ?? '',
    lactating: bool(row.lactating),
    pregnant: bool(row.pregnant),
    is_ip: bool(row.is_ip),
    ip_group: row.ip_group ?? '',
    nlg_status: row.nlg_status ?? '',
    sbc_status: row.sbc_status ?? '',
    dqc_status: row.dqc_status ?? '',
    nphc_status: row.nphc_status ?? '',
    hcsc_status: row.hcsc_status ?? '',
    se_status: row.se_status ?? '',
    ts_status: row.ts_status ?? '',
    pms_status: row.pms_status ?? '',
  };
}

function validateRow(row: Record<string, string>): string | null {
  if (!row.last_name?.trim()) return 'Missing last_name';
  if (!row.first_name?.trim()) return 'Missing first_name';
  if (!row.email?.trim()) return 'Missing email';
  if (!/\S+@\S+\.\S+/.test(row.email)) return 'Invalid email';
  if (!row.sex?.trim()) return 'Missing sex';
  return null;
}

type Phase = 'upload' | 'preview' | 'importing' | 'done';

interface ResultRow {
  index: number;
  email: string;
  name: string;
  success: boolean;
  error?: string;
  temporaryPassword?: string;
}

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}

export function CsvImportModal({ open, onClose, onDone }: CsvImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('upload');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<Array<{ index: number; error: string }>>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  if (!open) return null;

  const handleClose = () => {
    setPhase('upload');
    setRows([]);
    setErrors([]);
    setResults([]);
    setProgress(0);
    setFileName('');
    onClose();
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsv(text);
      const rowErrors: Array<{ index: number; error: string }> = [];
      parsed.forEach((row, i) => {
        const err = validateRow(row);
        if (err) rowErrors.push({ index: i + 1, error: err });
      });
      setRows(parsed);
      setErrors(rowErrors);
      setPhase('preview');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) handleFile(file);
  };

  const handleImport = async () => {
    const validRows = rows.filter((_, i) => !errors.find((e) => e.index === i + 1));
    setPhase('importing');
    const res: ResultRow[] = [];
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const result: ImportParticipantResult = await participantService.importParticipant(rowToPayload(row));
        res.push({ index: i + 1, email: result.email, name: `${row.first_name} ${row.last_name}`, success: true, temporaryPassword: result.temporaryPassword });
      } catch (e) {
        res.push({ index: i + 1, email: row.email, name: `${row.first_name} ${row.last_name}`, success: false, error: e instanceof Error ? e.message : 'Import failed' });
      }
      setProgress(Math.round(((i + 1) / validRows.length) * 100));
      setResults([...res]);
    }
    setPhase('done');
    onDone?.();
  };

  const downloadTemplate = () => {
    const csv = [CSV_HEADERS.join(','), SAMPLE_ROW.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'participant_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = rows.length - errors.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Import Participants via CSV</h2>
            <p className="text-xs text-gray-400 mt-0.5">Bulk create participant accounts and enroll them in courses</p>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Upload phase */}
          {phase === 'upload' && (
            <>
              <button
                onClick={downloadTemplate}
                className="w-full flex items-center gap-2 p-3 border border-dashed border-secondary/40 rounded-xl text-sm text-secondary hover:bg-secondary-50 transition-colors"
              >
                <Download className="w-4 h-4 flex-shrink-0" />
                Download CSV template with sample row
              </button>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-primary-50/30 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">Drop your CSV file here</p>
                <p className="text-xs text-gray-400">or click to browse</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </>
          )}

          {/* Preview phase */}
          {phase === 'preview' && (
            <>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                  <p className="text-xs text-gray-400">{rows.length} rows — {validCount} valid, {errors.length} with errors</p>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-xs font-semibold text-red-700 mb-2">Rows with errors (will be skipped):</p>
                  <div className="space-y-1">
                    {errors.slice(0, 5).map((e) => (
                      <p key={e.index} className="text-xs text-red-600">Row {e.index}: {e.error}</p>
                    ))}
                    {errors.length > 5 && <p className="text-xs text-red-500">...and {errors.length - 5} more</p>}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#', 'Name', 'Email', 'Sex', 'Municipality', 'Modules'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.slice(0, 10).map((row, i) => {
                      const hasError = errors.find((e) => e.index === i + 1);
                      const modules = ['nlg_status', 'sbc_status', 'dqc_status', 'nphc_status', 'hcsc_status', 'se_status', 'ts_status', 'pms_status']
                        .filter((f) => row[f] === 'Yes' || row[f] === 'Trained')
                        .map((f) => f.replace('_status', '').toUpperCase());
                      return (
                        <tr key={i} className={hasError ? 'bg-red-50' : ''}>
                          <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">{row.first_name} {row.last_name}</td>
                          <td className="px-3 py-2 text-gray-600">{row.email}</td>
                          <td className="px-3 py-2 text-gray-600">{row.sex}</td>
                          <td className="px-3 py-2 text-gray-600">{row.municipality}</td>
                          <td className="px-3 py-2">
                            {modules.length > 0
                              ? modules.map((m) => <span key={m} className="mr-1 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">{m}</span>)
                              : <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {rows.length > 10 && (
                  <p className="text-xs text-gray-400 px-3 py-2 bg-gray-50 border-t border-gray-100">...and {rows.length - 10} more rows</p>
                )}
              </div>
            </>
          )}

          {/* Importing phase */}
          {phase === 'importing' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-900 mb-1">Importing participants…</p>
              <p className="text-xs text-gray-400 mb-4">{progress}% — {results.length} of {validCount} processed</p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs mx-auto">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Done phase */}
          {phase === 'done' && (
            <>
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Import complete</p>
                  <p className="text-xs text-green-700">
                    {results.filter((r) => r.success).length} imported successfully,{' '}
                    {results.filter((r) => !r.success).length} failed
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name', 'Email', 'Temp Password', 'Status'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {results.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-gray-900">{r.name}</td>
                        <td className="px-3 py-2 text-gray-600">{r.email}</td>
                        <td className="px-3 py-2 font-mono text-gray-900">
                          {r.temporaryPassword ?? (r.success ? '—' : '')}
                        </td>
                        <td className="px-3 py-2">
                          {r.success
                            ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" />OK</span>
                            : <span className="flex items-center gap-1 text-red-500"><AlertCircle className="w-3 h-3" />{r.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          {phase === 'upload' && (
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          )}
          {phase === 'preview' && (
            <>
              <Button variant="secondary" onClick={() => setPhase('upload')}>Back</Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} Participant{validCount !== 1 ? 's' : ''}
              </Button>
            </>
          )}
          {phase === 'done' && (
            <Button onClick={handleClose}>Close</Button>
          )}
        </div>
      </div>
    </div>
  );
}
