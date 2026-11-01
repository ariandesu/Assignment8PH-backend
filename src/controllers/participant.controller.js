import { ObjectId } from 'mongodb';

export const participantController = {
  // POST /api/events/:id/join - JWT - Join event
  joinEvent: async (req, res) => {
    try {
      const db = req.app.locals.db;
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid event ID.' });
      }

      // Verify event exists and is not expired
      const event = await db.collection('events').findOne({ _id: new ObjectId(id) });
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }

      if (new Date(event.eventDate) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot join an expired event.',
        });
      }

      // Check if already joined (unique index also enforces this at DB level)
      const existing = await db.collection('eventParticipants').findOne({
        eventId: id,
        userId: req.user.id,
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'You have already joined this event.',
        });
      }

      const participation = {
        eventId: id,
        userId: req.user.id,
        userEmail: req.user.email,
        joinedAt: new Date(),
      };

      await db.collection('eventParticipants').insertOne(participation);

      res.status(201).json({
        success: true,
        message: 'Successfully joined the event.',
        participation,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'You have already joined this event.',
        });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/my-joined-events - JWT - Get joined events
  getJoinedEvents: async (req, res) => {
    try {
      const db = req.app.locals.db;

      // 1. Find participant records by authenticated user ID
      const participations = await db.collection('eventParticipants')
        .find({ userId: req.user.id })
        .toArray();

      if (participations.length === 0) {
        return res.json({ success: true, events: [] });
      }

      // 2. Collect their event IDs
      const eventIds = participations.map((p) => p.eventId);

      // 3. Retrieve the matching events
      const events = await db.collection('events')
        .find({
          _id: { $in: eventIds.map((id) => new ObjectId(id)) },
        })
        .toArray();

      // 4. Sort by event date ascending
      events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

      // Add organizer info
      const eventsWithOrganizer = events.map((event) => ({
        ...event,
        organizerEmail: event.creatorEmail,
      }));

      res.json({ success: true, events: eventsWithOrganizer });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export default participantController;
