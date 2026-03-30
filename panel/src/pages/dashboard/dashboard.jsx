import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Building2, PieChart as PieChartIcon, Users, Activity } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { selectAuth } from '../../../redux/slices/authSlice'
import {
  clearDashboardError,
  fetchDashboardData,
  selectDashboard,
  setSelectedYear,
} from '../../../redux/slices/dashboard'
import Breadcrumb from '../../components/breadcrumb'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ROLE_KEYS = ['PMS', 'TMS', 'CA', 'Rider', 'Admin', 'Developer', 'SuperAdmin']

// Modern Chart Colors
const ROLE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b', '#06b6d4']
const STATUS_COLORS = {
  pending: '#fbbf24', // amber-400
  confirmed: '#10b981', // emerald-500
  cancelled: '#f43f5e', // rose-500
  completed: '#0ea5e9', // sky-500
  refunded: '#8b5cf6', // violet-500
  default: '#94a3b8', // slate-400
}

// Helper Functions (Same as your original logic)
const getMonthLabel = (value) => {
  if (typeof value === 'number') return MONTHS[Math.max(0, Math.min(11, value - 1))]
  if (typeof value !== 'string') return null
  const shortMatch = MONTHS.find((month) => month.toLowerCase() === value.slice(0, 3).toLowerCase())
  if (shortMatch) return shortMatch
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) return MONTHS[date.getMonth()]
  return null
}

const getCountValue = (value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    return (
      value.count ?? value.total ?? value.totalCount ?? value.bookingsCount ?? value.hotelsCount ?? value.users ?? value.value ?? 0
    )
  }
  return 0
}

const getDataList = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.result)) return data.result
  if (Array.isArray(data?.items)) return data.items
  return []
}

const getNumericValue = (item, keys) => {
  for (const key of keys) {
    if (typeof item?.[key] === 'number') return item[key]
  }
  return 0
}

const normalizeHotelChartData = (data) => {
  const base = MONTHS.map((month) => ({ month, 'Hotels Created': 0 }))
  getDataList(data).forEach((item) => {
    const monthLabel = getMonthLabel(item.month ?? item.monthName ?? item._id?.month ?? item.date)
    if (!monthLabel) return
    const currentMonth = base.find((entry) => entry.month === monthLabel)
    if (!currentMonth) return
    currentMonth['Hotels Created'] = getNumericValue(item, ['Hotels Created', 'hotelsCreated', 'count', 'total', 'value', 'created'])
  })
  return base
}

const normalizePartnerChartData = (data) => {
  const base = MONTHS.map((month) => {
    const monthItem = { month }
    ROLE_KEYS.forEach((role) => { monthItem[role] = 0 })
    return monthItem
  })
  getDataList(data).forEach((item) => {
    const monthLabel = getMonthLabel(item.month ?? item.monthName ?? item._id?.month ?? item.date)
    const role = item.role ?? item._id?.role ?? item.partnerRole
    if (!monthLabel || !role) return
    const monthItem = base.find((entry) => entry.month === monthLabel)
    if (!monthItem) return
    monthItem[role] = (monthItem[role] || 0) + getNumericValue(item, ['count', 'total', 'value', 'partners', 'users'])
  })
  return base
}

const normalizeBookingChartData = (data) => {
  const statusTotals = {}
  getDataList(data).forEach((item) => {
    const status = String(item.status ?? item._id?.status ?? 'Unknown')
    const total = getNumericValue(item, ['count', 'total', 'value', 'bookings'])
    statusTotals[status] = (statusTotals[status] || 0) + total
  })
  return Object.entries(statusTotals).map(([name, value]) => ({ name, value }))
}

