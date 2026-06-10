import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ExternalLink, X } from 'lucide-react';
import type { ApprovalResult } from '../../services/participantService';

type OverlayStatus = 'idle' | 'loading' | 'success' | 'error';

interface SuccessData {
  participantName: string;
  action: 'approved' | 'rejected';
  result?: ApprovalResult;
  rejectionReason?: string;
}

interface OverlayState {
  status: OverlayStatus;
  loadingMessage: string;
  successData: SuccessData | null;
  errorMessage: string;
}

export interface ActionOverlayControls {
  isActive: boolean;
  startAction: (message: string) => void;
  setSuccess: (data: SuccessData) => void;
  setError: (message: string) => void;
  dismiss: () => void;
  overlayState: OverlayState;
}

export function useActionOverlay(): ActionOverlayControls {
  const [state, setState] = useState<OverlayState>({
    status: 'idle',
    loadingMessage: '',
    successData: null,
    errorMessage: '',
  });

  const startAction = (message: string) =>
    setState({ status: 'loading', loadingMessage: message, successData: null, errorMessage: '' });

  const setSuccess = (data: SuccessData) =>
    setState((s) => ({ ...s, status: 'success', successData: data }));

  const setError = (message: string) =>
    setState((s) => ({ ...s, status: 'error', errorMessage: message }));

  const dismiss = () =>
    setState({ status: 'idle', loadingMessage: '', successData: null, errorMessage: '' });

  return {
    isActive: state.status !== 'idle',
    startAction,
    setSuccess,
    setError,
    dismiss,
    overlayState: state,
  };
}

interface ActionOverlayProps {
  controls: ActionOverlayControls;
}

export function ActionOverlay({ controls }: ActionOverlayProps) {
  const { overlayState, dismiss } = controls;
  const { status, loadingMessage, successData, errorMessage } = overlayState;
  const visible = status !== 'idle';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)' }}
        >
          <AnimatePresence mode="wait">
            {status === 'loading' && (
              <motion.div
                key="loading-card"
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center"
              >
                {/* Spinner ring */}
                <div className="relative w-20 h-20 mb-6">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#f0f0f0" strokeWidth="6" />
                    <motion.circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke="#F68E22"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="213.6"
                      animate={{ strokeDashoffset: [213.6, 0, 213.6] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">Please Wait</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{loadingMessage}</p>
              </motion.div>
            )}

            {status === 'success' && successData && (
              <motion.div
                key="success-card"
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                {/* Green header strip */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 pt-8 pb-10 flex flex-col items-center text-center relative">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4"
                  >
                    <CheckCircle className="w-9 h-9 text-white" strokeWidth={2.5} />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {successData.action === 'approved' ? 'Approved Successfully' : 'Participant Rejected'}
                  </h3>
                  <p className="text-green-100 text-sm font-medium">{successData.participantName}</p>
                </div>

                {/* Card body lifted into header */}
                <div className="px-6 pb-6 -mt-4">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                    {successData.action === 'approved' && successData.result && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Moodle User ID</span>
                          <span className="font-semibold text-gray-800">#{successData.result.moodleUserId}</span>
                        </div>

                        {/* Multi-course enrollment list */}
                        {successData.result.enrollments?.length > 0 && (
                          <>
                            <div className="h-px bg-gray-100" />
                            <p className="text-xs font-semibold text-gray-400 uppercase">
                              Enrolled Courses ({successData.result.enrollments.length})
                            </p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {successData.result.enrollments.map((c) => (
                                <div key={c.trainingTitle} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-green-50 border border-green-100">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 truncate">{c.trainingTitle}</p>
                                    <p className="text-xs text-gray-400">Course #{c.moodleCourseId}</p>
                                  </div>
                                  {c.moodleCourseUrl && (
                                    <a
                                      href={c.moodleCourseUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-shrink-0 text-secondary hover:text-secondary-600 transition-colors"
                                      title="Open in Moodle"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Failed enrollments warning */}
                        {successData.result.failed && successData.result.failed.length > 0 && (
                          <>
                            <div className="h-px bg-gray-100" />
                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                              <p className="text-xs font-semibold text-amber-700 mb-1">
                                {successData.result.failed.length} enrollment(s) could not complete
                              </p>
                              {successData.result.failed.map((f) => (
                                <p key={f.trainingTitle} className="text-xs text-amber-600">
                                  {f.trainingTitle}: {f.error}
                                </p>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    )}
                    {successData.action === 'rejected' && successData.rejectionReason && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Rejection Reason</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{successData.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={dismiss}
                    className="mt-4 w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error-card"
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                {/* Red header strip */}
                <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 pt-8 pb-10 flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: 20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4"
                  >
                    <XCircle className="w-9 h-9 text-white" strokeWidth={2.5} />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-1">Action Failed</h3>
                  <p className="text-red-100 text-sm">Something went wrong during this operation.</p>
                </div>

                <div className="px-6 pb-6 -mt-4">
                  <div className="bg-white rounded-xl border border-red-100 shadow-sm p-4">
                    <p className="text-xs font-semibold text-red-400 uppercase mb-2">Error Details</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                      {errorMessage}
                    </p>
                  </div>

                  <button
                    onClick={dismiss}
                    className="mt-4 w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
