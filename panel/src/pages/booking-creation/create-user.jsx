import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Breadcrumb from '../../components/breadcrumb';
import { createUser, clearUser } from '../../../redux/slices/user';
import { clearSelectedHotel, saveSelectedGuest } from '../../utils/booking-storage';

export default function CreateUser() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { loading, error, user } = useSelector((state) => state.user);

  useEffect(() => {
    if (location.state?.mobile) {
      setMobile(location.state.mobile);
    }
    // Clear previous user state on mount
    dispatch(clearUser());
  }, [dispatch, location.state?.mobile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsCreating(true);
    dispatch(createUser({ userName, email, mobile }));
  };

  useEffect(() => {
    if (isCreating && user) {
      const newUser = user.data || user.user || user;

      if (newUser && (newUser.userId || newUser._id)) {
        clearSelectedHotel();
        saveSelectedGuest({
          id: newUser._id || newUser.userId,
          userId: newUser.userId,
          userName: newUser.userName,
          email: newUser.email,
          mobile: newUser.mobile,
          address: newUser.address || "",
          isExistingUser: true,
        });
        
        navigate('/booking-creation/hotels');
      }
    }
  }, [user, isCreating, navigate, dispatch]);

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white/90 p-6 md:p-8">
      <Breadcrumb />

      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Create New User
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
            Create a new user profile to proceed with the booking.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter user's full name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter user's email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Mobile Number
              </label>
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? 'Creating User...' : 'Create User and Proceed'}
            </button>
            {error && isCreating && (
              <div className="mt-2 bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-600">
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
