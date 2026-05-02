import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

const STATUS = {
  paid:     { label: 'Paid',     cls: 'badge-success' },
  pending:  { label: 'Pending',  cls: 'badge-warn' },
  failed:   { label: 'Failed',   cls: 'badge-danger' },
  refunded: { label: 'Refunded', cls: 'badge bg-slate-500/20 text-slate-400 border border-slate-500/20' },
}

/* ── Helpers ──────────────────────────────────────────── */

function parseTimeStr(str) {
  if (!str) return null
  const m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!m) return null
  let h = parseInt(m[1])
  const mins = parseInt(m[2])
  const mer = (m[3] || '').toUpperCase()
  if (mer === 'PM' && h < 12) h += 12
  if (mer === 'AM' && h === 12) h = 0
  return { h, mins }
}

/** Returns true if QR check-in window has passed for this event */
function isQRExpired(event) {
  if (!event?.date) return false
  const d = new Date(event.date)
  const t = parseTimeStr(event.endTime || event.time)
  if (t) d.setHours(t.h, t.mins, 0, 0)
  else   d.setHours(23, 59, 0, 0)
  // 2-hour grace period
  return new Date() > new Date(d.getTime() + 2 * 60 * 60 * 1000)
}

/* ── QR Modal ─────────────────────────────────────────── */