// Custom Tooltip for professional look
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white/95 p-4 shadow-xl backdrop-blur-md">
        <p className="mb-2 font-bold text-slate-800">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="font-medium text-slate-600">{entry.name}:</span>
            <span className="font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function Dashboard() {
  const dispatch = useDispatch()
  const { sidebarLinks } = useSelector(selectAuth)
  const {
    bookingsCount,
    hotelsCount,
    userDetails,
    hotelData,
    partnerData,
    bookingData,
    selectedYear,
    loading,
    error,
  } = useSelector(selectDashboard)

  useEffect(() => {
    dispatch(fetchDashboardData(selectedYear))
  }, [dispatch, selectedYear])

  const totalLinks = useMemo(
    () => Object.values(sidebarLinks ?? {}).reduce((total, links) => total + links.length, 0),
    [sidebarLinks]
  )

  const userCount = getCountValue(userDetails)
  const bookingCount = getCountValue(bookingsCount)
  const hotelCount = getCountValue(hotelsCount)

  const hotelChartData = useMemo(() => normalizeHotelChartData(hotelData), [hotelData])
  const partnerChartData = useMemo(() => normalizePartnerChartData(partnerData), [partnerData])
  const bookingPieData = useMemo(() => normalizeBookingChartData(bookingData), [bookingData])

  return (
    <div className="bg-slate-50/50 p-6 md:p-8">
      <Breadcrumb />

      {/* --- Header & Filters --- */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your analytics and performance metrics for the year.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <select
            value={selectedYear}
            onChange={(event) => dispatch(setSelectedYear(Number(event.target.value)))}
            className="cursor-pointer rounded-lg bg-transparent px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50"
          >
            {[2023, 2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => dispatch(fetchDashboardData(selectedYear))}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 flex items-center justify-between rounded-xl border border-red-200 bg-red-50/50 px-5 py-4 text-sm text-red-600">
          <span className="flex items-center gap-2">
            <Activity size={18} /> {error}
          </span>
          <button type="button" onClick={() => dispatch(clearDashboardError())} className="font-semibold hover:text-red-800">
            Dismiss
          </button>
        </div>
      )}

      {/* --- Summary KPI Cards --- */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Bookings', value: bookingCount, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { title: 'Total Hotels', value: hotelCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Total Users', value: userCount, color: 'text-amber-600', bg: 'bg-amber-50' },
          { title: 'Active Modules', value: totalLinks, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-transform hover:-translate-y-1">
            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.title}</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {loading ? <span className="text-lg text-slate-400">Loading...</span> : stat.value}
            </h2>
          </div>
        ))}
      </div>

            {/* --- Modern Charts Section --- */}
            <div className="grid gap-6 xl:grid-cols-2">
              
              {/* 1. Area Chart: Hotels Created */}
              <section className="rounded-2xl bg-white p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] xl:col-span-2">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Building2 size={20} /></div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Hotels Onboarding Trends</h2>
                    <p className="text-sm text-slate-500">Monthly growth of newly created hotels</p>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hotelChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHotels" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Hotels Created" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorHotels)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* 2. Stacked Bar Chart: Partners by Role */}
              <section className="rounded-2xl bg-white p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><Users size={20} /></div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Partner Distribution</h2>
                    <p className="text-sm text-slate-500">Monthly breakdown by roles</p>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={partnerChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                      {ROLE_KEYS.map((role, index) => (
                        <Bar key={role} dataKey={role} stackId="a" fill={ROLE_COLORS[index % ROLE_COLORS.length]} radius={index === ROLE_KEYS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* 3. Modern Donut Chart: Bookings Status */}
              <section className="rounded-2xl bg-white p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
                <div className="mb-2 flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2 text-amber-600"><PieChartIcon size={20} /></div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Booking Success Rate</h2>
                    <p className="text-sm text-slate-500">Overall status distribution</p>
                  </div>
                </div>
                
                {bookingPieData.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center text-slate-400">
                    No booking data available
                  </div>
                ) : (
                  <div className="flex h-[300px] w-full flex-col sm:flex-row items-center justify-center">
                    <div className="h-full flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={bookingPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {bookingPieData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={STATUS_COLORS[entry.name.toLowerCase()] || STATUS_COLORS.default} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Beautiful Custom Legend for Donut Chart */}
                    <div className="flex flex-col gap-3 sm:w-1/3 w-full px-4">
                      {bookingPieData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: STATUS_COLORS[item.name.toLowerCase()] || STATUS_COLORS.default }}
                            />
                            <span className="text-sm font-medium text-slate-600 capitalize">{item.name}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

      </div>
    </div>
  )
}

export default Dashboard
