import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Copy,
  Gift,
  Hash,
  Info,
  Layers,
  Loader2,
  Mail,
  Percent,
  Sparkles,
  Ticket,
  TicketPercent,
  UserCheck,
  Users,
} from 'lucide-react'
import Breadcrumb from '../../components/breadcrumb'
import {
  clearCouponFeedback,
  createCoupon,
  fetchRecentCoupons,
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
  const [copiedCode, setCopiedCode] = useState(null)

  useEffect(() => {
    dispatch(fetchRecentCoupons())
  }, [dispatch])

  useEffect(() => {
    return () => {
      dispatch(clearCouponFeedback())
    }
  }, [dispatch])

  const sortedCoupons = useMemo(() => {
    if (!Array.isArray(createdCoupons)) return []
    return [...createdCoupons].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime()
      const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime()
      if (dateA && dateB) return dateB - dateA
      return 0
    }).reverse()
  }, [createdCoupons])

  const isUserCoupon = formState.type === 'user'

  const helperText = useMemo(
    () =>
      isUserCoupon
        ? 'User coupons target a verified email address for exclusive one-time or controlled personal redemptions.'
        : 'Partner coupons apply across designated hotel inventories for broad, high-volume promotional campaigns.',
    [isUserCoupon],
  )

  const handleCopy = (code) => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

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
      couponName: formState.couponName.trim().toUpperCase(),
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
    <div className="min-h-screen bg-white font-['Roboto',sans-serif] text-neutral-900 antialiased selection:bg-neutral-200">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb />

        <div className="mt-4 flex flex-col gap-2 border-b border-neutral-200 pb-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
            <Ticket className="h-4 w-4" />
            <span>Promotion Management</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              Coupon Desk
            </h1>
            <p className="text-xs text-neutral-500">
              Configure tiered partner vouchers and targeted user incentives.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
          {[
            {
              label: 'Classification',
              value: 'Partner & User Portfolios',
              icon: Layers,
            },
            {
              label: 'Direct Allocation',
              value: 'Single Recipient Target',
              icon: UserCheck,
            },
            {
              label: 'Redemption Cap',
              value: 'Quota Managed Limit',
              icon: Hash,
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs font-bold text-neutral-800">
                    {item.value}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-12 items-start">
          <section className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-2 text-neutral-900">
                  <TicketPercent className="h-5 w-5 text-neutral-600" />
                  <h2 className="text-base sm:text-lg font-bold">Generate New Voucher</h2>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                  Standard Emission
                </span>
              </div>

              {(createError || createMessage) && (
                <div
                  className={`mt-4 flex items-center gap-2.5 rounded-lg border p-3.5 text-xs font-medium ${
                    createError
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {createError ? (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  )}
                  <span>{createError || createMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                    Campaign Scope
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleChange({ target: { name: 'type', value: 'partner' } })
                      }
                      className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-4 text-xs font-bold transition ${
                        formState.type === 'partner'
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      <span>Partner Scope</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleChange({ target: { name: 'type', value: 'user' } })
                      }
                      className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-4 text-xs font-bold transition ${
                        formState.type === 'user'
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <Mail className="h-4 w-4" />
                      <span>User Exclusive</span>
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">
                      Voucher Descriptor
                    </label>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        name="couponName"
                        value={formState.couponName}
                        onChange={(e) =>
                          handleChange({
                            target: { name: 'couponName', value: e.target.value.toUpperCase() },
                          })
                        }
                        placeholder="e.g. MONSOON300"
                        className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-bold tracking-wider text-neutral-900 uppercase placeholder:normal-case placeholder:font-normal placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">
                      Discount Allowance (₹)
                    </label>
                    <div className="relative">
                      <input
                        required
                        min="1"
                        type="number"
                        name="discountPrice"
                        value={formState.discountPrice}
                        onChange={handleChange}
                        placeholder="e.g. 500"
                        className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">
                      Term Expiration
                    </label>
                    <div className="relative">
                      <input
                        required
                        type="date"
                        name="validity"
                        value={formState.validity}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-900 focus:border-neutral-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">
                      Issuance Volume
                    </label>
                    <div className="relative">
                      <input
                        required
                        min="1"
                        type="number"
                        name="quantity"
                        value={formState.quantity}
                        onChange={handleChange}
                        placeholder={isUserCoupon ? '1' : '100'}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {isUserCoupon && (
                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-bold text-neutral-700">
                      Designated Account Mail
                    </label>
                    <div className="relative">
                      <input
                        required
                        type="email"
                        name="assignedTo"
                        value={formState.assignedTo}
                        onChange={handleChange}
                        placeholder="patron@domain.com"
                        className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5 rounded-lg border border-neutral-100 bg-neutral-50 p-3.5 text-xs text-neutral-600">
                  <Info className="h-4 w-4 shrink-0 text-neutral-400 mt-0.5" />
                  <p className="leading-relaxed">{helperText}</p>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-neutral-900 py-3 text-xs font-bold text-white transition hover:bg-black disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Validating & Registering...</span>
                    </>
                  ) : (
                    <>
                      <Percent className="h-4 w-4" />
                      <span>Register Promotion Voucher</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>

          <aside className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700">
                  Active Emission
                </h2>
                <Sparkles className="h-4 w-4 text-neutral-400" />
              </div>

              {!lastCreatedCoupon ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-neutral-400">
                    No records generated during this session.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3.5">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                        {lastCreatedCoupon.type} Tier
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        ₹{lastCreatedCoupon.discountPrice} Reduction
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="font-mono text-base font-bold tracking-wider text-neutral-900">
                        {lastCreatedCoupon.couponName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            lastCreatedCoupon.couponCode || lastCreatedCoupon.couponName,
                          )
                        }
                        className="flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-700 hover:bg-neutral-50 transition"
                      >
                        <Copy className="h-3 w-3" />
                        <span>
                          {copiedCode ===
                          (lastCreatedCoupon.couponCode || lastCreatedCoupon.couponName)
                            ? 'Copied'
                            : 'Copy'}
                        </span>
                      </button>
                    </div>

                    <div className="mt-4 divide-y divide-neutral-100 border-t border-neutral-200 pt-2 text-xs">
                      <div className="flex justify-between py-1 text-neutral-600">
                        <span>Allocated Pool</span>
                        <span className="font-bold text-neutral-900">
                          {lastCreatedCoupon.quantity} Units
                        </span>
                      </div>
                      {lastCreatedCoupon.assignedTo && (
                        <div className="flex justify-between py-1 text-neutral-600">
                          <span>Target Patron</span>
                          <span className="font-bold text-neutral-900 truncate max-w-[180px]">
                            {lastCreatedCoupon.assignedTo}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700">
                  Recent Coupons
                </h2>
                <span className="text-xs font-medium text-neutral-400">
                  {sortedCoupons.length} Recorded
                </span>
              </div>

              <div className="mt-4 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {sortedCoupons.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-neutral-400">No recent coupons found.</p>
                  </div>
                ) : (
                  sortedCoupons.map((coupon) => {
                    const code = coupon.couponCode || coupon.couponName
                    const isCopied = copiedCode === code

                    return (
                      <div
                        key={coupon._id || coupon.couponCode || coupon.couponName}
                        className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-3 hover:border-neutral-200 transition"
                      >
                        <div className="min-w-0 pr-3">
                          <span className="block truncate text-xs font-bold text-neutral-900">
                            {coupon.couponName}
                          </span>
                          <span className="block text-[10px] uppercase font-medium tracking-wider text-neutral-400 mt-0.5">
                            {coupon.type} • {coupon.quantity} Left
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(code)}
                          title="Click to copy code"
                          className="flex items-center gap-1.5 shrink-0 rounded border border-neutral-200 bg-white px-2.5 py-1 font-mono text-xs font-bold text-neutral-800 hover:bg-neutral-100 hover:border-neutral-300 transition"
                        >
                          <span>{code || 'ACTIVE'}</span>
                          {isCopied ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-neutral-400" />
                          )}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default CouponsPage