function QRModal({ booking, onClose }) {
  const event   = booking.event
  const expired = isQRExpired(event)
  const used    = booking.isValidated

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="card p-8 max-w-sm w-full text-center"
        style={{ animation: 'qvSlide .3s cubic-bezier(.34,1.56,.64,1)' }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes qvSlide {
            from { opacity: 0; transform: scale(.9) translateY(16px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        <h3 className="font-display text-2xl font-bold text-white mb-1">
          {used ? '✅ Ticket Used' : expired ? '⏰ Ticket Expired' : '🎟️ Your Ticket'}
        </h3>
        <p className="text-slate-400 text-sm mb-6">{event?.title}</p>

        {/* QR code */}
        <div className={`relative inline-block mb-5 ${(expired || used) ? '' : ''}`}>
          <div className={`bg-white rounded-2xl p-4 shadow-xl ${expired || used ? 'opacity-30' : ''}`}>
            <img src={booking.qrCode} alt="QR" className="w-48 h-48" />
          </div>

          {/* Expired overlay */}
          {expired && !used && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-4xl mb-1">⏰</div>
                <p className="text-amber-300 font-bold text-sm">QR Expired</p>
                <p className="text-slate-400 text-xs mt-0.5">Event has ended</p>
              </div>
            </div>
          )}

          {/* Used overlay */}
          {used && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-4xl mb-1">✅</div>
                <p className="text-emerald-300 font-bold text-sm">Checked In</p>
                <p className="text-slate-400 text-xs mt-0.5">Already scanned</p>
              </div>
            </div>
          )}
        </div>

        {/* Booking ID */}
        <p className="font-mono text-violet-400 text-sm font-bold mb-1">{booking.bookingId}</p>

        {/* Status info */}
        {expired && !used && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-xs text-amber-300">
            ⏰ The check-in window for this event has closed.
            This QR code is no longer valid.
          </div>
        )}
        {used && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 text-xs text-emerald-300">
            ✅ This ticket was successfully used at the venue.
          </div>
        )}
        {!expired && !used && (
          <p className="text-slate-600 text-xs mb-4">Show this at the venue entrance · Valid until event check-in closes</p>
        )}

        <button onClick={onClose} className="btn-secondary w-full">Close</button>
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────── */

export default function MyBookings() {
  const [bookings,    setBookings]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [qrModal,     setQrModal]     = useState(null)
  const [cancelling,  setCancelling]  = useState(null)
  const [filter,      setFilter]      = useState('all') // all | upcoming | past

  const load = () => {
    setLoading(true)
    api.get('/bookings/user')
      .then(({ data }) => setBookings(data))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const cancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return
    setCancelling(bookingId)
    try {
      await api.put(`/bookings/cancel/${bookingId}`)
      toast.success('Booking cancelled.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed')
    } finally { setCancelling(null) }
  }

  const filtered = bookings.filter(b => {
    if (filter === 'all') return true
    const past = b.event ? isQRExpired(b.event) : false
    if (filter === 'upcoming') return !past
    if (filter === 'past')     return past
    return true
  })

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
      <div className="skeleton h-10 w-48 rounded-xl mb-8" />
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="section-label mb-2">Your Account</p>
        <h1 className="section-title">My <span className="text-violet-400">Bookings</span></h1>
      </div>

      {/* Filter tabs */}
      {bookings.length > 0 && (
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { key: 'all',      label: `All (${bookings.length})` },
            { key: 'upcoming', label: `Upcoming (${bookings.filter(b => !isQRExpired(b.event)).length})` },
            { key: 'past',     label: `Past (${bookings.filter(b => isQRExpired(b.event)).length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                filter === key ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-7xl mb-6 animate-float">🎫</div>
          <h3 className="font-display text-2xl font-bold text-white mb-2">No Bookings Yet</h3>
          <p className="text-slate-500 mb-8">Book your first event and your ticket will appear here!</p>
          <Link to="/events" className="btn-primary px-8 py-3.5">Explore Events →</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <p className="text-4xl mb-4">🎵</p>
          <p>No {filter} bookings found.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map(b => {
            const ev         = b.event
            const date       = ev ? new Date(ev.date) : null
            const st         = STATUS[b.paymentStatus] || STATUS.pending
            const canCancel  = b.paymentStatus === 'paid' && !b.isValidated
            const qrExpired  = isQRExpired(ev)

            return (
              <div key={b._id}
                className={`card p-6 transition-all ${qrExpired ? 'opacity-75 border-white/[0.04]' : 'hover:border-violet-500/20'}`}>
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* Image */}
                  {ev?.image && (
                    <Link to={`/events/${ev._id}`} className="shrink-0">
                      <div className="w-full sm:w-28 h-24 rounded-xl overflow-hidden bg-navy-700">
                        <img
                          src={ev.image}
                          alt={ev.title}
                          className={`w-full h-full object-cover hover:scale-105 transition-transform ${qrExpired ? 'grayscale' : ''}`}
                        />
                      </div>
                    </Link>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                      <Link to={`/events/${ev?._id}`}
                        className="font-display text-lg font-bold text-white hover:text-violet-300 transition-colors">
                        {ev?.title || 'Event Deleted'}
                      </Link>
                      <div className="flex items-center gap-2 flex-wrap">
                        {b.isFreeBooking   && <span className="badge-free">Free</span>}
                        <span className={st.cls}>{st.label}</span>
                        {b.isValidated     && <span className="badge-success text-xs">✓ Used</span>}
                        {qrExpired && !b.isValidated && (
                          <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/20 text-xs">⏰ Expired</span>
                        )}
                      </div>
                    </div>

                    {date && (
                      <p className="text-slate-400 text-sm mb-1">
                        📅 {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {ev?.venue && ` · 📍 ${ev.venue.name}, ${ev.venue.city}`}
                      </p>
                    )}
                    <p className="text-slate-600 text-xs font-mono mb-3">ID: {b.bookingId}</p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {b.tickets?.map((t, i) => (
                        <span key={i} className="badge bg-white/5 text-slate-400 border border-white/10">
                          {t.tierName} × {t.quantity}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <span className="font-display text-xl text-violet-300 font-bold">
                        {b.totalAmount === 0 ? 'Free' : `₹${b.totalAmount.toLocaleString('en-IN')}`}
                      </span>
                      <div className="flex gap-2">
                        {b.qrCode && (
                          <button
                            onClick={() => setQrModal(b)}
                            className={`text-xs py-1.5 px-3 ${qrExpired || b.isValidated ? 'btn-ghost' : 'btn-secondary'}`}
                          >
                            {b.isValidated ? '✅ View QR' : qrExpired ? '⏰ Expired QR' : '🔍 View QR'}
                          </button>
                        )}
                        {canCancel && !qrExpired && (
                          <button
                            onClick={() => cancel(b._id)}
                            disabled={cancelling === b._id}
                            className="btn-danger text-xs py-1.5 px-3 disabled:opacity-50"
                          >
                            {cancelling === b._id ? '…' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {b.isValidated && (
                  <div className="mt-4 pt-4 border-t border-white/[0.05] text-xs text-emerald-400 flex items-center gap-1.5">
                    ✅ Ticket validated at venue — hope you had a great time!
                  </div>
                )}
                {qrExpired && !b.isValidated && (
                  <div className="mt-4 pt-4 border-t border-white/[0.05] text-xs text-amber-500 flex items-center gap-1.5">
                    ⏰ Event has ended — QR code is no longer valid for check-in.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* QR Modal */}
      {qrModal && <QRModal booking={qrModal} onClose={() => setQrModal(null)} />}
    </div>
  )
}