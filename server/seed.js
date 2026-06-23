/**
 * HHM Database Seed
 * IMPORTANT: Uses User.create() (not insertMany) so the pre-save hook
 * hashes passwords exactly ONCE. This is why admin login works.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const QRCode   = require('qrcode');

const User    = require('./models/User');
const Artist  = require('./models/Artist');
const Event   = require('./models/Event');
const Booking = require('./models/Booking');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/happyhappenings';
const future = d => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt; };

async function seed() {
  await mongoose.connect(MONGO);
  console.log('✅ MongoDB connected');

  // Wipe
  await Promise.all([User.deleteMany(), Artist.deleteMany(), Event.deleteMany(), Booking.deleteMany()]);
  console.log('🧹 Cleared');

  // ── Users via create() so pre-save hook fires ──────────────────────────────
  const admin = await User.create({ name: 'HHM Admin', email: 'admin@happyhappenings.music', password: 'admin123', role: 'admin', phone: '+91 99999 00000' });
  const u1    = await User.create({ name: 'Arjun Kapoor',  email: 'arjun@example.com', password: 'user123', role: 'user', phone: '+91 98765 43210' });
  const u2    = await User.create({ name: 'Priya Sharma',  email: 'priya@example.com', password: 'user123', role: 'user', phone: '+91 91234 56789' });
  const u3    = await User.create({ name: 'Rohan Mehta',   email: 'rohan@example.com', password: 'user123', role: 'user', phone: '+91 87654 32109' });
  console.log('👥 Users seeded');

  // ── Artists ──────────────────────────────────────────────────────────────
  const [nucleya, divine, prateek, djchetas, ritviz, seedheMaut, djsuketu, djnyk] = await Artist.insertMany([
    { name: 'Nucleya',      genre: 'Electronic', bio: 'Bass Raja of India. Udyan Sagar\'s earth-shaking bass music blends Indian folk with electronic beats — one of India\'s most iconic festival headliners.', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80', socialLinks: { instagram: 'https://instagram.com/nucleya', spotify: 'https://open.spotify.com' } },
    { name: 'Divine',       genre: 'Hip-Hop',    bio: 'Vivian Fernandes — the voice of Mumbai\'s streets. His raw, authentic rap about life in Kurla changed Indian hip-hop forever.', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=80', socialLinks: { instagram: 'https://instagram.com/divine' } },
    { name: 'Prateek Kuhad',genre: 'Indie',      bio: 'Jaipur\'s acoustic poet. Prateek blends Hindi and English in hauntingly beautiful indie folk songs that speak straight to the heart.', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80', socialLinks: { instagram: 'https://instagram.com/prateekkuhad', spotify: 'https://open.spotify.com' } },
    { name: 'DJ Chetas',    genre: 'Electronic', bio: 'Bollywood\'s most loved DJ. DJ Chetas turns every dancefloor into a Bollywood anthem experience with his signature remixes and live energy.', image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80', socialLinks: { instagram: 'https://instagram.com/djchetas' } },
    { name: 'Ritviz',       genre: 'Electronic', bio: 'A classically trained musician turned electronic producer — Ritviz fuses Hindustani classical with contemporary beats. Pure magic.', image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&q=80', socialLinks: { instagram: 'https://instagram.com/ritviz', spotify: 'https://open.spotify.com' } },
    { name: 'Seedhe Maut',  genre: 'Hip-Hop',    bio: 'Delhi\'s finest rap duo — Encore ABJ and Calm. Redefining Indian rap with razor-sharp lyrics and a unique underground sound.', image: 'https://images.unsplash.com/photo-1520872024865-3ff2805d8bb3?w=600&q=80', socialLinks: { instagram: 'https://instagram.com/seedhemaut' } },
    { name: 'DJ Suketu',    genre: 'Electronic', bio: 'Legendary DJ known for classic Bollywood remixes.', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80', socialLinks: {} },
    { name: 'DJ NYK',       genre: 'Electronic', bio: 'India\'s No.1 Bollywood DJ and King of Remixes.', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=80', socialLinks: {} }
  ]);
  console.log('🎤 Artists seeded');

  // ── Events ──────────────────────────────────────────────────────────────
  const events = await Event.insertMany([
    {
      title: 'Nucleya — Bass Raja Tour Mumbai',
      description: 'Mumbai, brace yourself! Nucleya\'s legendary Bass Raja Tour arrives at the Maximum City. Expect earth-shaking bass, pulsating beats, 3D visuals, and confetti cannons.\n\nNew tracks from his upcoming album premiere here. Pre-show DJ set from 7 PM. Main show 8:30 PM sharp.',
      category: 'Concert', artist: nucleya._id,
      venue: { name: 'Mahalaxmi Racecourse', city: 'Mumbai', address: 'Gate 5, Mahalaxmi, Mumbai 400034' },
      date: future(12), time: '8:00 PM', endTime: '11:30 PM',
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80',
      ticketTiers: [
        { name: 'General',      price: 999,  totalSeats: 800, availableSeats: 423, perks: 'General standing area' },
        { name: 'VIP',          price: 2499, totalSeats: 200, availableSeats: 87,  perks: 'VIP zone + 1 welcome drink' },
        { name: 'VVIP Lounge',  price: 5999, totalSeats: 50,  availableSeats: 18,  perks: 'Lounge + 2 drinks + exclusive merch' },
      ],
      isFeatured: true, isFree: false, ageLimit: '18+', dressCode: 'Casual', tags: ['bass','electronic','festival'], status: 'upcoming', createdBy: admin._id,
    },
    {
      title: 'Divine — Gully Fest Bangalore',
      description: 'The streets meet the stage. Divine brings raw, electric live hip-hop to Bangalore. Performing Mere Gully Mein, Jungli Sher, Nazar, and unreleased tracks.\n\nSurprise guests expected. Standing concert. Age 18+.',
      category: 'Live Performance', artist: divine._id,
      venue: { name: 'Palace Grounds', city: 'Bangalore', address: 'Jayamahal Road, Vasanth Nagar, Bengaluru 560080' },
      date: future(19), time: '7:30 PM', endTime: '10:30 PM',
      image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=900&q=80',
      ticketTiers: [
        { name: 'Standing', price: 799,  totalSeats: 600, availableSeats: 312, perks: 'General standing' },
        { name: 'Premium',  price: 1799, totalSeats: 150, availableSeats: 89,  perks: 'Front-zone access' },
        { name: 'VIP',      price: 3999, totalSeats: 75,  availableSeats: 31,  perks: 'VIP seated + meet & greet' },
      ],
      isFeatured: true, isFree: false, ageLimit: '18+', tags: ['hiphop','rap','divine'], status: 'upcoming', createdBy: admin._id,
    },
    {
      title: 'Prateek Kuhad — Acoustic Sessions Pune',
      description: 'An intimate stripped-down evening with the poet of our generation. Just Prateek, his guitar, and 300 lucky fans.\n\nDeep cuts, stories behind songs, and a few brand-new pieces. Seated venue — all seats are good seats.',
      category: 'Acoustic Night', artist: prateek._id,
      venue: { name: 'Blue Frog', city: 'Pune', address: 'Sangamwadi, Pune 411001' },
      date: future(26), time: '7:00 PM', endTime: '9:30 PM',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80',
      ticketTiers: [
        { name: 'Standard',      price: 1299, totalSeats: 200, availableSeats: 134, perks: 'Rows C onward' },
        { name: 'Premium',       price: 2499, totalSeats: 80,  availableSeats: 43,  perks: 'Front rows A & B' },
        { name: 'Meet & Greet',  price: 6999, totalSeats: 20,  availableSeats: 7,   perks: 'Front row + M&G + photo + signed merch' },
      ],
      isFeatured: false, isFree: false, ageLimit: 'All Ages', tags: ['indie','acoustic','intimate'], status: 'upcoming', createdBy: admin._id,
    },
    {
      title: 'Sunburn Arena — DJ Chetas Night Delhi',
      description: 'Sunburn Arena comes to Delhi! DJ Chetas headlines a spectacular Bollywood EDM night. Massive LED screens, laser shows, pyrotechnics, 5000 people dancing together.',
      category: 'DJ Night', artist: djchetas._id,
      venue: { name: 'JN Stadium', city: 'Delhi', address: 'Lodhi Road, New Delhi 110003' },
      date: future(35), time: '6:00 PM', endTime: '12:00 AM',
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=900&q=80',
      ticketTiers: [
        { name: 'Early Bird',     price: 599,   totalSeats: 500,  availableSeats: 47,   perks: 'Limited early bird pricing!' },
        { name: 'General',        price: 1199,  totalSeats: 3000, availableSeats: 1876, perks: 'General standing' },
        { name: 'VIP Zone',       price: 3499,  totalSeats: 200,  availableSeats: 112,  perks: 'VIP area + 2 drinks' },
        { name: 'Platinum Table', price: 12999, totalSeats: 30,   availableSeats: 12,   perks: 'Table for 4 + bottle service' },
      ],
      isFeatured: true, isFree: false, ageLimit: '18+', dressCode: 'Smart Casual', tags: ['dj','bollywood','edm'], status: 'upcoming', createdBy: admin._id,
    },
    {
      title: 'Ritviz — Liggi World Tour Hyderabad',
      description: 'Ritviz brings his dreamy electronic + classical fusion live show to Hyderabad! Full band show with live classical instruments backed by electronic production.\n\nThe set design is gorgeous. The music is transcendent. The vibes? Unmatched.',
      category: 'Concert', artist: ritviz._id,
      venue: { name: 'Hitex Exhibition Centre', city: 'Hyderabad', address: 'Hitec City, Hyderabad 500084' },
      date: future(42), time: '7:00 PM', endTime: '10:00 PM',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=900&q=80',
      ticketTiers: [
        { name: 'General', price: 899,  totalSeats: 500, availableSeats: 267, perks: 'General standing' },
        { name: 'VIP',     price: 2199, totalSeats: 100, availableSeats: 61,  perks: 'VIP area + 1 drink' },
      ],
      isFeatured: true, isFree: false, ageLimit: 'All Ages', tags: ['ritviz','electronic','classical'], status: 'upcoming', createdBy: admin._id,
    },
    {
      title: 'Echoes Music Festival 2025',
      description: 'India\'s most diverse independent music festival — 5th edition! 20+ artists across 4 stages covering folk, indie, electronic, hip-hop, jazz, and classical music.\n\nFood village, art installations, merch market, kids zone. Gates 11 AM. Last set at midnight.',
      category: 'Fest', artist: null,
      venue: { name: 'MMRDA Grounds', city: 'Mumbai', address: 'Bandra Kurla Complex, Mumbai 400051' },
      date: future(55), time: '11:00 AM', endTime: '12:00 AM',
      image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=900&q=80',
      ticketTiers: [
        { name: 'Day Pass',           price: 1499, totalSeats: 5000, availableSeats: 2341, perks: 'All 4 stages + food village' },
        { name: 'VIP Day',            price: 3999, totalSeats: 500,  availableSeats: 187,  perks: 'VIP zones + express entry + 2 drinks' },
        { name: 'Platinum All-Access',price: 8999, totalSeats: 100,  availableSeats: 44,   perks: 'Backstage + artist lounge + 4 drinks' },
      ],
      isFeatured: true, isFree: false, ageLimit: 'All Ages', tags: ['festival','indie','multi-genre'], status: 'upcoming', createdBy: admin._id,
    },
    {
      title: 'Seedhe Maut — Delhi Hometown Show',
      description: 'Delhi\'s own Seedhe Maut perform in their home city! Encore ABJ and Calm bring sharp, street-smart rap to a packed crowd.\n\nFull catalog: Takht, No Flex, Astra, Kaam 25 — plus new album tracks. Standing / moshpit friendly.',
      category: 'Concert', artist: seedheMaut._id,
      venue: { name: 'Siri Fort Auditorium', city: 'Delhi', address: 'Asia Games Village, New Delhi 110049' },
      date: future(22), time: '8:00 PM', endTime: '11:00 PM',
      image: 'https://images.unsplash.com/photo-1520872024865-3ff2805d8bb3?w=900&q=80',
      ticketTiers: [
        { name: 'General',    price: 699,  totalSeats: 400, availableSeats: 178, perks: 'General standing' },
        { name: 'Front Zone', price: 1499, totalSeats: 100, availableSeats: 43,  perks: 'Front standing zone' },
      ],
      isFeatured: false, isFree: false, ageLimit: '18+', tags: ['hiphop','rap','delhi'], status: 'upcoming', createdBy: admin._id,
    },
    {
      title: '🆓 Open Mic Night — Kolhapur',
      description: 'Every voice deserves a stage! HHM\'s monthly Open Mic Night — FREE entry for everyone.\n\nWant to perform? Register at the door. 5-minute slots, any genre — music, spoken word, comedy. Free chai & snacks for performers!',
      category: 'Open Mic', artist: null,
      venue: { name: 'The Chai Room', city: 'Kolhapur', address: 'Station Road, Kolhapur 416001' },
      date: future(8), time: '6:00 PM', endTime: '9:00 PM',
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=900&q=80',
      ticketTiers: [{ name: 'Free Entry', price: 0, totalSeats: 80, availableSeats: 52, perks: 'Open seating + free snacks' }],
      isFeatured: false, isFree: true, ageLimit: 'All Ages', tags: ['free','openmic','local'], status: 'upcoming', createdBy: admin._id,
    },
    {
      title: '🆓 Sunset Jam — Marine Drive Mumbai',
      description: 'End your week right! Free outdoor jam at Marine Drive — multiple local artists, rotating 30-minute sets against Mumbai\'s iconic sunset.\n\nSpread your mat, grab a coconut, let the music wash over you. Absolutely free. No registration needed.',
      category: 'Acoustic Night', artist: null,
      venue: { name: 'Marine Drive Promenade', city: 'Mumbai', address: 'Nariman Point, Marine Drive, Mumbai 400020' },
      date: future(5), time: '5:30 PM', endTime: '8:00 PM',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80',
      ticketTiers: [{ name: 'Free Entry', price: 0, totalSeats: 300, availableSeats: 187, perks: 'Open air — bring your own mat!' }],
      isFeatured: true, isFree: true, ageLimit: 'All Ages', tags: ['free','outdoor','sunset','acoustic'], status: 'upcoming', createdBy: admin._id,
    },
    {
      title: 'Music Production Masterclass Mumbai',
      description: 'Learn to produce electronic music from scratch! A hands-on 6-hour workshop covering DAW basics, sound design, mixing, and mastering.\n\nIncludes: Ableton guide, sample packs, certificate, lifetime HHM producer Discord access. Laptop required. Beginners welcome!',
      category: 'Workshop', artist: null,
      venue: { name: 'HHM Studio Space', city: 'Mumbai', address: 'Ground Floor, Andheri West, Mumbai 400058' },
      date: future(15), time: '10:00 AM', endTime: '4:00 PM',
      image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=900&q=80',
      ticketTiers: [{ name: 'Workshop Seat', price: 2999, totalSeats: 20, availableSeats: 9, perks: 'All materials + sample packs + certificate' }],
      isFeatured: false, isFree: false, ageLimit: 'All Ages', tags: ['workshop','production','ableton'], status: 'upcoming', createdBy: admin._id,
    },
    {
      title: 'Sunburn Arena — DJ Chetas Night Mumbai',
      description: 'Sunburn Arena lit up Mumbai with DJ Chetas delivering a high-energy Bollywood EDM set. Stunning visuals, laser lights, and a packed crowd made it an unforgettable night.',
      category: 'DJ Night',
      artist: djchetas._id,
      venue: {
        name: 'NSCI Dome',
        city: 'Mumbai',
        address: 'Worli, Mumbai, Maharashtra 400018'
      },
      date: new Date('2025-03-15'), // before April 1
      time: '7:00 PM',
      endTime: '11:30 PM',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80',
      ticketTiers: [
        { name: 'Early Bird',     price: 499,   totalSeats: 400,  availableSeats: 0, perks: 'Sold out early access tickets' },
        { name: 'General',        price: 999,   totalSeats: 2500, availableSeats: 0, perks: 'General standing' },
        { name: 'VIP Zone',       price: 2999,  totalSeats: 150,  availableSeats: 0, perks: 'VIP area + drinks' },
        { name: 'Platinum Table', price: 10999, totalSeats: 25,   availableSeats: 0, perks: 'Table for 4 + premium service' },
      ],
      isFeatured: false,
      isFree: false,
      ageLimit: '18+',
      dressCode: 'Party Wear',
      tags: ['dj','bollywood','edm'],
      status: 'completed',
      createdBy: admin._id,
  },
  {
    title: 'Bollywood Beats — DJ Suketu Live Pune',
    description: 'DJ Suketu brought classic Bollywood remixes and dance hits to Pune. A night full of nostalgia, high-energy drops, and a packed dance floor.',
    category: 'DJ Night',
    artist: djsuketu._id,
    venue: {
      name: 'Royal Orchid Grounds',
      city: 'Pune',
      address: 'Balewadi High Street, Pune, Maharashtra 411045'
    },
    date: new Date('2025-02-22'),
    time: '7:30 PM',
    endTime: '11:00 PM',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&q=80',
    ticketTiers: [
      { name: 'Early Bird', price: 399, totalSeats: 300, availableSeats: 0, perks: 'Limited early bird entry' },
      { name: 'General', price: 899, totalSeats: 2000, availableSeats: 0, perks: 'General standing' },
      { name: 'VIP', price: 2499, totalSeats: 120, availableSeats: 0, perks: 'VIP lounge + drinks' },
    ],
    isFeatured: false,
    isFree: false,
    ageLimit: '18+',
    dressCode: 'Casual Party',
    tags: ['dj','bollywood','party'],
    status: 'completed',
    createdBy: admin._id,
  },
  {
    title: 'EDM Madness — DJ NYK Live Bangalore',
    description: 'DJ NYK turned Bangalore into an EDM festival with electrifying beats, immersive visuals, and a high-voltage crowd experience.',
    category: 'DJ Night',
    artist: djnyk._id,
    venue: {
      name: 'Pebble The Jungle Lounge',
      city: 'Bangalore',
      address: 'Palace Grounds, Bengaluru, Karnataka 560052'
    },
    date: new Date('2025-03-10'),
    time: '8:00 PM',
    endTime: '12:00 AM',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=900&q=80',
    ticketTiers: [
      { name: 'Early Bird', price: 499, totalSeats: 350, availableSeats: 0, perks: 'Discounted entry' },
      { name: 'General', price: 1099, totalSeats: 2200, availableSeats: 0, perks: 'Standing access' },
      { name: 'VIP Zone', price: 2999, totalSeats: 150, availableSeats: 0, perks: 'VIP seating + bar access' },
    ],
    isFeatured: false,
    isFree: false,
    ageLimit: '18+',
    dressCode: 'Smart Casual',
    tags: ['edm','dj','live'],
    status: 'completed',
    createdBy: admin._id,
  },
 ]);
  console.log('🎪 Events seeded');

  // ── Sample bookings ─────────────────────────────────────────────────────
  const makeBooking = async (user, event, tickets) => {
    const totalAmount = tickets.reduce((s, t) => s + t.quantity * t.pricePerTicket, 0);
    const isFreeBooking = totalAmount === 0;
    const b = await Booking.create({
      user: user._id, event: event._id, tickets, totalAmount, isFreeBooking,
      paymentStatus: 'paid',
      paymentId: `pay_demo_${Math.random().toString(36).substr(2, 8)}`,
      attendeeName: user.name, attendeeEmail: user.email, attendeePhone: user.phone,
    });
    const qrData = JSON.stringify({ bookingId: b.bookingId, event: event.title, attendee: user.name });
    b.qrCode = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' });
    await b.save();
    return b;
  };

  await makeBooking(u1, events[0], [{ tierName: 'VIP',        quantity: 2, pricePerTicket: 2499 }]);
  await makeBooking(u1, events[8], [{ tierName: 'Free Entry',  quantity: 1, pricePerTicket: 0    }]);
  await makeBooking(u2, events[1], [{ tierName: 'Standing',    quantity: 3, pricePerTicket: 799  }]);
  await makeBooking(u2, events[5], [{ tierName: 'Day Pass',    quantity: 2, pricePerTicket: 1499 }]);
  await makeBooking(u3, events[3], [{ tierName: 'General',     quantity: 1, pricePerTicket: 1199 }]);
  await makeBooking(u3, events[7], [{ tierName: 'Free Entry',  quantity: 1, pricePerTicket: 0    }]);
  console.log('🎫 Bookings seeded');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Seed complete!');
  console.log('🔑 Admin  → admin@happyhappenings.music / admin123');
  console.log('👤 User 1 → arjun@example.com / user123');
  console.log('👤 User 2 → priya@example.com / user123');
  console.log('👤 User 3 → rohan@example.com / user123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed error:', err.message); process.exit(1); });
