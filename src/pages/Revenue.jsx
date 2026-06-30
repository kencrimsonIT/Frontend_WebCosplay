import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getRevenueTimeline } from '../api/statistics_api'
import { getSellerRevenue } from '../api/seller_api'
import '../styles/Revenue.css'

function money(value) {
  const amount = Number(value || 0)
  if (amount >= 1000000) return `${(amount / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M`
  return `${amount.toLocaleString('vi-VN')}d`
}

function fullMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}d`
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function RevenueBar({ item, maxValue }) {
  const rawValue = Number(item.totalRevenue ?? item.rentalRevenue ?? 0)
  const percent = maxValue > 0 ? Math.max((rawValue / maxValue) * 100, rawValue > 0 ? 8 : 0) : 0

  return (
    <div className="bar-item" title={`${item.label}: ${fullMoney(rawValue)}`}>
      <span className="bar-label">{item.label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ height: `${percent}%` }} />
      </div>
      <span className="bar-value">{money(rawValue)}</span>
    </div>
  )
}

function Revenue() {
  const location = useLocation()
  const sellerMode = location.pathname.startsWith('/seller')
  const [filters, setFilters] = useState({
    fromDate: daysAgoISO(29),
    toDate: todayISO(),
    groupBy: 'day',
  })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')
    const request = sellerMode ? getSellerRevenue : getRevenueTimeline
    request(filters)
      .then(result => {
        if (!ignore) setData(result)
      })
      .catch(err => {
        if (!ignore) setError(err?.message || 'Khong tai duoc thong ke doanh thu')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => { ignore = true }
  }, [filters, sellerMode])

  const bars = data?.bars ?? []
  const maxValue = useMemo(
    () => Math.max(0, ...bars.map(item => Number(item.totalRevenue ?? item.rentalRevenue ?? 0))),
    [bars]
  )
  const summary = data?.summary ?? {}
  const paymentMethods = data?.paymentMethods ?? []

  const revenueSummary = [
    { label: 'Tong doanh thu', value: money(summary.totalRevenue ?? summary.rentalRevenue), sub: `${summary.orderCount || 0} don` },
    { label: 'Tien thue', value: money(summary.rentalRevenue), sub: 'Doanh thu thue do' },
    { label: 'Tien coc da thu', value: money(summary.depositCollected), sub: `Dang giu ${money(summary.depositHeld)}` },
    { label: 'Gia tri TB/don', value: money(summary.averageOrderValue), sub: `${summary.completedOrderCount || 0} don hoan thanh` },
  ]

  return (
    <div className="revenue-page">
      <section className="revenue-hero">
        <div>
          <span className="page-kicker">{sellerMode ? 'Doanh thu nguoi ban' : 'Thong ke he thong'}</span>
          <h1 className="page-title">Revenue Timeline</h1>
          <p className="page-subtitle">Bieu do cot doanh thu theo ngay, thang hoac nam, kem chi tiet tien thue va tien coc.</p>
        </div>

        <div className="revenue-actions">
          <input
            className="revenue-btn secondary"
            type="date"
            value={filters.fromDate}
            onChange={event => setFilters(prev => ({ ...prev, fromDate: event.target.value }))}
          />
          <input
            className="revenue-btn secondary"
            type="date"
            value={filters.toDate}
            onChange={event => setFilters(prev => ({ ...prev, toDate: event.target.value }))}
          />
          <select
            className="revenue-btn secondary"
            value={filters.groupBy}
            onChange={event => setFilters(prev => ({ ...prev, groupBy: event.target.value }))}
          >
            <option value="day">Theo ngay</option>
            <option value="month">Theo thang</option>
            <option value="year">Theo nam</option>
          </select>
        </div>
      </section>

      <section className="revenue-summary-grid">
        {revenueSummary.map(item => (
          <article className="summary-card" key={item.label}>
            <span className="summary-label">{item.label}</span>
            <span className="summary-value">{item.value}</span>
            <span className="summary-trend">{item.sub}</span>
          </article>
        ))}
      </section>

      {loading && <article className="revenue-card"><h2 className="card-title">Dang tai doanh thu...</h2></article>}
      {error && !loading && <article className="revenue-card"><h2 className="card-title">{error}</h2></article>}

      {!loading && !error && (
        <section className="revenue-grid">
          <article className="revenue-card chart-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Bieu do cot doanh thu</h2>
                <p className="card-desc">
                  {data?.fromDate} - {data?.toDate} · groupBy={data?.groupBy}
                </p>
              </div>
            </div>

            <div className="chart-area">
              {bars.length === 0 ? (
                <div className="empty-mini-state">Khong co du lieu trong khoang thoi gian nay.</div>
              ) : bars.map(item => <RevenueBar key={item.key} item={item} maxValue={maxValue} />)}
            </div>

            <div className="channel-list">
              {paymentMethods.length > 0 ? paymentMethods.map(method => (
                <div className="channel-row" key={method.method}>
                  <div>
                    <span className="channel-label">{method.method}</span>
                    <span className="channel-percent">{method.percentage}%</span>
                  </div>
                  <div className="channel-track">
                    <div className="channel-fill" style={{ width: `${method.percentage}%` }} />
                  </div>
                </div>
              )) : (
                <div className="channel-row">
                  <div>
                    <span className="channel-label">Phuong thuc thanh toan</span>
                    <span className="channel-percent">0%</span>
                  </div>
                  <div className="channel-track"><div className="channel-fill" style={{ width: '0%' }} /></div>
                </div>
              )}
            </div>
          </article>

          <aside className="revenue-sidebar">
            <article className="revenue-card transaction-card">
              <div className="card-head compact-head">
                <div>
                  <h2 className="card-title">Chi tiet dong tien</h2>
                  <p className="card-desc">Phan tach cac khoan quan trong trong TMĐT.</p>
                </div>
              </div>

              <div className="transaction-list">
                <div className="transaction-item">
                  <div className="transaction-left"><h3>Tien thue</h3><p>Doanh thu tu line item</p></div>
                  <div className="transaction-right"><strong className="gain">{fullMoney(summary.rentalRevenue)}</strong></div>
                </div>
                <div className="transaction-item">
                  <div className="transaction-left"><h3>Tien coc da thu</h3><p>Khoan can quan ly hoan/giu</p></div>
                  <div className="transaction-right"><strong className="gain">{fullMoney(summary.depositCollected)}</strong></div>
                </div>
                <div className="transaction-item">
                  <div className="transaction-left"><h3>Tien coc dang giu</h3><p>Don dang xu ly/chua hoan tat</p></div>
                  <div className="transaction-right"><strong>{fullMoney(summary.depositHeld)}</strong></div>
                </div>
                {'warrantyRevenue' in summary && (
                  <div className="transaction-item">
                    <div className="transaction-left"><h3>Bao hanh</h3><p>Phi bao hanh trong don</p></div>
                    <div className="transaction-right"><strong className="gain">{fullMoney(summary.warrantyRevenue)}</strong></div>
                  </div>
                )}
              </div>
            </article>

            <article className="revenue-card deposit-card">
              <div className="card-head compact-head">
                <div>
                  <h2 className="card-title">Tien coc dang giu</h2>
                  <p className="card-desc">Can doi soat khi khach tra do.</p>
                </div>
              </div>
              <div className="deposit-figure">{money(summary.depositHeld)}</div>
              <div className="deposit-note">
                {summary.activeDepositOrderCount ?? summary.orderCount ?? 0} don lien quan tien coc.
              </div>
            </article>
          </aside>
        </section>
      )}
    </div>
  )
}

export default Revenue
