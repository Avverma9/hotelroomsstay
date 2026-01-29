import {
  Edit as EditIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  ArrowForwardIos as ArrowIcon,
} from "@mui/icons-material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchProfileData } from "../../redux/slices/profileSlice";
import { userId } from "../../utils/Unauthorized";

function InfoField({ icon, label, value, onActionClick }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-200/60 last:border-b-0">
      <div className="flex items-center gap-4">
        <div className="text-slate-400">{icon}</div>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <div>
        {value ? (
          <p className="text-sm text-slate-800 font-semibold truncate max-w-[200px]">{value}</p>
        ) : (
          <button
            onClick={onActionClick}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Add Info
          </button>
        )}
      </div>
    </div>
  );
}

const ProfileSkeleton = () => (
  <div className="w-full max-w-4xl mx-auto p-4 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 p-6 bg-white rounded-2xl shadow-lg flex flex-col items-center">
        <div className="w-20 h-20 bg-slate-200 rounded-full"></div>
        <div className="w-3/5 h-5 mt-4 bg-slate-200 rounded-md"></div>
        <div className="w-4/5 h-3 mt-2 bg-slate-200 rounded-md"></div>
        <div className="w-full h-10 mt-6 bg-slate-200 rounded-lg"></div>
        <div className="w-full h-9 mt-2 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="md:col-span-2 p-6 bg-white rounded-2xl shadow-lg">
        <div className="w-1/3 h-5 bg-slate-200 rounded-md mb-6"></div>
        <div className="space-y-4">
          {Array.from(new Array(5)).map((_, index) => (
            <div key={index} className="flex justify-between items-center h-8">
              <div className="w-1/4 h-4 bg-slate-200 rounded-md"></div>
              <div className="w-1/2 h-4 bg-slate-200 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.profile);

  useEffect(() => {
    if (!userId) {
      navigate("/login", { replace: true });
      return;
    }
    dispatch(fetchProfileData(userId));
  }, [dispatch, navigate]);

  if (!userId) return null;

  if (error) {
    return (
      <div className="p-4 text-red-600 text-center">
        Error loading profile data: {error.message}
      </div>
    );
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  const handleEdit = () => {
    navigate("/profile-update/user-data/page");
  };

  const handleLogOut = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="w-full p-4 pb-24 md:pb-4">
      <div className="w-full max-w-4xl mx-auto pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col items-center text-center bg-white rounded-2xl shadow-lg p-6 border border-slate-200/75">
            <img
              src={data?.images?.[0] || `https://i.pravatar.cc/150?u=${userId}`}
              alt={data?.name || "User Avatar"}
              className="w-20 h-20 object-cover rounded-full ring-4 ring-slate-100"
            />
            <h1 className="mt-4 text-base font-bold text-slate-900 truncate max-w-full">
              {data?.userName || "User Name"}
            </h1>
            <p className="text-xs text-slate-500 mt-1 truncate max-w-full">
              {data?.email}
            </p>

            <div className="w-full mt-6 space-y-2">
              <button
                onClick={handleEdit}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                <EditIcon sx={{ fontSize: 16 }} />
                Update Profile
              </button>
              <button
                onClick={handleLogOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 transition-colors"
              >
                <LogoutIcon sx={{ fontSize: 16 }} />
                Log Out
              </button>
            </div>
          </div>
          <div className="md:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-slate-200/75">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">
              Account Details
            </h2>
            <div className="mt-2">
              <InfoField
                icon={<PersonIcon sx={{ fontSize: 20 }} />}
                label="Full Name"
                value={data?.name}
                onActionClick={handleEdit}
              />
              <InfoField
                icon={<EmailIcon sx={{ fontSize: 20 }} />}
                label="Email Address"
                value={data?.email}
                onActionClick={handleEdit}
              />
              <InfoField
                icon={<PhoneIcon sx={{ fontSize: 20 }} />}
                label="Phone Number"
                value={data?.mobile}
                onActionClick={handleEdit}
              />
              <InfoField
                icon={<HomeIcon sx={{ fontSize: 20 }} />}
                label="Address"
                value={data?.address}
                onActionClick={handleEdit}
              />
              <InfoField
                icon={<LockIcon sx={{ fontSize: 20 }} />}
                label="Password"
                value="••••••••••"
                onActionClick={handleEdit}
              />
            </div>
            <button
                onClick={handleEdit}
                className="w-full flex items-center justify-between mt-4 px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 transition-colors"
              >
                <span>Go to Settings</span>
                <ArrowIcon sx={{ fontSize: 14 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}