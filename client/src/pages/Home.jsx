import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import EventCard from '../components/EventCard'
import { LOGO } from '../utils/logo'

/* ────────────────────────────────────────────────────────── */
/*  Constants                                                 */
/* ────────────────────────────────────────────────────────── */

const CATS = [
  { label: 'Concerts',    icon: '🎸', q: 'Concert' },
  { label: 'DJ Nights',   icon: '🎧', q: 'DJ Night' },
  { label: 'Fests',       icon: '🎪', q: 'Fest' },
  { label: 'Live Shows',  icon: '🎤', q: 'Live Performance' },
  { label: 'Acoustic',    icon: '🎵', q: 'Acoustic Night' },
  { label: 'Open Mic',    icon: '🎙', q: 'Open Mic' },
  { label: 'Workshops',   icon: '🎓', q: 'Workshop' },
  { label: 'Free Events', icon: '🆓', q: null, free: true },
]

const FALLBACKS = [
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=70',
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&q=70',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=70',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=70',
]

/* ────────────────────────────────────────────────────────── */
/*  Small UI helpers                                          */
/* ────────────────────────────────────────────────────────── */

function StatCard({ value, label, icon }) {
  return (
    <div className="text-center">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="font-display text-3xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[16/9]" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-5 w-3/4 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded-lg" />
        <div className="skeleton h-8 w-full rounded-xl mt-4" />
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────── */
/*  Event Quick-View Modal (poster click)                     */
/* ────────────────────────────────────────────────────────── */

function QuickViewModal({ event, onClose }) {
  const navigate = useNavigate()
  if (!event) return null
  const date = new Date(event.date)
  const img  = event.image || FALLBACKS[0]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="card max-w-md w-full overflow-hidden shadow-2xl shadow-violet-900/50"
        style={{ animation: 'qvSlide .3s cubic-bezier(.34,1.56,.64,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Poster image */}
        <div className="relative h-52 overflow-hidden">
          <img src={img} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            ✕
          </button>
          {event.isFeatured && (
            <span className="absolute top-3 left-3 badge bg-yellow-400/20 text-yellow-300 border border-yellow-500/30">⭐ Featured</span>
          )}
          {event.isFree && (
            <span className="absolute top-3 left-3 badge-free">🆓 FREE</span>
          )}
        </div>

        {/* Details */}
        <div className="p-6">
          <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-1">{event.category}</p>
          <h3 className="font-display text-xl font-bold text-white mb-4 leading-tight">{event.title}</h3>

          <div className="space-y-2 text-sm mb-6">
            <div className="flex items-center gap-2 text-slate-300">
              <span>📅</span>
              <span>
                {date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {event.time && <span className="text-slate-500 ml-1">· {event.time}</span>}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span>📍</span>
              <span>{event.venue?.name}, {event.venue?.city}</span>
            </div>
            {event.artist && (
              <div className="flex items-center gap-2 text-violet-300">
                <span>🎤</span>
                <span>{event.artist.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500">Starting from</p>
              <p className="font-display text-2xl font-bold text-white">
                {event.isFree
                  ? <span className="text-emerald-400">FREE</span>
                  : `₹${(event.minPrice ?? event.ticketTiers?.[0]?.price ?? 0).toLocaleString('en-IN')}`}
              </p>
            </div>
            <button
              onClick={() => navigate(`/events/${event._id}`)}
              className="btn-primary px-6 py-3 text-sm"
            >
              Book Now →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────── */
/*  Poster Carousel                                           */
/* ────────────────────────────────────────────────────────── */

function PosterCard({ event, onClick, index }) {
  const img = event.image || FALLBACKS[index % FALLBACKS.length]
  const date = new Date(event.date)

  return (
    <div
      className="relative flex-shrink-0 w-44 h-64 rounded-2xl overflow-hidden cursor-pointer group shadow-xl shadow-black/40 border border-white/[0.06]"
      onClick={() => onClick(event)}
      title={event.title}
    >
      <img
        src={img}
        alt={event.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        onError={e => { e.target.src = FALLBACKS[index % FALLBACKS.length] }}
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

      {/* Free badge */}
      {event.isFree && (
        <div className="absolute top-2 right-2">
          <span className="badge-free text-[10px]">FREE</span>
        </div>
      )}

      {/* Category */}
      <div className="absolute top-2 left-2">
        <span className="text-[9px] font-bold uppercase tracking-widest text-violet-300 bg-violet-900/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
          {event.category}
        </span>
      </div>

      {/* Event info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-bold text-sm line-clamp-2 leading-tight mb-1">{event.title}</p>
        <p className="text-violet-300 text-[11px]">
          {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
        <p className="text-slate-400 text-[10px] truncate">{event.venue?.city}</p>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/25 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-75">
          <span className="bg-white text-violet-700 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-xl">
            View Event →
          </span>
        </div>
      </div>
    </div>
  )
}

function PosterCarousel({ events, onCardClick }) {
  const [paused, setPaused] = useState(false)

  if (!events || events.length === 0) return null

  // Duplicate for seamless infinite loop (need enough items to fill 2 rows)
  const fill = (arr) => {
    let out = [...arr]
    while (out.length < 16) out = [...out, ...arr]
    return [...out, ...out] // double for seamless loop
  }

  const row1 = fill(events)
  const row2 = fill([...events].reverse())

  return (
    <div
      className="relative overflow-hidden py-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10"
        style={{ background: 'linear-gradient(to right, #03030e 0%, transparent 100%)' }} />
      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10"
        style={{ background: 'linear-gradient(to left, #03030e 0%, transparent 100%)' }} />

      {/* Row 1 — scroll left */}
      <div
        className="flex gap-4 mb-4"
        style={{
          width: 'max-content',
          animation: 'posterScrollLeft 50s linear infinite',
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {row1.map((ev, i) => (
          <PosterCard key={`r1-${i}`} event={ev} onClick={onCardClick} index={i} />
        ))}
      </div>

      {/* Row 2 — scroll right */}
      <div
        className="flex gap-4"
        style={{
          width: 'max-content',
          animation: 'posterScrollRight 45s linear infinite',
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {row2.map((ev, i) => (
          <PosterCard key={`r2-${i}`} event={ev} onClick={onCardClick} index={i} />
        ))}
      </div>

      {paused && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="bg-black/60 backdrop-blur-sm text-violet-300 text-xs font-semibold px-4 py-2 rounded-full border border-violet-500/30">
            ✦ Click any poster to explore
          </div>
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────── */
/*  Past Event Card                                           */
/* ────────────────────────────────────────────────────────── */

function PastEventCard({ event }) {
  const img  = event.image || FALLBACKS[0]
  const date = new Date(event.date)

  return (
    <div className="card overflow-hidden opacity-70 hover:opacity-90 transition-all duration-300 group">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={img}
          alt={event.title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          onError={e => { e.target.src = FALLBACKS[0] }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-black/80 backdrop-blur-sm text-slate-300 text-xs font-bold px-4 py-2 rounded-full border border-white/20">
            🎭 Event Ended
          </span>
        </div>
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 bg-black/70 px-2 py-0.5 rounded-full">
            {event.category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display font-bold text-slate-300 text-base leading-snug line-clamp-2 mb-2">
          {event.title}
        </h3>
        <div className="text-slate-600 text-xs space-y-1">
          <p>📅 {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <p>📍 {event.venue?.name}, {event.venue?.city}</p>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────── */
/*  Main Page Component                                       */
/* ────────────────────────────────────────────────────────── */

export default function Home() {
  const [featured,   setFeatured]   = useState([])
  const [free,       setFree]       = useState([])
  const [upcoming,   setUpcoming]   = useState([])
  const [allEvents,  setAllEvents]  = useState([])
  const [pastEvents, setPastEvents] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [quickView,  setQuickView]  = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/events?featured=true&status=upcoming'),
      api.get('/events?isFree=true&status=upcoming'),
      api.get('/events?status=upcoming'),
      api.get('/events?status=completed'),
    ]).then(([f, fr, u, p]) => {
      setFeatured(f.data.slice(0, 3))
      setFree(fr.data.slice(0, 3))
      setUpcoming(u.data.slice(0, 6))
      setAllEvents(u.data)          // all upcoming for carousel
      setPastEvents(p.data.slice(0, 6))
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <style>{`
        @keyframes posterScrollLeft {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes posterScrollRight {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes qvSlide {
          from { opacity: 0; transform: scale(.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .text-gradient-anim {
          background: linear-gradient(270deg, #a78bfa, #818cf8, #c4b5fd, #7c3aed);
          background-size: 400% 400%;
          animation: gradientShift 6s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .animate-float-slow { animation: floatY 5s ease-in-out infinite; }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Animated glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-violet-700/25 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-indigo-600/18 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-3/4 left-1/4 w-[350px] h-[350px] bg-violet-900/22 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 right-1/3 w-[250px] h-[250px] bg-indigo-800/15 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '4.5s' }} />
        </div>

        {/* Sparkle stars */}
        {[...Array(12)].map((_, i) => (
          <div key={i}
            className="absolute text-violet-300/40 animate-twinkle pointer-events-none"
            style={{
              top: `${8 + i * 7}%`,
              left: `${4 + i * 8}%`,
              animationDelay: `${i * 0.35}s`,
              animationDuration: `${2.5 + i * 0.25}s`,
              fontSize: i % 3 === 0 ? '20px' : '14px',
            }}
          >
            ✦
          </div>
        ))}

        <div className="relative max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-violet-600/12 border border-violet-500/25 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-400" />
              </span>
              <span className="text-violet-300 text-xs font-semibold tracking-widest uppercase">India's Premier Music Events Platform</span>
            </div>

            <h1 className="font-display font-black text-white leading-[1.05] mb-6">
              <span className="text-5xl md:text-6xl lg:text-7xl block">Feel the</span>
              <span className="text-gradient-anim font-script text-6xl md:text-7xl lg:text-8xl block mt-1">
                Music ✦
              </span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 mb-10">
              Discover electrifying concerts, DJ nights & fests. Book your tickets,
              get your QR code, and live the experience. From intimate acoustic
              sessions to massive stadium shows.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/events" className="btn-primary text-base px-8 py-4 animate-glow">
                Explore Events 🎉
              </Link>
              <Link to="/events?isFree=true" className="btn-secondary text-base px-8 py-4">
                🆓 Free Events
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-14 pt-8 border-t border-white/8">
              <StatCard value="500+" label="Events"  icon="🎪" />
              <StatCard value="50K+" label="Fans"    icon="🎵" />
              <StatCard value="100+" label="Artists" icon="🎤" />
            </div>
          </div>

          {/* Right: Floating logo + disco effect */}
          <div className="flex items-center justify-center relative">
            <div className="relative w-72 h-72 md:w-80 md:h-80">
              {/* Glow rings */}
              <div className="absolute inset-0 rounded-full bg-violet-600/25 blur-2xl animate-pulse-slow" />
              <div className="absolute inset-4 rounded-full border border-violet-500/25 animate-spin-slow" />
              <div className="absolute inset-8 rounded-full border border-indigo-500/18" style={{ animation: 'spin 35s linear infinite reverse' }} />
              <div className="absolute inset-12 rounded-full border border-violet-400/10" style={{ animation: 'spin 20s linear infinite' }} />

              {/* Logo */}
              <div className="absolute inset-6 rounded-full overflow-hidden ring-4 ring-violet-500/30 shadow-2xl shadow-violet-900/50 animate-float">
                <img src={LOGO} alt="Happy Happenings Music" className="w-full h-full object-cover" />
              </div>

              {/* Orbiting sparkles */}
              {[0, 72, 144, 216, 288].map((deg, i) => (
                <div key={i}
                  className="absolute text-yellow-300 animate-twinkle"
                  style={{
                    top:  `${50 - 46 * Math.cos((deg * Math.PI) / 180)}%`,
                    left: `${50 + 46 * Math.sin((deg * Math.PI) / 180)}%`,
                    animationDelay: `${i * 0.6}s`,
                    fontSize: i % 2 === 0 ? '14px' : '9px',
                    transform: 'translate(-50%,-50%)',
                  }}
                >
                  ✦
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-violet-500/50 to-transparent" />
        </div>
      </section>

      {/* ── EVENT POSTER CAROUSEL ────────────────────────────────── */}
      {(loading || allEvents.length > 0) && (
        <section className="py-12" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(109,40,217,.04) 50%, transparent 100%)' }}>
          <div className="max-w-7xl mx-auto px-4 mb-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="section-label mb-2">🎭 Now Happening</p>
                <h2 className="section-title">
                  Event <span className="text-violet-400">Spotlight</span>
                </h2>
                <p className="text-slate-500 text-sm mt-1">Hover to pause · Click to explore</p>
              </div>
              <Link to="/events" className="btn-secondary text-sm hidden sm:flex">Browse All →</Link>
            </div>
          </div>

          {loading ? (
            <div className="flex gap-4 px-4 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-44 h-64 skeleton rounded-2xl" />
              ))}
            </div>
          ) : (
            <PosterCarousel events={allEvents} onCardClick={setQuickView} />
          )}
        </section>
      )}

      {/* ── CATEGORY CHIPS ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {CATS.map(({ label, icon, q, free }) => (
            <Link
              key={label}
              to={free ? '/events?isFree=true' : `/events?category=${encodeURIComponent(q)}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-white text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-900/20"
            >
              <span>{icon}</span> {label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED EVENTS ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label mb-2">⭐ Handpicked</p>
            <h2 className="section-title">Featured <span className="text-violet-400">Events</span></h2>
          </div>
          <Link to="/events?featured=true" className="btn-secondary text-sm hidden sm:flex">View all →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((ev, i) => <EventCard key={ev._id} event={ev} index={i} />)}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-12">No featured events yet.</p>
        )}
      </section>

      {/* ── FREE EVENTS BANNER ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-2xl p-8 relative overflow-hidden border border-emerald-500/20"
          style={{ background: 'linear-gradient(135deg,rgba(16,185,129,.08) 0%,rgba(6,78,59,.15) 100%)' }}>
          <div className="absolute top-0 right-0 text-[120px] opacity-5 leading-none select-none">🆓</div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-2">No ticket needed</p>
              <h2 className="font-display text-3xl font-bold text-white mb-2">Free Events This Week</h2>
              <p className="text-slate-400 text-sm">Open mics, outdoor jams, and community shows — all completely free.</p>
            </div>
            <div className="flex flex-col gap-4 min-w-[280px]">
              {loading ? (
                <div className="skeleton h-16 rounded-xl" />
              ) : free.length > 0 ? (
                free.map(ev => (
                  <Link key={ev._id} to={`/events/${ev._id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-emerald-500/15 hover:border-emerald-400/30 transition-all">
                    <img
                      src={ev.image || FALLBACKS[0]}
                      alt={ev.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold line-clamp-1">{ev.title}</p>
                      <p className="text-emerald-400 text-xs">{ev.venue?.city} · {ev.time}</p>
                    </div>
                  </Link>
                ))
              ) : <p className="text-slate-500 text-sm">Check back soon!</p>}
            </div>
          </div>
        </div>
      </section>

      {/* ── UPCOMING SHOWS ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label mb-2">📅 Don't miss out</p>
            <h2 className="section-title">Upcoming <span className="text-violet-400">Shows</span></h2>
          </div>
          <Link to="/events" className="btn-secondary text-sm hidden sm:flex">View all →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : upcoming.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((ev, i) => <EventCard key={ev._id} event={ev} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-slate-400">No events right now. Check back soon!</p>
          </div>
        )}
        <div className="text-center mt-10">
          <Link to="/events" className="btn-secondary px-8 py-3">Browse All Events →</Link>
        </div>
      </section>

      {/* ── PAST EVENTS ─────────────────────────────────────────────── */}
      {pastEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-600 mb-2">🎭 Memories</p>
              <h2 className="font-display text-3xl font-bold text-slate-500">Past <span className="text-slate-400">Events</span></h2>
              <p className="text-slate-600 text-sm mt-1">These events have ended — registration is now closed.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {pastEvents.map(ev => (
              <PastEventCard key={ev._id} event={ev} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/events?status=completed"
              className="text-slate-600 hover:text-slate-400 text-sm transition-colors underline underline-offset-2"
            >
              View all past events
            </Link>
          </div>
        </section>
      )}

      {/* ── CTA BANNER ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-violet-500/15 my-12"
        style={{ background: 'linear-gradient(135deg,rgba(109,40,217,.12) 0%,rgba(79,70,229,.08) 50%,rgba(109,40,217,.12) 100%)' }}>
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,rgba(139,92,246,.3) 0px,rgba(139,92,246,.3) 1px,transparent 1px,transparent 40px)' }} />
        <div className="relative max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-violet-500/30 mx-auto mb-6 shadow-xl shadow-violet-900/40 animate-float">
            <img src={LOGO} alt="HHM" className="w-full h-full object-cover" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Are You an Artist?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            List your events on Happy Happenings Music and reach thousands of passionate music fans across India.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://www.instagram.com/happyhappeningsmusic?igsh=MXI1Z2U3ZHloNGZkaA==" target="_blank" rel="noopener noreferrer"
              className="btn-primary px-8 py-3.5 text-base">
              Connect on Instagram →
            </a>
            <a href="mailto:hello@happyhappenings.music" className="btn-secondary px-8 py-3.5 text-base">
              Email Us
            </a>
          </div>
        </div>
      </section>

      {/* Quick-view modal */}
      {quickView && <QuickViewModal event={quickView} onClose={() => setQuickView(null)} />}
    </div>
  )
}