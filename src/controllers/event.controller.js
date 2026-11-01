import { ObjectId } from 'mongodb';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORT_FIELDS = { eventDate: 1, createdAt: -1, title: 1 };
const EDITABLE_FIELDS = ['title', 'description', 'category', 'image', 'location', 'eventDate'];

const pickEventFields = (body) => {
  const data = {};
  EDITABLE_FIELDS.forEach((field) => {
    if (body[field] === undefined) return;
    data[field] = field === 'eventDate' ? new Date(body[field]) : String(body[field]).trim();
  });
  return data;
};

const findOwnedEvent = async (db, id, userId, res) => {
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'Invalid event ID.' });
    return null;
  }
  const event = await db.collection('events').findOne({ _id: new ObjectId(id) });
  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found.' });
    return null;
  }
  if (String(event.creatorId) !== String(userId)) {
    res.status(403).json({ success: false, message: 'You can only change events you created.' });
    return null;
  }
  return event;
};

export const eventController = {
  // GET /api/events - Public - Upcoming events only
  getUpcomingEvents: async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
      const skip = (page - 1) * limit;
      const search = String(req.query.search || '').trim();
      const category = String(req.query.category || '').trim();
      const location = String(req.query.location || '').trim();
      const sortField = SORT_FIELDS[req.query.sort] ? req.query.sort : 'eventDate';

      const filter = { eventDate: { $gt: new Date() } };
      if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };
      if (category) filter.category = category;
      if (location) filter.location = { $regex: escapeRegex(location), $options: 'i' };

      const [events, total] = await Promise.all([
        db.collection('events')
          .find(filter)
          .sort({ [sortField]: SORT_FIELDS[sortField] })
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection('events').countDocuments(filter),
      ]);

      res.json({
        success: true,
        events,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/events/recent - Public - Six nearest upcoming events by date
  getRecentEvents: async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const events = await db.collection('events')
        .find({ eventDate: { $gt: new Date() } })
        .sort({ eventDate: 1 })
        .limit(6)
        .toArray();

      res.json({ success: true, events });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/events/:id - Public - Event details
  getEventById: async (req, res, next) => {
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

      const participantCount = await db.collection('eventParticipants').countDocuments({ eventId: id });

      res.json({ success: true, event: { ...event, participantCount } });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/events - JWT - Create event
  createEvent: async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const now = new Date();
      const newEvent = {
        ...pickEventFields(req.body),
        creatorId: req.user.id,
        creatorEmail: req.user.email,
        creatorName: req.user.name || '',
        createdAt: now,
        updatedAt: now,
      };

      const result = await db.collection('events').insertOne(newEvent);

      res.status(201).json({
        success: true,
        message: 'Event created successfully.',
        event: { ...newEvent, _id: result.insertedId },
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/my-events - JWT - Events created by the logged-in user
  getMyEvents: async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const events = await db.collection('events')
        .find({ creatorId: req.user.id })
        .sort({ eventDate: 1 })
        .toArray();

      const counts = await db.collection('eventParticipants').aggregate([
        { $match: { eventId: { $in: events.map((e) => e._id.toString()) } } },
        { $group: { _id: '$eventId', count: { $sum: 1 } } },
      ]).toArray();
      const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

      res.json({
        success: true,
        events: events.map((e) => ({ ...e, participantCount: countMap[e._id.toString()] || 0 })),
      });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/events/:id - JWT + owner - Update event
  updateEvent: async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const { id } = req.params;
      const event = await findOwnedEvent(db, id, req.user.id, res);
      if (!event) return;

      const updates = { ...pickEventFields(req.body), updatedAt: new Date() };
      const updatedEvent = await db.collection('events').findOneAndUpdate(
        { _id: new ObjectId(id), creatorId: req.user.id },
        { $set: updates },
        { returnDocument: 'after' }
      );

      res.json({ success: true, message: 'Event updated successfully.', event: updatedEvent });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/events/:id - JWT + owner - Delete event
  deleteEvent: async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const { id } = req.params;
      const event = await findOwnedEvent(db, id, req.user.id, res);
      if (!event) return;

      await db.collection('events').deleteOne({ _id: new ObjectId(id), creatorId: req.user.id });
      await db.collection('eventParticipants').deleteMany({ eventId: id });

      res.json({ success: true, message: 'Event deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },
};

export default eventController;
