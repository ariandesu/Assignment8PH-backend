import { ObjectId } from 'mongodb';

export const eventController = {
  // GET /api/events - Public - Get upcoming events
  getUpcomingEvents: async (req, res) => {
    try {
      const db = req.app.locals.db;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 9;
      const skip = (page - 1) * limit;
      const search = req.query.search || '';
      const category = req.query.category || '';
      const location = req.query.location || '';
      const sort = req.query.sort || 'eventDate';

      const filter = {
        eventDate: { $gt: new Date() },
      };

      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }
      if (category) {
        filter.category = category;
      }
      if (location) {
        filter.location = { $regex: location, $options: 'i' };
      }

      const events = await db.collection('events')
        .find(filter)
        .sort({ [sort]: 1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await db.collection('events').countDocuments(filter);

      res.json({
        success: true,
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/events/recent - Public - Get six recent upcoming events
  getRecentEvents: async (req, res) => {
    try {
      const db = req.app.locals.db;
      const events = await db.collection('events')
        .find({ eventDate: { $gt: new Date() } })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      res.json({ success: true, events });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/events/:id - Public - Get event details
  getEventById: async (req, res) => {
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

      // Count participants
      const participantCount = await db.collection('eventParticipants')
        .countDocuments({ eventId: id });

      res.json({
        success: true,
        event: { ...event, participantCount },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/events - JWT - Create event
  createEvent: async (req, res) => {
    try {
      const db = req.app.locals.db;
      const { title, description, category, image, location, eventDate } = req.body;

      const newEvent = {
        title: title.trim(),
        description: description.trim(),
        category,
        image: image.trim(),
        location: location.trim(),
        eventDate: new Date(eventDate),
        creatorId: req.user.id,
        creatorEmail: req.user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('events').insertOne(newEvent);

      res.status(201).json({
        success: true,
        message: 'Event created successfully.',
        event: { ...newEvent, _id: result.insertedId },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/my-events - JWT - Get user's created events
  getMyEvents: async (req, res) => {
    try {
      const db = req.app.locals.db;
      const events = await db.collection('events')
        .find({ creatorId: req.user.id })
        .sort({ createdAt: -1 })
        .toArray();

      // Add participant count to each event
      const eventsWithCounts = await Promise.all(events.map(async (event) => {
        const count = await db.collection('eventParticipants')
          .countDocuments({ eventId: event._id.toString() });
        return { ...event, participantCount: count };
      }));

      res.json({ success: true, events: eventsWithCounts });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/events/:id - JWT + Owner - Update event
  updateEvent: async (req, res) => {
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

      if (String(event.creatorId) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this event.' });
      }

      const updates = {};
      const allowedFields = ['title', 'description', 'category', 'image', 'location', 'eventDate'];
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = field === 'eventDate' ? new Date(req.body[field]) : req.body[field].trim();
        }
      });
      updates.updatedAt = new Date();

      await db.collection('events').updateOne({ _id: new ObjectId(id) }, { $set: updates });

      const updatedEvent = await db.collection('events').findOne({ _id: new ObjectId(id) });

      res.json({
        success: true,
        message: 'Event updated successfully.',
        event: updatedEvent,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // DELETE /api/events/:id - JWT + Owner - Delete event
  deleteEvent: async (req, res) => {
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

      if (String(event.creatorId) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this event.' });
      }

      await db.collection('events').deleteOne({ _id: new ObjectId(id) });
      await db.collection('eventParticipants').deleteMany({ eventId: id });

      res.json({
        success: true,
        message: 'Event deleted successfully.',
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export default eventController;
