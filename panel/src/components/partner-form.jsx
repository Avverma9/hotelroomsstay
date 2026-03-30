import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'

const ROLE_OPTIONS = ['Admin', 'PMS', 'Developer', 'TMS', 'CA', 'Rider']

const getInitialFormState = (partner) => ({
  name: partner?.name || '',
  email: partner?.email || '',
  mobile: partner?.mobile ? String(partner.mobile) : '',
  role: partner?.role || 'PMS',
  password: '',
  address: partner?.address || '',
  city: partner?.city || '',
  state: partner?.state || '',
  pinCode: partner?.pinCode ? String(partner.pinCode) : '',
  status: partner?.status ? 'true' : 'false',
  imageFile: null,
})

function PartnerForm({
  mode = 'create',
  partner = null,
  submitting = false,
  onClose,
  onSubmit,
}) {
  const [formValues, setFormValues] = useState(getInitialFormState(partner))
  const [imagePreview, setImagePreview] = useState(partner?.images?.[0] || '')

  useEffect(() => {
    setFormValues(getInitialFormState(partner))
    setImagePreview(partner?.images?.[0] || '')
  }, [partner, mode])

  useEffect(() => () => {
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const title = useMemo(
    () => (mode === 'create' ? 'Create Partner' : 'Update Partner'),
    [mode],
  )

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormValues((previousValues) => ({
      ...previousValues,
      [name]: value,
    }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null

    setFormValues((previousValues) => ({
      ...previousValues,
      imageFile: file,
    }))

    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }

    setImagePreview(file ? URL.createObjectURL(file) : partner?.images?.[0] || '')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(formValues)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'create'
                ? 'Add a new partner with role and account access details.'
                : 'Update partner profile information and upload a new image if needed.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-88px)] overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Partner preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <ImagePlus size={30} />
                    </div>
                  )}
                </div>

                <label className="w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600">
                  Upload partner image
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Partner Name</span>
                <input
                  required
                  type="text"
                  name="name"
                  value={formValues.name}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-300"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Email Address</span>
                <input
                  required
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-300"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Mobile Number</span>
                <input
                  required
                  type="tel"
                  name="mobile"
                  value={formValues.mobile}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-300"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Role</span>
                <select
                  required
                  name="role"
                  value={formValues.role}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-300"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Status</span>
                <select
                  required
                  name="status"
                  value={formValues.status}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-300"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  {mode === 'create' ? 'Password' : 'Password (optional)'}
                </span>
                <input
                  type="text"
                  name="password"
                  value={formValues.password}
                  onChange={handleChange}
                  required={mode === 'create'}
                  placeholder={mode === 'create' ? 'Enter password' : 'Leave blank to keep current password'}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-300"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Address</span>
                <textarea
                  rows="4"
                  name="address"
                  value={formValues.address}
                  onChange={handleChange}
                  required
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-300"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">City</span>
                <input
                  type="text"
                  name="city"
                  value={formValues.city}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-300"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">State</span>
                <input
                  type="text"
                  name="state"
                  value={formValues.state}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-300"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">PIN Code</span>
                <input
                  type="text"
                  name="pinCode"
                  value={formValues.pinCode}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-300"
                />
              </label>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting
                ? 'Saving...'
                : mode === 'create'
                  ? 'Create Partner'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PartnerForm
