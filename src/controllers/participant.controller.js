import { ObjectId } from 'mongodb';

export const participantController = {
  // POST /api/events/:id/join - JWT - Join event
  joinEvent: async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid event ID.' });
      }

      const event = await db.collection('events').findOne({ _id: new ObjectId(id) });
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }

      if (new Date(event.eventDate) <= new Date()) {
        return res.status(400).json({ success: false, message: 'This event has already taken place.' });
      }

      const participation = {
        eventId: id,
        eventTitle: event.title,
        eventDate: event.eventDate,
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name || '',
        joinedAt: new Date(),
      };

      // Unique index on { eventId, userId } rejects duplicates (handled below)
      await db.collection('eventParticipants').insertOne(participation);

      res.status(201).json({ success: true, message: 'You have joined this event.', participation });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'You have already joined this event.' });
      }
      next(err);
    }
  },

  // GET /api/events/:id/join-status - JWT - Has the user joined this event?
  getJoinStatus: async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const joined = await db.collection('eventParticipants').findOne({
        eventId: req.params.id,
        userId: req.user.id,
      });
      res.json({ success: true, joined: Boolean(joined) });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/my-joined-events - JWT - Events joined by the user, sorted by event date
  getJoinedEvents: async (req, res, next) => {
    try {
      const db = req.app.locals.db;

      const participations = await db.collection('eventParticipants')
        .find({ userId: req.user.id })
        .toArray();

      const ids = participations
        .map((p) => p.eventId)
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));

      if (ids.length === 0) {
        return res.json({ success: true, events: [] });
      }

      const joinedAt = Object.fromEntries(participations.map((p) => [p.eventId, p.joinedAt]));
      const events = await db.collection('events')
        .find({ _id: { $in: ids } })
        .sort({ eventDate: 1 })
        .toArray();

      res.json({
        success: true,
        events: events.map((e) => ({ ...e, joinedAt: joinedAt[e._id.toString()] })),
      });
    } catch (err) {
      next(err);
    }
  },
};

export default participantController;
