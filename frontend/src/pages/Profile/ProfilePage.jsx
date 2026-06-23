import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { profileService } from '../../services/profile.service.js';
import { DashboardLayout } from '../../layouts/DashboardLayout.jsx';

const emptyProfile = {
  fullName: '',
  email: '',
  profileImageUrl: '',
  college: '',
  degree: '',
  branch: '',
  graduationYear: '',
  skills: [],
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
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeProgress, setResumeProgress] = useState(0);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [resumeMessage, setResumeMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [resumeError, setResumeError] = useState('');
  const avatarInputRef = useRef(null);
  const resumeInputRef = useRef(null);

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

  const handleAvatarFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    setAvatarLoading(true);
    setAvatarError('');
    setAvatarMessage('');

    try {
      const data = await profileService.uploadAvatar(file, (progressEvent) => {
        if (progressEvent.lengthComputable) {
          setAvatarProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });
      setProfile(data.profile);
      setForm(normalizeForm(data.profile));
      setAvatarMessage('Profile image uploaded successfully.');
      setMessage('Profile image updated.');
    } catch (err) {
      setAvatarError(err.message || 'Unable to upload avatar.');
    } finally {
      setAvatarLoading(false);
      setAvatarProgress(0);
    }
  };

  const handleResumeFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setResumeError('Please upload a PDF resume.');
      return;
    }

    setResumeLoading(true);
    setResumeError('');
    setResumeMessage('');
    setResumeProgress(0);

    try {
      const data = await profileService.uploadResume(file, (progressEvent) => {
        if (progressEvent.lengthComputable) {
          setResumeProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });
      setProfile(data.profile);
      setForm(normalizeForm(data.profile));
      setResumeMessage('Resume uploaded successfully.');
      setMessage('Resume updated successfully.');
    } catch (err) {
      setResumeError(err.message || 'Unable to upload resume.');
    } finally {
      setResumeLoading(false);
      setResumeProgress(0);
    }
  };

  const handleAvatarUploadClick = () => {
    avatarInputRef.current?.click();
  };

  const handleResumeUploadClick = () => {
    resumeInputRef.current?.click();
  };

  const handleAvatarDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files?.length) {
      handleAvatarFiles(event.dataTransfer.files);
    }
  };

  const handleAvatarDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDeleteAvatar = async () => {
    setAvatarLoading(true);
    setAvatarError('');
    try {
      const data = await profileService.deleteAvatar();
      setProfile((prev) => ({ ...prev, profileImageUrl: '', profileImagePublicId: '' }));
      setForm((prev) => ({ ...prev, profileImageUrl: '' }));
      setMessage(data.message || 'Avatar deleted successfully.');
    } catch (err) {
      setAvatarError(err.message || 'Unable to delete avatar.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleDeleteResume = async () => {
    setResumeLoading(true);
    setResumeError('');
    try {
      const data = await profileService.deleteResume();
      setProfile((prev) => ({ ...prev, resumeUrl: '', resumePublicId: '', resumeFileName: '', resumeUploadedAt: null }));
      setForm((prev) => ({ ...prev, resumeUrl: '' }));
      setMessage(data.message || 'Resume deleted successfully.');
    } catch (err) {
      setResumeError(err.message || 'Unable to delete resume.');
    } finally {
      setResumeLoading(false);
    }
  };

  const formattedResumeName = profile.resumeFileName || profile.resumeUrl?.split('/').pop() || '';
  const formattedResumeDate = profile.resumeUploadedAt ? new Date(profile.resumeUploadedAt).toLocaleDateString() : null;

  const showAvatarPlaceholder = !profile.profileImageUrl;

  const resumeSectionContent = profile.resumeUrl ? (
    <>
      <p className="text-sm font-semibold text-[var(--theme-text)]">{formattedResumeName || 'Uploaded resume'}</p>
      {formattedResumeDate && <p className="text-sm text-[var(--theme-secondary-text)]">Uploaded on {formattedResumeDate}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg bg-[var(--theme-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--theme-primary)] hover:bg-[var(--theme-surface)]">
          View Resume
        </a>
        <Button type="button" variant="secondary" onClick={handleResumeUploadClick} disabled={resumeLoading}>
          {resumeLoading ? 'Replacing...' : 'Replace Resume'}
        </Button>
        <Button type="button" variant="danger" onClick={handleDeleteResume} disabled={resumeLoading}>
          Delete Resume
        </Button>
      </div>
    </>
  ) : (
    <>
      <p className="text-sm font-semibold text-[var(--theme-text)]">No resume uploaded yet.</p>
      <p className="mt-2 text-sm text-[var(--theme-secondary-text)]">Upload your resume in PDF format to complete your profile.</p>
      <Button type="button" className="mt-4" onClick={handleResumeUploadClick} disabled={resumeLoading}>
        {resumeLoading ? 'Uploading...' : 'Upload Resume'}
      </Button>
    </>
  );

  const avatarSectionContent = (
    <div
      className="group relative flex h-48 w-48 cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface-alt)] text-center transition hover:border-[var(--theme-primary)]"
      onDrop={handleAvatarDrop}
      onDragOver={handleAvatarDragOver}
      onClick={handleAvatarUploadClick}
    >
      {profile.profileImageUrl ? (
        <img src={profile.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 px-4 text-sm text-[var(--theme-secondary-text)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--theme-primary-soft)] text-2xl font-bold text-[var(--theme-primary)]">
            {profile.fullName ? profile.fullName.slice(0, 2).toUpperCase() : 'A'}
          </div>
          <p className="max-w-[12rem]">Drag & drop an image here, or click to upload</p>
          <p className="text-xs">JPEG, PNG, WEBP (max 2MB)</p>
        </div>
      )}
      {avatarLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
          Uploading...
        </div>
      )}
    </div>
  );

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
    <DashboardLayout>
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
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--theme-secondary-text)]">Profile Photo</label>
                <div className="flex flex-col items-start gap-3">
                  {avatarSectionContent}
                  {avatarError && <p className="text-sm text-[var(--theme-danger)]">{avatarError}</p>}
                  {avatarMessage && <p className="text-sm text-[var(--theme-success)]">{avatarMessage}</p>}
                  {profile.profileImageUrl && (
                    <Button type="button" variant="danger" onClick={handleDeleteAvatar} disabled={avatarLoading}>
                      {avatarLoading ? 'Deleting...' : 'Delete Avatar'}
                    </Button>
                  )}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={(event) => handleAvatarFiles(event.target.files)} />
              </div>
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
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Skills</h2>
            <div className="mt-5 space-y-5">
              <Input label="Skills" name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, MongoDB" />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Professional Information</h2>
            <div className="mt-5 space-y-5">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--theme-secondary-text)]">Resume</label>
                {resumeSectionContent}
                {resumeError && <p className="text-sm text-[var(--theme-danger)]">{resumeError}</p>}
                {resumeMessage && <p className="text-sm text-[var(--theme-success)]">{resumeMessage}</p>}
                {resumeProgress > 0 && (
                  <div className="rounded-full bg-[var(--theme-border)] p-1">
                    <div className="h-2 rounded-full bg-[var(--theme-primary)]" style={{ width: `${resumeProgress}%` }} />
                  </div>
                )}
                <input ref={resumeInputRef} type="file" accept="application/pdf" className="hidden" onChange={(event) => handleResumeFiles(event.target.files)} />
              </div>
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
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Skills</h2>
            <div className="mt-5 grid gap-4">
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
              <div className="rounded-xl bg-[var(--theme-surface-alt)] p-4">
                <p className="text-xs font-semibold uppercase text-[var(--theme-muted-text)]">Resume</p>
                {profile.resumeUrl ? (
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--theme-text)]">{formattedResumeName || 'Uploaded resume'}</p>
                      {formattedResumeDate && <p className="text-xs text-[var(--theme-secondary-text)]">Uploaded on {formattedResumeDate}</p>}
                    </div>
                    <a
                      href={profile.resumeUrl}
                      download={formattedResumeName}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-2 text-sm font-semibold text-[var(--theme-primary)] hover:bg-[var(--theme-surface-alt)] transition"
                    >
                      Download PDF
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-medium text-[var(--theme-text)]">No resume uploaded yet</p>
                )}
              </div>
              <Field label="Bio" value={profile.bio} />
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default ProfilePage;
