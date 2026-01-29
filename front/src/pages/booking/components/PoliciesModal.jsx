import React from 'react';
import {
  AlertCircle, BadgePercent, CreditCard, FileText, MapPin,
  ShieldCheck, Users, Utensils, UtensilsCrossed, Wind, X
} from 'lucide-react';
import { badgeForPolicy } from '../utils/bookingHelpers';

/**
 * Hotel Policies Modal
 */
const PoliciesModal = ({ policies, onClose }) => {
  if (!policies || policies.length === 0) return null;
  const policy = policies[0] || {};
  const cleanTime = (val) => (val ? String(val).replace(/Check-(in|out) Time:/i, '').trim() : '');

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Property Policies</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Check-in</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {cleanTime(policy.checkInPolicy || policy.checkIn) || '12:00 PM'}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Check-out</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {cleanTime(policy.checkOutPolicy || policy.checkOut) || '11:00 AM'}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
              <ShieldCheck size={18} className="text-blue-600" /> Guest & Property Rules
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: 'Unmarried Couples', val: policy.unmarriedCouplesAllowed, icon: <Users size={16} /> },
                { label: 'Bachelors Allowed', val: policy.bachelorAllowed, icon: <Users size={16} /> },
                { label: 'International Guests', val: policy.internationalGuestAllowed, icon: <MapPin size={16} /> },
                { label: 'Pets', val: policy.petsAllowed, icon: <AlertCircle size={16} /> },
                { label: 'Smoking', val: policy.smokingAllowed, icon: <Wind size={16} /> },
                { label: 'Alcohol', val: policy.alcoholAllowed, icon: <UtensilsCrossed size={16} /> },
                { label: 'Outside Food', val: policy.outsideFoodPolicy, icon: <Utensils size={16} /> },
                { label: 'Payment Mode', val: policy.paymentMode, icon: <CreditCard size={16} /> }
              ].map((rule, idx) => {
                const badge = badgeForPolicy(rule.val);
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-600 text-sm flex items-center gap-2">
                      {rule.icon} {rule.label}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${badge.cls}`}>{badge.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {policy.hotelsPolicy && (
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-gray-500" /> General Hotel Policy
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed pl-1">{policy.hotelsPolicy}</p>
              </div>
            )}

            {policy.cancellationPolicy && (
              <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
                <h4 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
                  <AlertCircle size={18} className="text-rose-600" /> Cancellation Policy
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed pl-1">{policy.cancellationPolicy}</p>
              </div>
            )}

            {policy.refundPolicy && (
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <BadgePercent size={18} className="text-emerald-600" /> Refund Policy
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed pl-1">{policy.refundPolicy}</p>
              </div>
            )}

            {!policy.hotelsPolicy && policy.rules && (
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-3">Additional Rules</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{policy.rules}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
          <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoliciesModal;
