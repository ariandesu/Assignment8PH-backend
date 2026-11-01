export const userController = {
  // GET /api/users/me - JWT - identity from the verified token
  getProfile: async (req, res) => {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        image: req.user.image,
      },
    });
  },
};

export default userController;
