import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  CameraAlt as CameraAltIcon,
  PersonOutlined as PersonIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  HomeOutlined as HomeIcon,
  LockOutlined as LockIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

import { updateProfileData, fetchProfileData } from '../../redux/slices/profileSlice';
import { userId } from '../../utils/Unauthorized';
import { useLoader } from '../../utils/loader';
import { useToast } from '../../utils/toast';

const InputField = ({ icon, name, value, onChange, type = 'text', placeholder }) => (
  <div className="relative">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
      <span className="text-slate-400">{icon}</span>
    </div>
    <input
      type={type}
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="block w-full rounded-md border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
    />
  </div>
);

export  default function ProfileUpdatePage () {
  const dispatch = useDispatch();
  const toast = useToast();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { data, error } = useSelector((state) => state.profile);

  const [formData, setFormData] = useState({
    userName: '', images: [], email: '', address: '', mobile: '', password: '',
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (userId) dispatch(fetchProfileData(userId));
  }, [dispatch]);

  useEffect(() => {
    if (data) {
      setFormData({
        userName: data.userName || '',
        email: data.email || '',
        mobile: data.mobile || '',
        address: data.address || '',
        password: '',
        images: [],
      });
      if (data.images && data.images.length > 0) {
        setImagePreview(data.images[0]);
      }
    }
  }, [data]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, images: [file] }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const formDataObj = new FormData();
      formDataObj.append('userId', userId);

      Object.keys(formData).forEach(key => {
        if (key === 'images' && formData.images.length > 0) {
          formDataObj.append('images', formData.images[0]);
        } else if (formData[key] && key !== 'images') {
          formDataObj.append(key, formData[key]);
        }
      });
      
      const actionResult = await dispatch(updateProfileData(formDataObj));
      if (updateProfileData.fulfilled.match(actionResult)) {
        toast.success("Profile updated successfully!");
        navigate('/profile');
      } else {
        throw new Error(actionResult.payload || 'Update failed');
      }
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      hideLoader();
    }
  };

  if (error) return <p className="p-4 text-red-600">Error: {error.message}</p>;

  return (
    <div className="flex w-full items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <div className="mx-auto relative w-24">
            <img
              src={imagePreview || `https://i.pravatar.cc/150?u=${userId}`}
              alt="User Avatar"
              className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-100"
            />
            <label htmlFor="image-upload" className="absolute -right-1 bottom-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-800 text-white shadow-md transition-transform hover:bg-slate-700 hover:scale-110">
              <CameraAltIcon sx={{ fontSize: 16 }} />
              <input id="image-upload" type="file" hidden accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Edit Profile</h1>
            <p className="text-xs text-slate-500">Update your information below</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                placeholder="Your Name"
                icon={<PersonIcon sx={{ fontSize: 20 }} />}
            />
            <InputField
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
                icon={<EmailIcon sx={{ fontSize: 20 }} />}
            />
             <InputField
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder="Mobile Number"
                icon={<PhoneIcon sx={{ fontSize: 20 }} />}
            />
            <InputField
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Your Address"
                icon={<HomeIcon sx={{ fontSize: 20 }} />}
            />
            <div className="sm:col-span-2">
                <InputField
                    name="password"
                    type="password"
                    placeholder="New Password (optional)"
                    onChange={handleInputChange}
                    icon={<LockIcon sx={{ fontSize: 20 }} />}
                />
            </div>
        </div>
        
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          <SaveIcon sx={{ fontSize: 18 }} />
          Save Changes
        </button>
      </form>
    </div>
  );
};
