import { useEffect, useMemo, useState, useRef } from 'react'
import { ChevronDown, Filter, Plus, X } from 'lucide-react'

const getFieldLabel = (field = {}) => {
  if (field?.label) return field.label
  if (field?.placeholder) {
    return field.placeholder.replace(/^Filter by\s*/i, '').trim()
  }
  return field?.key || 'Filter'
}

const normalizeOptions = (options = []) =>
  options.map((option) =>
    typeof option === 'object'
      ? {
          value: option.value ?? option.key ?? option.id ?? '',
          label: option.label ?? option.name ?? option.title ?? String(option.value ?? ''),
        }
      : { value: option, label: String(option) },
  )

function MasterFilter({
  fields = [],
  values = {},
  loading = false,
  enableFieldPicker = true,
  fieldPickerLabel = 'Add filter',
  initialActiveFieldKeys = [],
  applyLabel = 'Apply',
  onChange,
  onApply,
  onReset,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingFieldKey, setPendingFieldKey] = useState('')
  const dropdownRef = useRef(null)

  const normalizedFields = useMemo(
    () =>
      fields
        .filter((field) => field && field.key && !field.hidden)
        .map((field) => ({
          type: 'text',
          ...field,
          label: getFieldLabel(field),
          options: normalizeOptions(field.options || []),
        })),
    [fields],
  )

  const defaultActiveFieldKeys = useMemo(() => {
    const filledKeys = normalizedFields
      .filter((field) => String(values?.[field.key] ?? '').trim() !== '')
      .map((field) => field.key)

    const requestedKeys = initialActiveFieldKeys.filter((key) =>
      normalizedFields.some((field) => field.key === key),
    )

    const merged = [...requestedKeys, ...filledKeys]
    return Array.from(new Set(merged))
  }, [initialActiveFieldKeys, normalizedFields, values])
  // Create a lightweight signature of values for stable dependency tracking.
  // This prevents unnecessary recomputations when the `values` object reference changes
  // but the actual field values remain the same.
  const valuesSignature = useMemo(() => {
    return normalizedFields.map((f) => String(values?.[f.key] ?? '')).join('|')
  }, [normalizedFields, values])

  const [activeFieldKeys, setActiveFieldKeys] = useState(defaultActiveFieldKeys)

  useEffect(() => {
    setActiveFieldKeys((current) => {
      const merged = Array.from(
        new Set(
          [...current, ...defaultActiveFieldKeys].filter((key) =>
            normalizedFields.some((field) => field.key === key),
          ),
        ),
      )

      // Avoid updating state if merged keys are identical to current keys
      if (current.length === merged.length) {
        const curSet = new Set(current)
        const same = merged.every((k) => curSet.has(k))
        if (same) return current
      }

      return merged
    })
    // Note: include valuesSignature instead of raw `values` to avoid loops
  }, [defaultActiveFieldKeys, normalizedFields, valuesSignature])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const visibleFields = useMemo(() => {
    if (!enableFieldPicker) return normalizedFields
    return normalizedFields.filter((field) => activeFieldKeys.includes(field.key))
  }, [activeFieldKeys, enableFieldPicker, normalizedFields])

  const availableFields = useMemo(
    () => normalizedFields.filter((field) => !activeFieldKeys.includes(field.key)),
    [activeFieldKeys, normalizedFields],
  )

  const activeFilterCount = useMemo(() => {
    return normalizedFields.filter((field) => String(values?.[field.key] ?? '').trim() !== '').length
  }, [normalizedFields, values])

  const handleAddField = () => {
    if (!pendingFieldKey) return
    setActiveFieldKeys((current) => Array.from(new Set([...current, pendingFieldKey])))
    setPendingFieldKey('')
  }

  const handleRemoveField = (key) => {
    setActiveFieldKeys((current) => current.filter((item) => item !== key))
    onChange?.(key, '')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onApply?.()
    setIsOpen(false)
  }

  const handleReset = () => {
    setPendingFieldKey('')
    setActiveFieldKeys([])
    onReset?.()
  }

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
          isOpen || activeFilterCount > 0
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Filter size={15} className={isOpen || activeFilterCount > 0 ? 'text-blue-600' : 'text-slate-500'} />
        Filters
        {activeFilterCount > 0 && (
          <span className="flex h-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          title="Clear all filters"
        >
          <X size={15} />
        </button>
      )}

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Active Filters</span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
              {visibleFields.length === 0 ? (
                <p className="text-sm text-slate-400">No active filters.</p>
              ) : (
                visibleFields.map((field) => {
                  const currentValue = values?.[field.key] ?? ''

                  return (
                    <div key={field.key} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-700">
                          {field.label}
                        </label>
                        {enableFieldPicker && (
                          <button
                            type="button"
                            onClick={() => handleRemoveField(field.key)}
                            className="text-slate-400 transition hover:text-red-500"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {field.type === 'select' ? (
                        <div className="relative">
                          <select
                            value={currentValue}
                            onChange={(event) => onChange?.(field.key, event.target.value)}
                            className="w-full appearance-none rounded-md border border-slate-300 bg-white px-2.5 py-1.5 pr-8 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">{field.emptyOptionLabel || `Any ${field.label}`}</option>
                            {field.options.map((option) => (
                              <option key={`${field.key}-${option.value}`} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          value={currentValue}
                          onChange={(event) => onChange?.(field.key, event.target.value)}
                          placeholder={field.placeholder || `Enter ${field.label}...`}
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {enableFieldPicker && availableFields.length > 0 && (
              <div className="mt-1 flex items-center gap-2 border-t border-slate-100 pt-3">
                <div className="relative flex-1">
                  <select
                    value={pendingFieldKey}
                    onChange={(event) => setPendingFieldKey(event.target.value)}
                    className="w-full appearance-none rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 pr-8 text-sm text-slate-600 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">{fieldPickerLabel}</option>
                    {availableFields.map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddField}
                  disabled={!pendingFieldKey}
                  className="inline-flex h-8 items-center justify-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  <Plus size={15} />
                </button>
              </div>
            )}

            <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-md border border-slate-200 bg-white py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-blue-600 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70"
              >
                {loading ? '...' : applyLabel}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default MasterFilter