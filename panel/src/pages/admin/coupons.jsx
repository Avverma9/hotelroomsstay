import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BadgePercent, Gift, Mail, TicketPercent, Users } from 'lucide-react'
import Breadcrumb from '../../components/breadcrumb'
import {
  clearCouponFeedback,
  createCoupon,
  selectAdminCoupon,
} from '../../../redux/slices/admin/coupon'

const getInitialFormState = () => ({
  type: 'partner',
  couponName: '',
  discountPrice: '',
  validity: '',
  quantity: '',
  assignedTo: '',
})

function CouponsPage() {
  const dispatch = useDispatch()
  const { creating, createError, createMessage, createdCoupons, lastCreatedCoupon } =
    useSelector(selectAdminCoupon)
  const [formState, setFormState] = useState(getInitialFormState())

  useEffect(() => {
    return () => {
      dispatch(clearCouponFeedback())
    }
  }, [dispatch])

  const isUserCoupon = formState.type === 'user'
  const helperText = useMemo(
    () =>
      isUserCoupon
        ? 'User coupon ek specific email ke liye one-time ya limited use code hota hai.'
        : 'Partner coupon hotel portfolio level par multi-use discount ke liye hota hai.',
    [isUserCoupon],
  )

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormState((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === 'type' && value === 'partner' ? { assignedTo: '' } : {}),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const payload = {
      type: formState.type,
      couponName: formState.couponName.trim(),
      discountPrice: Number(formState.discountPrice),
      validity: formState.validity,
      quantity: Number(formState.quantity),
    }

    if (formState.type === 'user') {
      payload.assignedTo = formState.assignedTo.trim()
    }

    await dispatch(createCoupon(payload)).unwrap()
    setFormState((currentForm) => ({
      ...getInitialFormState(),
      type: currentForm.type,
    }))
  }

  return (
    <div className="bg-slate-50/60 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb />

        <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_420px]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <TicketPercent size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  Create a Coupon
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Partner aur user coupon dono yahin se create karo. API payload automatically
                  selected type ke hisaab se banega.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: 'Coupon Types',
                  value: 'Partner + User',
                  icon: Gift,
                  tone: 'bg-indigo-50 text-indigo-600',
                },
                {
                  label: 'User Targeting',
                  value: 'Email-based',
                  icon: Mail,
                  tone: 'bg-emerald-50 text-emerald-600',
                },
                {
                  label: 'Usage Control',
                  value: 'Quantity-based',
                  icon: Users,
                  tone: 'bg-amber-50 text-amber-600',
                },
              ].map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                      <Icon size={18} />
                    </div>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                  </div>
                )
              })}
            </div>

            {(createError || createMessage) && (
              <div
                className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${
                  createError
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {createError || createMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Coupon Type
                  </span>
                  <select
                    name="type"
                    value={formState.type}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white"
                  >
                    <option value="partner">Partner</option>
                    <option value="user">User</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Coupon Name
                  </span>
                  <input
                    required
                    type="text"
                    name="couponName"
                    value={formState.couponName}
                    onChange={handleChange}
                    placeholder="e.g. SUMMERFUN"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Discount Price
                  </span>
                  <input
                    required
                    min="1"
                    type="number"
                    name="discountPrice"
                    value={formState.discountPrice}
                    onChange={handleChange}
                    placeholder="e.g. 750"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Validity
                  </span>
                  <input
                    required
                    type="date"
                    name="validity"
                    value={formState.validity}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Quantity
                  </span>
                  <input
                    required
                    min="1"
                    type="number"
                    name="quantity"
                    value={formState.quantity}
                    onChange={handleChange}
                    placeholder={isUserCoupon ? 'e.g. 1' : 'e.g. 200'}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white"
                  />
                </label>

                {isUserCoupon && (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Assigned To
                    </span>
                    <input
                      required
                      type="email"
                      name="assignedTo"
                      value={formState.assignedTo}
                      onChange={handleChange}
                      placeholder="test@example.com"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white"
                    />
                  </label>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Type Guidance</p>
                <p className="mt-1 leading-6">{helperText}</p>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                <BadgePercent size={16} />
                {creating ? 'Creating Coupon...' : 'Create Coupon'}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
              <h2 className="text-lg font-bold text-slate-900">Latest Created Coupon</h2>
              {!lastCreatedCoupon ? (
                <p className="mt-3 text-sm text-slate-500">
                  Abhi tak koi coupon create nahi hua hai.
                </p>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    {lastCreatedCoupon.type} coupon
                  </p>
                  <p className="mt-2 text-xl font-extrabold text-slate-900">
                    {lastCreatedCoupon.couponName}
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Coupon Code</span>
                      <span className="font-semibold text-slate-900">
                        {lastCreatedCoupon.couponCode || 'Generated'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Discount</span>
                      <span className="font-semibold text-slate-900">
                        {lastCreatedCoupon.discountPrice}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Quantity</span>
                      <span className="font-semibold text-slate-900">
                        {lastCreatedCoupon.quantity}
                      </span>
                    </div>
                    {lastCreatedCoupon.assignedTo && (
                      <div className="flex items-center justify-between gap-3">
                        <span>Assigned To</span>
                        <span className="truncate font-semibold text-slate-900">
                          {lastCreatedCoupon.assignedTo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
              <h2 className="text-lg font-bold text-slate-900">Recent Coupons</h2>
              <div className="mt-4 space-y-3">
                {createdCoupons.length === 0 ? (
                  <p className="text-sm text-slate-500">Recent coupon history yahan show hogi.</p>
                ) : (
                  createdCoupons.map((coupon) => (
                    <div
                      key={coupon._id || coupon.couponCode || coupon.couponName}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {coupon.couponName}
                          </p>
                          <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                            {coupon.type}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-600">
                          {coupon.couponCode || 'Generated'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default CouponsPage
