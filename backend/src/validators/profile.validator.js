const optionalString = (value, max, label, errors) => {
  if (value !== undefined && typeof value !== 'string') {
    errors.push(`${label} must be a string.`);
    return;
  }
  if (typeof value === 'string' && value.length > max) {
    errors.push(`${label} cannot exceed ${max} characters.`);
  }
};

const optionalUrl = (value, label, errors) => {
  if (!value) return;
  try {
    new URL(value);
  } catch {
    errors.push(`${label} must be a valid URL.`);
  }
};

export const validateProfile = (req, res, next) => {
  const {
    fullName,
    profileImageUrl,
    college,
    degree,
    branch,
    graduationYear,
    skills,
    targetRole,
    targetCompany,
    resumeUrl,
    bio,
  } = req.body;

  const errors = [];

  optionalString(fullName, 80, 'Full name', errors);
  optionalString(profileImageUrl, 500, 'Profile image URL', errors);
  optionalString(college, 120, 'College', errors);
  optionalString(degree, 80, 'Degree', errors);
  optionalString(branch, 80, 'Branch', errors);
  optionalString(targetRole, 100, 'Target role', errors);
  optionalString(targetCompany, 100, 'Target company', errors);
  optionalString(resumeUrl, 500, 'Resume URL', errors);
  optionalString(bio, 600, 'Bio', errors);
  optionalUrl(profileImageUrl, 'Profile image URL', errors);
  optionalUrl(resumeUrl, 'Resume URL', errors);

  if (graduationYear !== undefined && graduationYear !== null && graduationYear !== '') {
    const year = Number(graduationYear);
    if (!Number.isInteger(year) || year < 1950 || year > 2100) {
      errors.push('Graduation year must be between 1950 and 2100.');
    }
  }

  if (skills !== undefined && !Array.isArray(skills) && typeof skills !== 'string') {
    errors.push('Skills must be an array or comma-separated string.');
  }

  if (Array.isArray(skills) && skills.some((skill) => typeof skill !== 'string')) {
    errors.push('Each skill must be a string.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};
