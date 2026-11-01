export const eventValidator = {
  create: (body) => {
    const errors = [];

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters.');
    }

    if (!body.description || typeof body.description !== 'string' || body.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters.');
    }

    const validCategories = [
      'Donation', 'Plantation', 'Cleanup', 'Blood Donation', 'Education', 'Health', 'Other'
    ];
    if (!body.category || !validCategories.includes(body.category)) {
      errors.push('Please select a valid category.');
    }

    if (!body.image || !/^https?:\/\/.+\/.+/.test(body.image.trim())) {
      errors.push('Please provide a valid image URL.');
    }

    if (!body.location || typeof body.location !== 'string' || body.location.trim().length < 3) {
      errors.push('Location is required.');
    }

    if (!body.eventDate) {
      errors.push('Event date is required.');
    } else {
      const eventDate = new Date(body.eventDate);
      if (isNaN(eventDate.getTime()) || eventDate <= new Date()) {
        errors.push('Event date must be in the future.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  update: (body) => {
    const errors = [];

    if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim().length < 3)) {
      errors.push('Title must be at least 3 characters.');
    }

    if (body.description !== undefined && (typeof body.description !== 'string' || body.description.trim().length < 10)) {
      errors.push('Description must be at least 10 characters.');
    }

    if (body.eventDate !== undefined) {
      const eventDate = new Date(body.eventDate);
      if (isNaN(eventDate.getTime()) || eventDate <= new Date()) {
        errors.push('Event date must be in the future.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

export const userValidator = {
  updateProfile: (body) => {
    const errors = [];

    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length < 2)) {
      errors.push('Name must be at least 2 characters.');
    }

    if (body.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push('Please provide a valid email address.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};
