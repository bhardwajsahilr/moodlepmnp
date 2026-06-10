import React, { useEffect, useState } from 'react';
import { Globe, Save, TestTube2, ToggleLeft, ToggleRight } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Toast, useToast } from '../../components/ui/Toast';
import { moodleService } from '../../services/moodleService';
import type { MoodleSettings } from '../../types';

export function MoodleSettingsPage() {
  const [settings, setSettings] = useState<Partial<MoodleSettings>>({
    base_url: '',
    api_token: '',
    default_category: '',
    auto_user_creation: false,
    auto_course_enrolment: false,
    sso_enabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    moodleService.getMoodleSettings().then((data) => {
      if (data) setSettings(data);
    });
  }, []);

  const toggle = (field: keyof MoodleSettings) =>
    setSettings((s) => ({ ...s, [field]: !s[field as keyof typeof s] }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await moodleService.saveMoodleSettings(settings);
      showToast('Moodle settings saved successfully.', 'success');
    } catch {
      showToast('Failed to save settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    try {
      const result = await moodleService.testMoodleConnection();
      showToast(result.message, 'success');
    } catch {
      showToast('Connection test failed.', 'error');
    } finally {
      setTestLoading(false);
    }
  };

  const ToggleField = ({ field, label, desc }: { field: keyof MoodleSettings; label: string; desc: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => toggle(field)}
        className={`transition-colors ${settings[field as keyof typeof settings] ? 'text-primary' : 'text-gray-300'}`}
      >
        {settings[field as keyof typeof settings]
          ? <ToggleRight className="w-8 h-8" />
          : <ToggleLeft className="w-8 h-8" />}
      </button>
    </div>
  );

  return (
    <DashboardLayout role="admin" title="Moodle Integration Settings" subtitle="Configure Moodle LMS connection">
      <Toast {...toast} onClose={hideToast} />
      <div className="max-w-2xl space-y-5">
        {/* Info box */}
        <div className="bg-secondary-50 border border-secondary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-secondary-600">
              This platform connects to Moodle using secure backend APIs. The frontend does not connect directly to the Moodle database.
            </p>
          </div>
        </div>

        {/* Connection Settings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionHeader
            icon={<Globe className="w-4 h-4 text-secondary" />}
            title="Connection Settings"
            helper="Moodle instance URL and authentication"
            color="bg-secondary-50"
            dividerColor="bg-secondary"
          />
          <div className="space-y-4">
            <Input
              label="Moodle Base URL"
              type="url"
              value={settings.base_url}
              onChange={(e) => setSettings((s) => ({ ...s, base_url: e.target.value }))}
              placeholder="https://moodle-212157-0.cloudclusters.net"
              helper="The base URL of your Moodle instance"
            />
            <Input
              label="Moodle API Token"
              type="password"
              value={settings.api_token}
              onChange={(e) => setSettings((s) => ({ ...s, api_token: e.target.value }))}
              placeholder="Enter Moodle Web Services token"
              helper="Found in Moodle > Site Administration > Plugins > Web Services"
            />
            <Input
              label="Default Moodle Category"
              value={settings.default_category}
              onChange={(e) => setSettings((s) => ({ ...s, default_category: e.target.value }))}
              placeholder="e.g., Capacity Building"
              helper="Default course category for auto-created courses"
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={handleTestConnection} loading={testLoading} icon={<TestTube2 className="w-4 h-4" />}>
                Test Connection
              </Button>
            </div>
          </div>
        </div>

        {/* Integration Options */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <SectionHeader
            icon={<ToggleRight className="w-4 h-4 text-primary" />}
            title="Integration Options"
            helper="Configure automatic Moodle sync behaviors"
            color="bg-primary-50"
            dividerColor="bg-primary-500"
          />
          <ToggleField
            field="auto_user_creation"
            label="Enable Auto User Creation"
            desc="Automatically create a Moodle user account when a participant is approved"
          />
          <ToggleField
            field="auto_course_enrolment"
            label="Enable Auto Course Enrolment"
            desc="Automatically enrol approved participants in their assigned Moodle courses"
          />
          <ToggleField
            field="sso_enabled"
            label="SSO Enabled"
            desc="Enable Single Sign-On between this portal and Moodle LMS"
          />
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={loading} size="lg" icon={<Save className="w-4 h-4" />}>
            Save Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
