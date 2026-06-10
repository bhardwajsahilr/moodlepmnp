import React, { useEffect, useState, useCallback } from 'react';
import { ExternalLink, GraduationCap, BookOpen, Award, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Toast, useToast } from '../../components/ui/Toast';
import { participantService } from '../../services/participantService';
import { moodleService } from '../../services/moodleService';
import { useAuth } from '../../context/AuthContext';
import type { Participant, CourseMapping, ParticipantTraining } from '../../types';

const TRAINING_STATUS_MAP: Array<{ field: keyof Participant; title: string }> = [
  { field: 'nlg_status', title: 'NLG' },
  { field: 'sbc_status', title: 'SBC' },
  { field: 'dqc_status', title: 'DQC' },
  { field: 'nphc_status', title: 'NPHC' },
  { field: 'hcsc_status', title: 'HCSC' },
  { field: 'se_status', title: 'SE' },
  { field: 'ts_status', title: 'TS' },
  { field: 'pms_status', title: 'PMS' },
];

function buildPlaceholders(p: Participant, cm: CourseMapping[]): ParticipantTraining[] {
  const toShow = TRAINING_STATUS_MAP.filter(({ field }) => p[field] === 'Yes' || p[field] === 'Trained');

  if (toShow.length > 0) {
    return toShow.map(({ title, field }, i) => ({
      id: `placeholder-${i}`,
      participant_id: p.id,
      training_id: null,
      training_title: title,
      moodle_course_id: cm.find((c) => c.training_title === title)?.moodle_course_id ?? '',
      moodle_status: 'enrolled' as const,
      course_status: p[field] === 'Trained' ? 'completed' as const : 'not_started' as const,
      progress_percentage: p[field] === 'Trained' ? 100 : 0,
      created_at: p.created_at,
    }));
  }

  if (p.training_title) {
    return [{
      id: 'placeholder',
      participant_id: p.id,
      training_id: null,
      training_title: p.training_title,
      moodle_course_id: cm.find((c) => c.training_title === p.training_title)?.moodle_course_id ?? '',
      moodle_status: 'enrolled' as const,
      course_status: 'not_started' as const,
      progress_percentage: 0,
      created_at: p.created_at,
    }];
  }

  return [];
}

