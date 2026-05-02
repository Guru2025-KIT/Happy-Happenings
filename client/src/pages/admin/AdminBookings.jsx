import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import AdminSidebar from '../../components/AdminSidebar'

const STATUS_CLS = {
  paid:     'badge-success',
  pending:  'badge-warn',
  failed:   'badge-danger',
  refunded: 'bg-slate-500/20 text-slate-400 border border-slate-500/20',
}

/* ─── Full-detail booking card ───────────────────────── */
function BookingDetailCard({ result, onReset }) {
  const { ok, msg, booking, expired, alreadyUsed } = result

  const colorClass = ok
    ? 'border-emerald-500/40 bg-emerald-500/5'
    : expired
    ? 'border-amber-500/40 bg-amber-500/5'
    : alreadyUsed
    ? 'border-orange-500/40 bg-orange-500/5'
    : 'border-rose-500/40 bg-rose-500/5'

  const icon = ok ? '✅' : expired ? '⏰' : alreadyUsed ? '⚠️' : '❌'

  return (
    <div className={`rounded-2xl border p-6 ${colorClass} animate-fadeIn`}>
      {/* Status banner */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className={`font-bold text-base ${ok ? 'text-emerald-300' : expired ? 'text-amber-300' : alreadyUsed ? 'text-orange-300' : 'text-rose-300'}`}>
            {msg}
          </p>
          {ok && <p className="text-slate-400 text-xs mt-0.5">Check-in recorded. Guest is now verified.</p>}
        </div>
        <button onClick={onReset} className="ml-auto btn-ghost text-xs">Scan Next →</button>
      </div>

      {booking && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Guest Info */}
          <div className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-semibold">Guest</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {(booking.attendeeName || booking.user?.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold">{booking.attendeeName || booking.user?.name || '—'}</p>
                <p className="text-slate-400 text-xs">{booking.attendeeEmail || booking.user?.email || '—'}</p>
              </div>
            </div>
            {(booking.attendeePhone || booking.user?.phone) && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>📞</span>
                <span>{booking.attendeePhone || booking.user?.phone}</span>
              </div>
            )}
          </div>

          {/* Booking Info */}
          <div className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-semibold">Booking</p>
            <p className="font-mono text-violet-400 text-sm font-bold mb-2">{booking.bookingId}</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-start gap-2 text-slate-300">
                <span className="text-slate-500 mt-px">🎪</span>
                <span className="line-clamp-2">{booking.event?.title || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span>📅</span>
                <span>
                  {booking.event?.date
                    ? new Date(booking.event.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })
                    : '—'}
                  {booking.event?.time && ` · ${booking.event.time}`}
                </span>
              </div>
              {booking.event?.venue && (
                <div className="flex items-center gap-2 text-slate-400">
                  <span>📍</span>
                  <span>{booking.event.venue.name}, {booking.event.venue.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tickets */}
          <div className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-semibold">Tickets</p>
            <div className="space-y-2">
              {booking.tickets?.map((t, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-300">{t.tierName} × {t.quantity}</span>
                  <span className="text-white font-semibold">
                    ₹{((t.pricePerTicket || 0) * t.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                <span className="text-slate-300">Total</span>
                <span className="text-violet-300">
                  {booking.totalAmount === 0
                    ? 'Free'
                    : `₹${booking.totalAmount?.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-semibold">Status</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Payment</span>
                <span className={`badge ${STATUS_CLS[booking.paymentStatus] || 'badge-warn'}`}>
                  {booking.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Check-in</span>
                {booking.isValidated
                  ? <span className="text-emerald-400 font-semibold text-xs">✅ Validated</span>
                  : <span className="text-slate-600 text-xs">Not yet</span>}
              </div>
              {booking.isFreeBooking && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Type</span>
                  <span className="badge-free">Free</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Camera QR Scanner ──────────────────────────────── */
function CameraScanner({ onResult }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const streamRef = useRef(null)
  const [cameraOn,  setCameraOn]  = useState(false)
  const [scanning,  setScanning]  = useState(false)
  const [camError,  setCamError]  = useState('')
  const [detected,  setDetected]  = useState(false)

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraOn(false)
    setScanning(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera])

  const scanLoop = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // jsQR loaded via CDN in index.html as window.jsQR
      if (typeof window.jsQR === 'function') {
        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        })
        if (code && code.data) {
          setDetected(true)
          stopCamera()
          onResult(code.data)
          return
        }
      }
    }

    animRef.current = requestAnimationFrame(scanLoop)
  }, [onResult, stopCamera])

  const startCamera = async () => {
    setCamError('')
    setDetected(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraOn(true)
      setScanning(true)
      animRef.current = requestAnimationFrame(scanLoop)
    } catch (err) {
      setCamError('Camera access denied. Please allow camera permissions and try again.')
    }
  }

  return (
    <div className="card p-5 border-violet-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <span className="text-lg">📷</span> Camera QR Scanner
        </h3>
        {cameraOn && (
          <button onClick={stopCamera} className="btn-danger text-xs py-1.5 px-3">
            Stop Camera
          </button>
        )}
      </div>

      {!cameraOn && (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">📷</div>
          <p className="text-slate-400 text-sm mb-5">
            Point your camera at the ticket QR code for instant auto check-in
          </p>
          <button onClick={startCamera} className="btn-primary px-8 py-3">
            🚀 Open Camera &amp; Start Scanning
          </button>
          {camError && (
            <p className="text-rose-400 text-xs mt-4 px-4">{camError}</p>
          )}
        </div>
      )}

      {/* Camera feed */}
      <div className={cameraOn ? 'block' : 'hidden'}>
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-72">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Corner brackets */}
            <div className="relative w-48 h-48">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-violet-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-violet-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-violet-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-violet-400 rounded-br-lg" />

              {/* Scanning line */}
              {scanning && (
                <div
                  className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent"
                  style={{ animation: 'scan-line 2s linear infinite' }}
                />
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="absolute top-3 left-0 right-0 flex justify-center">
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm ${
              detected
                ? 'bg-emerald-500/80 text-white'
                : 'bg-black/60 text-violet-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${detected ? 'bg-white' : 'bg-violet-400 animate-pulse'}`} />
              {detected ? 'QR Detected!' : 'Scanning…'}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center mt-3">
          Hold the QR code steady inside the frame · Auto check-in on detection
        </p>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────── */
const STATUS_TABS = ['all', 'paid', 'pending', 'failed', 'refunded']

export default function AdminBookings() {
  const [bookings,    setBookings]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('all')
  const [activeTab,   setActiveTab]   = useState('manual') // 'manual' | 'camera'
  const [scanId,      setScanId]      = useState('')
  const [scanResult,  setScanResult]  = useState(null)
  const [validating,  setValidating]  = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/bookings/all')
      .then(({ data }) => setBookings(data))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false))
  }, [])

  /* Call validate and merge result into state */
  const runValidate = async (bookingId) => {
    const id = bookingId.trim().toUpperCase()
    if (!id) return
    setValidating(true)
    setScanResult(null)
    try {
      const { data } = await api.post(`/bookings/validate/${id}`)
      setScanResult({ ok: true, msg: data.message, booking: data.booking })
      toast.success(data.message)
      setBookings(prev =>
        prev.map(b => b.bookingId === id ? { ...b, isValidated: true } : b)
      )
    } catch (err) {
      const resp = err.response?.data
      setScanResult({
        ok:          false,
        msg:         resp?.message || 'Validation failed',
        booking:     resp?.booking,
        expired:     resp?.expired,
        alreadyUsed: resp?.alreadyUsed,
      })
      toast.error(resp?.message || 'Validation failed')
    } finally { setValidating(false) }
  }

  /* Called by Camera scanner when QR decoded */
  const handleQRData = async (rawData) => {
    let bookingId = rawData.trim()
    try {
      const parsed = JSON.parse(rawData)
      if (parsed.bookingId) bookingId = parsed.bookingId
    } catch {/* not JSON – treat as plain bookingId */}
    await runValidate(bookingId)
  }

  const resetScan = () => {
    setScanResult(null)
    setScanId('')
  }

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.paymentStatus === filter)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <style>{`
        @keyframes scan-line {
          0%   { top: 4px;   opacity: 1; }
          49%  { opacity: 1; }
          50%  { top: calc(100% - 4px); opacity: 0.8; }
          100% { top: 4px;   opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn .35s ease; }
      `}</style>

      <div className="flex gap-8">
        <AdminSidebar />
        <div className="flex-1 min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="section-label mb-1">Admin</p>
              <h1 className="section-title">Bookings</h1>
            </div>
            <span className="text-slate-500 text-sm">{filtered.length} records</span>
          </div>

          {/* ── Venue Scanner Card ── */}
          <div className="card mb-6 border-violet-500/20 overflow-visible">
            <div className="p-5 pb-0">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold text-white">🎟️ Venue Check-In Scanner</h3>
                <span className="badge bg-violet-500/15 text-violet-300 border border-violet-500/20 text-xs">Admin Only</span>
              </div>

              {/* Mode tabs */}
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit mb-5">
                {[
                  { key: 'manual', label: '⌨️ Manual ID', },
                  { key: 'camera', label: '📷 Camera Scan', },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setActiveTab(key); setScanResult(null) }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === key
                        ? 'bg-violet-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5">
              {/* Manual input */}
              {activeTab === 'manual' && (
                <div>
                  <div className="flex gap-3">
                    <input
                      className="input flex-1 font-mono text-sm"
                      placeholder="Enter Booking ID — e.g. HHM-A1B2C3D4"
                      value={scanId}
                      onChange={e => setScanId(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && runValidate(scanId)}
                    />
                    <button
                      onClick={() => runValidate(scanId)}
                      disabled={validating || !scanId.trim()}
                      className="btn-primary px-6 disabled:opacity-50 min-w-[110px]"
                    >
                      {validating ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Checking…
                        </span>
                      ) : 'Validate ✓'}
                    </button>
                  </div>
                  <p className="text-slate-600 text-xs mt-2">
                    Format: <code className="text-violet-400">HHM-XXXXXXXX</code> — found on the user's ticket
                  </p>
                </div>
              )}

              {/* Camera scanner */}
              {activeTab === 'camera' && !scanResult && (
                <CameraScanner onResult={handleQRData} />
              )}

              {/* Result card */}
              {scanResult && (
                <BookingDetailCard result={scanResult} onReset={resetScan} />
              )}
            </div>
          </div>

          {/* ── Filter tabs ── */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {STATUS_TABS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                  filter === f
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {f}
                {f === 'all'
                  ? ` (${bookings.length})`
                  : ` (${bookings.filter(b => b.paymentStatus === f).length})`}
              </button>
            ))}
          </div>

          {/* ── Bookings table ── */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-600">No bookings found.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] text-xs text-slate-600 uppercase tracking-wider">
                    {['Booking ID', 'Guest', 'Event', 'Tickets', 'Amount', 'Payment', 'Check-In', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map(b => (
                    <tr
                      key={b._id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => { setScanId(b.bookingId); setActiveTab('manual') }}
                      title="Click to load this booking ID into scanner"
                    >
                      <td className="px-4 py-3 font-mono text-violet-400 text-xs whitespace-nowrap">
                        {b.bookingId}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{b.user?.name}</p>
                        <p className="text-slate-600 text-xs">{b.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-[140px] truncate">
                        {b.event?.title || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {b.tickets?.reduce((s, t) => s + t.quantity, 0)} ticket(s)
                      </td>
                      <td className="px-4 py-3 text-white font-semibold">
                        {b.totalAmount === 0
                          ? <span className="badge-free text-xs">Free</span>
                          : `₹${b.totalAmount.toLocaleString('en-IN')}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={STATUS_CLS[b.paymentStatus] || 'badge-warn'}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {b.isValidated
                          ? <span className="text-emerald-400 text-xs font-semibold">✅ Done</span>
                          : <span className="text-slate-700 text-xs">Pending</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                        {new Date(b.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}