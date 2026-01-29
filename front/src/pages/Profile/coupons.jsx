import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { fetchDefaultCoupon } from '../../redux/slices/profileSlice';
import { useLoader } from '../../utils/loader';

export default function CouponPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const coupon = useSelector((state) => state.profile.coupon);
  const [daysRemaining, setDaysRemaining] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    showLoader();
    dispatch(fetchDefaultCoupon())
      .unwrap()
      .finally(() => {
        hideLoader();
      });
  }, [dispatch]);

  useEffect(() => {
    if (coupon?.length) {
      const countdowns = coupon.map((item) => {
        const expirationDate = new Date(item.validity);
        const now = new Date();
        const diffTime = expirationDate - now;
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        return diffDays;
      });
      setDaysRemaining(countdowns);
    } else {
      setDaysRemaining([]);
    }
  }, [coupon]);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  if (!coupon || coupon.length === 0) {
    return (
      <div className="mx-auto my-6 max-w-80 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <div className="mx-auto mb-3 h-12 w-12 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-full w-full">
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 12h-3V9"/>
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 18v-2"/>
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8V6"/>
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 12h-2"/>
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 12h-2"/>
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-bold text-slate-600">No Coupons Available</h3>
        <p className="text-xs text-slate-500">Check back later for new deals!</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-80 px-3 py-4 font-sans">
      <h2 className="mb-4 text-center text-lg font-extrabold tracking-tight text-slate-800">
        Coupons Just For You
      </h2>

      <div className="flex flex-col gap-3">
        {coupon.map((item, index) => {
          const isExpired = item.expired || new Date(item.validity) < new Date();
          const badgeText = isExpired
            ? 'Expired'
            : `${daysRemaining[index]}d left`;

          return (
            <div
              key={index}
              className="flex w-full flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
            >
              {/* Top Section */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="text-lg font-extrabold text-indigo-600">₹{item.discountPrice} OFF</div>
                  <div className="text-xs font-medium text-slate-600 leading-tight">{item.couponName}</div>
                </div>
                <div
                  className={[
                    'rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
                    isExpired ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800',
                  ].join(' ')}
                >
                  {badgeText}
                </div>
              </div>

              {/* Bottom Section */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5 text-center text-xs font-bold tracking-wide text-blue-700">
                  {item.couponCode}
                </div>
                <button
                  onClick={() => copyToClipboard(item.couponCode)}
                  className="whitespace-nowrap rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:translate-y-px"
                >
                  {copiedCode === item.couponCode ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
