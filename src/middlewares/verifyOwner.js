export const verifyOwner = (req, res, next) => {
  const { event } = req;

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found.',
    });
  }

  // creatorId is stored as a string in MongoDB
  if (String(event.creatorId) !== String(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'You do not own this event. Access forbidden.',
    });
  }

  next();
};