export function ParticipantDashboard() {
  const { user } = useAuth();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [courseMappings, setCourseMappings] = useState<CourseMapping[]>([]);
  const [enrollments, setEnrollments] = useState<ParticipantTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [launchingCourseId, setLaunchingCourseId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const loadData = useCallback(async (p?: Participant) => {
    const resolvedParticipant = p ?? participant;
    if (!resolvedParticipant) return;

    const [pts, cm] = await Promise.all([
      participantService.getParticipantTrainings(resolvedParticipant.id),
      moodleService.getCourseMappings(),
    ]);

    setCourseMappings(cm);
    setEnrollments(pts.length > 0 ? pts : buildPlaceholders(resolvedParticipant, cm));
  }, [participant]);

  useEffect(() => {
    if (!user) return;
    participantService.getParticipantByUserId(user.id).then(async (p) => {
      setParticipant(p);
      if (p) await loadData(p);
      setLoading(false);
    });
  }, [user]);

  const handleSync = async () => {
    if (!participant) return;
    setSyncing(true);
    try {
      const result = await participantService.syncMoodleProgress(participant.id);
      await loadData();
      if (result.errors > 0) {
        showToast('Progress sync completed with errors. Your Moodle course may not have completion tracking enabled.', 'warning');
      } else {
        showToast('Progress synced successfully from Moodle.', 'success');
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to sync progress.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const mapping = (title: string) => courseMappings.find((c) => c.training_title === title);

  const handleGoToMoodle = async (enrollmentId: string, courseUrl: string) => {
    if (!participant) return;
    setLaunchingCourseId(enrollmentId);
    try {
      const { loginUrl, method } = await participantService.getMoodleAutoLoginUrl(participant.id, courseUrl);
      if (method === 'direct') {
        showToast('Automatic sign-in is not available. You will be taken to the Moodle login page — sign in with your registered email.', 'warning');
      }
      window.open(loginUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(courseUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setLaunchingCourseId(null);
    }
  };

  const inProgress = enrollments.filter((e) => e.course_status !== 'completed');
  const completed = enrollments.filter((e) => e.course_status === 'completed');

  const CourseCard = ({ e, idx }: { e: ParticipantTraining; idx: number }) => {
    const m = mapping(e.training_title);
    const courseUrl = e.moodle_course_url
      || m?.moodle_course_url
      || `${import.meta.env.VITE_MOODLE_BASE_URL ?? ''}/course/view.php?id=${e.moodle_course_id}`;
    const isComplete = e.course_status === 'completed';
    return (
      <motion.div
        key={e.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        className={`rounded-xl border shadow-sm p-5 ${isComplete ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isComplete ? 'bg-green-100' : 'bg-primary-50'}`}>
            {isComplete
              ? <Award className="w-5 h-5 text-green-600" />
              : <BookOpen className="w-5 h-5 text-primary" />}
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isComplete ? 'bg-green-200 text-green-800' :
            e.course_status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {isComplete ? 'Completed' : e.course_status === 'in_progress' ? 'In Progress' : 'Not Started'}
          </span>
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">{e.training_title}</p>
        <p className="text-xs text-gray-400 mb-3">
          {e.moodle_course_id ? `Course ID: ${e.moodle_course_id}` : 'Awaiting enrollment'}
        </p>

        {!isComplete && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{e.progress_percentage}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${e.progress_percentage}%` }} />
            </div>
          </div>
        )}

        {isComplete ? (
          e.moodle_course_id ? (
            <Button
              className="w-full"
              size="sm"
              variant="secondary"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => handleGoToMoodle(e.id, courseUrl)}
            >
              View Certificate
            </Button>
          ) : (
            <Button className="w-full" size="sm" variant="secondary" disabled>Certificate Pending</Button>
          )
        ) : e.moodle_course_id ? (
          <Button
            className="w-full"
            size="sm"
            icon={launchingCourseId === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            loading={launchingCourseId === e.id}
            onClick={() => handleGoToMoodle(e.id, courseUrl)}
          >
            {launchingCourseId === e.id ? 'Signing you in…' : 'Go to Moodle Course'}
          </Button>
        ) : (
          <Button className="w-full" size="sm" disabled>Not yet enrolled</Button>
        )}
      </motion.div>
    );
  };

  return (
    <DashboardLayout role="participant" title={`Welcome, ${user?.full_name || 'Participant'}`} subtitle="Your training and learning overview">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} duration={8000} />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Profile card */}
          {participant && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-primary">{participant.first_name[0]}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-gray-900">{participant.first_name} {participant.last_name}</h2>
                  <p className="text-sm text-gray-500">{participant.profession} · {participant.office}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{participant.municipality}</p>
                </div>
              </div>
            </motion.div>
          )}

          {!participant && (
            <Card>
              <div className="text-center py-6">
                <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No registration found for your account. Please contact your administrator.</p>
              </div>
            </Card>
          )}

          {/* Enrolled / In-Progress Courses */}
          {participant && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Enrolled Courses</h2>
                  {inProgress.length > 0 && <p className="text-xs text-gray-400 mt-0.5">{inProgress.length} course{inProgress.length !== 1 ? 's' : ''} in progress</p>}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  loading={syncing}
                  onClick={handleSync}
                >
                  {syncing ? 'Syncing…' : 'Sync Progress'}
                </Button>
              </div>

              {inProgress.length === 0 ? (
                <Card>
                  <div className="text-center py-6">
                    <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No courses in progress. Contact your administrator to be enrolled.</p>
                  </div>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgress.map((e, idx) => <CourseCard key={e.id} e={e} idx={idx} />)}
                </div>
              )}
            </div>
          )}

          {/* Completed Courses */}
          {participant && completed.length > 0 && (
            <div>
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-gray-900">Completed Courses</h2>
                <p className="text-xs text-gray-400 mt-0.5">{completed.length} course{completed.length !== 1 ? 's' : ''} completed</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completed.map((e, idx) => <CourseCard key={e.id} e={e} idx={idx} />)}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
