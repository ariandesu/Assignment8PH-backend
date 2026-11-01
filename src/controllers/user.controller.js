export const userController = {
  // GET /api/users/me - JWT - Get current profile
  getProfile: async (req, res) => {
    try {
      res.json({
        success: true,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/users/me - JWT - Update profile
  updateProfile: async (req, res) => {
    try {
      const { name, email, image } = req.body;

      const updates = {};
      if (name !== undefined) updates.name = name.trim();
      if (email !== undefined) updates.email = email.trim();
      if (image !== undefined) updates.image = image.trim();

      res.json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          id: req.user.id,
          ...updates,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export default userController;
