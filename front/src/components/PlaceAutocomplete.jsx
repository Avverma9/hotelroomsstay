import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

const PlaceAutocomplete = ({
  value = '',
  onChange,
  placeholder,
  className = '',
  style,
  disabled = false,
  required = false,
  ...inputProps
}) => {
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const query = String(value).trim();
    if (!focused || disabled || selected || !query) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Photon returned ${response.status}`);
        const data = await response.json();
        const places = (Array.isArray(data.features) ? data.features : [])
          .map(({ properties = {}, geometry }, index) => {
            const street = [properties.street, properties.housenumber].filter(Boolean).join(' ');
            const parts = [
              properties.name,
              street && street !== properties.name ? street : '',
              properties.city || properties.district,
              properties.state,
              properties.postcode,
              properties.country,
            ].filter(Boolean);
            return {
              id: `${geometry?.coordinates?.join(',') || 'place'}-${index}`,
              label: [...new Set(parts)].join(', '),
            };
          })
          .filter((place) => place.label);
        setSuggestions(places);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setError('Place suggestions are unavailable. Check your connection and try again.');
          console.error('Place lookup failed:', requestError);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [disabled, focused, selected, value]);

  const choosePlace = (place) => {
    onChange({ target: { value: place.label } });
    setSelected(true);
    setSuggestions([]);
    setFocused(false);
    setError('');
  };

  return (
    <div className="relative w-full">
      <input
        {...inputProps}
        type="text"
        value={value}
        onChange={(event) => {
          setSelected(false);
          setSuggestions([]);
          setError('');
          onChange(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
        placeholder={placeholder}
        className={className}
        style={style}
        disabled={disabled}
        required={required}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={focused && !selected && String(value).trim().length > 0}
      />
      {focused && !selected && String(value).trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {loading ? (
            <p className="px-3 py-3 text-sm text-slate-500">Searching places…</p>
          ) : error ? (
            <p role="status" className="px-3 py-3 text-sm text-rose-600">{error}</p>
          ) : suggestions.length ? (
            <>
              {suggestions.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  role="option"
                  className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-700 last:border-0 hover:bg-slate-50"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choosePlace(place)}
                >
                  <MapPin size={16} className="shrink-0 text-blue-600" />
                  <span>{place.label}</span>
                </button>
              ))}
              <p className="px-3 py-1.5 text-[10px] text-slate-400">OpenStreetMap contributors · Photon</p>
            </>
          ) : (
            <p className="px-3 py-3 text-sm text-slate-500">No matching places found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaceAutocomplete;
