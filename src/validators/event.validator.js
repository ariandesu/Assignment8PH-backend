export const EVENT_CATEGORIES = [
  'Cleanup', 'Plantation', 'Donation', 'Blood Donation', 'Education', 'Health', 'Other',
];

const isNonEmptyString = (v, min) => typeof v === 'string' && v.trim().length >= min;
const isImageUrl = (v) => typeof v === 'string' && /^https?:\/\/\S+$/i.test(v.trim());

const checkDate = (value, errors) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    errors.push('Please provide a valid event date.');
  } else if (date <= new Date()) {
    errors.push('Event date must be in the future.');
  }
};

const rules = {
  title: (v, e) => { if (!isNonEmptyString(v, 3) || v.trim().length > 120) e.push('Title must be 3-120 characters.'); },
  description: (v, e) => { if (!isNonEmptyString(v, 10) || v.trim().length > 2000) e.push('Description must be 10-2000 characters.'); },
  category: (v, e) => { if (!EVENT_CATEGORIES.includes(v)) e.push('Please select a valid event type.'); },
  image: (v, e) => { if (!isImageUrl(v)) e.push('Please provide a valid image URL (http or https).'); },
  location: (v, e) => { if (!isNonEmptyString(v, 3) || v.trim().length > 150) e.push('Location must be 3-150 characters.'); },
  eventDate: (v, e) => checkDate(v, e),
};

export const eventValidator = {
  create: (body) => {
    const errors = [];
    Object.entries(rules).forEach(([field, check]) => check(body[field], errors));
    return { isValid: errors.length === 0, errors };
  },

  update: (body) => {
    const errors = [];
    const fields = Object.keys(rules).filter((f) => body[f] !== undefined);
    if (fields.length === 0) errors.push('Nothing to update.');
    fields.forEach((field) => rules[field](body[field], errors));
    return { isValid: errors.length === 0, errors };
  },
};
