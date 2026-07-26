import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, User, UserCog } from 'lucide-react'
import { selectAuth } from '../../../redux/slices/authSlice'

export default function FileComplaintSelection() {
  const navigate = useNavigate()
  const { user } = useSelector(selectAuth)
  
  // Check if user is Admin or Developer
  const normalizedRole = String(user?.role || '').toLowerCase()
  const isAdminOrDeveloper = normalizedRole === 'admin' || normalizedRole === 'developer'

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 font-sans">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
            <ShieldCheck size={26} className="text-indigo-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">File a Complaint</h1>
          <p className="mt-2 text-sm text-slate-500">Choose the type of complaint you want to file</p>
        </div>

        {/* Cards Grid */}
        <div className={`grid gap-6 ${isAdminOrDeveloper ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-lg mx-auto'}`}>
          
          {/* User Complaint Card */}
          <button
            onClick={() => navigate('/complaint/user/create')}
            className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 text-left shadow-sm transition-all hover:border-indigo-400 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200">
              <User size={22} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">User Complaint</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              File a complaint for yourself regarding any issue you've experienced with our services.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
              <span>File for yourself</span>
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="absolute bottom-0 right-0 h-24 w-24 opacity-5 group-hover:opacity-10">
              <User size={96} className="text-blue-600" />
            </div>
          </button>

          {/* Admin Complaint Card - Only visible to Admin/Developer */}
          {isAdminOrDeveloper && (
            <button
              onClick={() => navigate('/complaint/admin/create')}
              className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 text-left shadow-sm transition-all hover:border-rose-400 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 group-hover:bg-rose-200">
                <UserCog size={22} className="text-rose-600" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Admin Complaint</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Create a complaint on behalf of any user in the system. Admin and Developer access only.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600">
                <span>Admin Access</span>
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="absolute bottom-0 right-0 h-24 w-24 opacity-5 group-hover:opacity-10">
                <UserCog size={96} className="text-rose-600" />
              </div>
            </button>
          )}
        </div>

        {/* Role Info */}
        <div className="mt-8 text-center">
          <p className="text-xs font-semibold text-slate-400">
            Logged in as: <span className="text-slate-600">{user?.name || user?.email || 'User'}</span> ({user?.role || 'Unknown'})
          </p>
          {!isAdminOrDeveloper && (
            <p className="mt-2 text-xs text-slate-400">
              Admin Complaint option is only available for Admin and Developer roles
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
