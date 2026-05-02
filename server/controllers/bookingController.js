const QRCode  = require('qrcode');
const Booking = require('../models/Booking');
const Event   = require('../models/Event');

/* ─── helpers ─────────────────────────────────────────── */

/** Parse "HH:MM" or "HH:MM AM/PM" → { hours, minutes } */
function parseTime(str = '') {
  const clean = str.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const meridiem = (match[3] || '').toUpperCase();
  if (meridiem === 'PM' && h < 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return { hours: h, minutes: m };
}

/** Returns true if the QR window for this event has closed */
function isQRExpired(event) {
  if (!event) return false;
  const eventDate = new Date(event.date);
  // Use endTime if available, else event start time
  const timeStr  = event.endTime || event.time;
  const parsed   = parseTime(timeStr);
  if (parsed) {
    eventDate.setHours(parsed.hours, parsed.minutes, 0, 0);
  } else {
    eventDate.setHours(23, 59, 59, 999);
  }
  // 2-hour grace period after event end for late check-in
  const expiryTime = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);
  return new Date() > expiryTime;
}

/* ─── controllers ─────────────────────────────────────── */

exports.createBooking = async (req, res) => {
  try {
    const {
      eventId, tickets, totalAmount, paymentId,
      razorpayOrderId, attendeeName, attendeeEmail, attendeePhone,
    } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    // Check if event has already passed
    const now = new Date();
    const eventDate = new Date(event.date);
    if (eventDate < now && event.status !== 'upcoming' && event.status !== 'ongoing') {
      return res.status(400).json({ message: 'Cannot book a past or cancelled event.' });
    }

    // Deduct seats
    for (const item of tickets) {
      const tier = event.ticketTiers.find(t => t.name === item.tierName);
      if (!tier) return res.status(400).json({ message: `Tier "${item.tierName}" not found.` });
      if (tier.availableSeats < item.quantity)
        return res.status(400).json({ message: `Only ${tier.availableSeats} seats left in "${item.tierName}".` });
      tier.availableSeats -= item.quantity;
    }
    await event.save();

    const isFreeBooking = totalAmount === 0;
    const booking = await Booking.create({
      user:  req.user._id,
      event: eventId,
      tickets,
      totalAmount,
      isFreeBooking,
      paymentId:       paymentId       || '',
      razorpayOrderId: razorpayOrderId || '',
      paymentStatus:   (isFreeBooking || paymentId) ? 'paid' : 'pending',
      attendeeName:    attendeeName    || req.user.name,
      attendeeEmail:   attendeeEmail   || req.user.email,
      attendeePhone:   attendeePhone   || req.user.phone || '',
    });

    // Embed event-expiry timestamp in QR payload so client can also validate
    const qrPayload = JSON.stringify({
      bookingId: booking.bookingId,
      event:     event.title,
      eventId:   event._id,
      date:      event.date,
      time:      event.time,
      endTime:   event.endTime,
      venue:     event.venue?.name,
      attendee:  booking.attendeeName,
      tickets:   tickets.map(t => `${t.tierName} ×${t.quantity}`).join(', '),
      issuedAt:  new Date().toISOString(),
    });

    booking.qrCode = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    });
    await booking.save();
    await booking.populate('event', 'title date venue image');
    res.status(201).json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event', 'title date time endTime venue image category')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email phone')
      .populate('event', 'title date time venue image category')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── QR lookup (read-only preview, no state change) ── */
exports.lookupBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .populate('event', 'title date time endTime venue image category')
      .populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const expired = isQRExpired(booking.event);
    res.json({ booking, expired });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Validate / check-in (marks isValidated = true) ── */
exports.validateTicket = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .populate('event', 'title date time endTime venue image category')
      .populate('user', 'name email phone');

    if (!booking)
      return res.status(404).json({ message: 'Booking not found.' });

    if (booking.paymentStatus !== 'paid')
      return res.status(400).json({ message: 'Payment not completed for this booking.', booking });

    // ── QR Expiry Check ──────────────────────────────────────────
    if (isQRExpired(booking.event)) {
      return res.status(400).json({
        message: '⏰ QR Code Expired — this event has ended and check-in is closed.',
        expired: true,
        booking,
      });
    }

    if (booking.isValidated)
      return res.status(400).json({ message: '⚠️ Ticket already scanned & used!', alreadyUsed: true, booking });

    booking.isValidated = true;
    await booking.save();

    res.json({
      message: '✅ Ticket validated! Welcome in.',
      booking,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking)            return res.status(404).json({ message: 'Booking not found.' });
    if (booking.isValidated) return res.status(400).json({ message: 'Cannot cancel a validated ticket.' });

    booking.paymentStatus = 'refunded';
    await booking.save();

    // Restore seats
    const event = await Event.findById(booking.event);
    if (event) {
      for (const item of booking.tickets) {
        const tier = event.ticketTiers.find(t => t.name === item.tierName);
        if (tier) tier.availableSeats += item.quantity;
      }
      await event.save();
    }
    res.json({ message: 'Booking cancelled successfully.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};