import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { profileService } from '../../services/profile.service.js';

const emptyProfile = {
  fullName: '',
  email: '',
  profileImageUrl: '',
  college: '',
  degree: '',
  branch: '',
  graduationYear: '',
  skills: [],
  targetRole: '',
  targetCompany: '',
  resumeUrl: '',
  bio: '',
  completion: 0,
};

function normalizeForm(profile) {
  return {
    ...emptyProfile,
    ...profile,
    skills: Array.isArray(profile?.skills) ? profile.skills.join(', ') : '',
    graduationYear: profile?.graduationYear || '',
  };
}

function Field({ label, value }) {
  return (
    <div className="rounded-xl bg-[var(--theme-surface-alt)] p-4">
      <p className="text-xs font-semibold uppercase text-[var(--theme-muted-text)]">{label}</p>
      <p className="mt-2 min-h-6 text-sm font-medium text-[var(--theme-text)]">{value || 'Not added yet'}</p>
    </div>
  );
}

function ProfilePage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    profileService.getMyProfile()
      .then((data) => {
        setProfile(data.profile || emptyProfile);
        setForm(normalizeForm(data.profile || emptyProfile));
        setEditing((data.profile?.completion || 0) === 0);
      })
      .catch((err) => setError(err.message || 'Unable to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const skills = useMemo(() => {
    if (Array.isArray(profile.skills)) return profile.skills;
    return [];
  }, [profile.skills]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        ...form,
        skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      };
      const data = await profileService.updateMyProfile(payload);
      setProfile(data.profile);
      setForm(normalizeForm(data.profile));
      setEditing(false);
      setMessage(data.message || 'Profile saved successfully.');
    } catch (err) {
      setError(err.message || 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-[var(--theme-secondary-text)]">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[var(--theme-primary-soft)] text-xl font-bold text-[var(--theme-primary)]">
              {profile.profileImageUrl ? <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" /> : (profile.fullName || 'A').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase text-[var(--theme-primary)]">Candidate Profile</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--theme-text)]">{profile.fullName || 'Complete your profile'}</h1>
              <p className="mt-1 text-sm text-[var(--theme-secondary-text)]">{profile.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-[var(--theme-surface-alt)] px-3 py-2 text-sm font-semibold text-[var(--theme-secondary-text)]">
              {profile.completion || 0}% complete
            </span>
            <Button type="button" variant="secondary" onClick={() => setEditing((value) => !value)}>
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>
      </section>

      {message && <p className="mt-6 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm font-medium text-[var(--theme-success)]">{message}</p>}
      {error && <p className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm font-medium text-[var(--theme-danger)]">{error}</p>}

      {(profile.completion || 0) === 0 && !editing && (
        <div className="mt-6">
          <EmptyState
            title="Profile not completed"
            description="Add your academic, career, and resume details so AscendIQ can personalize future interview preparation."
            action={<Button onClick={() => setEditing(true)}>Set Up Profile</Button>}
          />
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Personal Information</h2>
            <div className="mt-5 space-y-5">
              <Input label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} />
              <Input label="Email" name="email" value={form.email} onChange={handleChange} disabled />
              <Input label="Profile Image URL" name="profileImageUrl" value={form.profileImageUrl} onChange={handleChange} placeholder="Cloudinary URL later" />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Academic Information</h2>
            <div className="mt-5 space-y-5">
              <Input label="College" name="college" value={form.college} onChange={handleChange} />
              <Input label="Degree" name="degree" value={form.degree} onChange={handleChange} />
              <Input label="Branch" name="branch" value={form.branch} onChange={handleChange} />
              <Input label="Graduation Year" name="graduationYear" type="number" value={form.graduationYear} onChange={handleChange} />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Career Information</h2>
            <div className="mt-5 space-y-5">
              <Input label="Skills" name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, MongoDB" />
              <Input label="Target Role" name="targetRole" value={form.targetRole} onChange={handleChange} />
              <Input label="Target Company" name="targetCompany" value={form.targetCompany} onChange={handleChange} />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Professional Information</h2>
            <div className="mt-5 space-y-5">
              <Input label="Resume URL" name="resumeUrl" value={form.resumeUrl} onChange={handleChange} placeholder="Cloudinary URL later" />
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-[var(--theme-secondary-text)]">Bio</span>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={5}
                  className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] placeholder:text-[var(--theme-muted-text)] focus:border-[var(--theme-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--theme-primary-soft)]"
                />
              </label>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </section>
        </form>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Academic Information</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="College" value={profile.college} />
              <Field label="Degree" value={profile.degree} />
              <Field label="Branch" value={profile.branch} />
              <Field label="Graduation Year" value={profile.graduationYear} />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Career Information</h2>
            <div className="mt-5 grid gap-4">
              <Field label="Target Role" value={profile.targetRole} />
              <Field label="Target Company" value={profile.targetCompany} />
              <div className="rounded-xl bg-[var(--theme-surface-alt)] p-4">
                <p className="text-xs font-semibold uppercase text-[var(--theme-muted-text)]">Skills</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.length ? skills.map((skill) => (
                    <span key={skill} className="rounded-lg bg-[var(--theme-surface)] px-3 py-2 text-xs font-semibold text-[var(--theme-secondary-text)]">
                      {skill}
                    </span>
                  )) : <p className="text-sm font-medium text-[var(--theme-text)]">Not added yet</p>}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Professional Information</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <Field label="Resume URL" value={profile.resumeUrl} />
              <Field label="Bio" value={profile.bio} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
