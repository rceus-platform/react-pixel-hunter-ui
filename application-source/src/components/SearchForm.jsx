import styles from './SearchForm.module.css';

const ENGINES = [
  { key: 'all', label: 'All', icon: 'A' },
  { key: 'bing', label: 'Bing', icon: 'B' },
  { key: 'google', label: 'Google', icon: 'G' },
  { key: 'duckduckgo', label: 'DuckDuckGo', icon: 'D' },
  { key: 'baidu', label: 'Baidu', icon: 'Bd' },
  { key: 'yandex', label: 'Yandex', icon: 'Y' }
];

const OrientationOptions = [
  { value: 'any', label: 'Any' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' }
];

export default function SearchForm({ form, setForm, onSubmit, onStop, onReset, disabled }) {
  const handleInput = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEngineChange = (engine, checked) => {
    setForm((prev) => {
      if (engine === 'all') {
        return { ...prev, engines: checked ? ['all'] : [] };
      }

      const withoutAll = prev.engines.filter((item) => item !== 'all');
      const nextEngines = checked
        ? Array.from(new Set([...withoutAll, engine]))
        : withoutAll.filter((item) => item !== engine);

      return {
        ...prev,
        engines: nextEngines
      };
    });
  };

  const submitForm = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className={styles.form} onSubmit={submitForm}>
      <div className={styles.fieldGroupWide}>
        <label htmlFor="query">Search Query</label>
        <input
          id="query"
          name="query"
          type="text"
          value={form.query}
          onChange={handleInput}
          placeholder="e.g. cyberpunk city 4k wallpaper"
          required
          autoComplete="off"
        />
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Search Engines</legend>
        <div className={styles.engineGrid}>
          {ENGINES.map((engine) => (
            <label key={engine.key} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={form.engines.includes(engine.key)}
                onChange={(event) => handleEngineChange(engine.key, event.target.checked)}
              />
              <span className={styles.engineIcon} aria-hidden="true">
                {engine.icon}
              </span>
              <span>{engine.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.quickFilters}>
        <div className={styles.fieldGroup}>
          <label htmlFor="min_width">Min Width</label>
          <input
            id="min_width"
            name="min_width"
            type="number"
            min="1"
            value={form.min_width}
            onChange={handleInput}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="min_height">Min Height</label>
          <input
            id="min_height"
            name="min_height"
            type="number"
            min="1"
            value={form.min_height}
            onChange={handleInput}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="orientation">Orientation</label>
          <select
            id="orientation"
            name="orientation"
            value={form.orientation}
            onChange={handleInput}
          >
            {OrientationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="pages">Pages (0 = all, max 50)</label>
          <input
            id="pages"
            name="pages"
            type="number"
            min="0"
            max="50"
            value={form.pages}
            onChange={handleInput}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="limit">Limit (0 = all, max 200)</label>
          <input
            id="limit"
            name="limit"
            type="number"
            min="0"
            max="200"
            value={form.limit}
            onChange={handleInput}
          />
        </div>
      </div>

      <div className={styles.toggleRow}>
        <label className={styles.checkboxItem}>
          <input
            type="checkbox"
            name="four_k_only"
            checked={form.four_k_only}
            onChange={handleInput}
          />
          <span>4K only</span>
        </label>

        <label className={styles.checkboxItem}>
          <input
            type="checkbox"
            name="remove_duplicates"
            checked={form.remove_duplicates}
            onChange={handleInput}
          />
          <span>Remove duplicates</span>
        </label>

        <label className={styles.checkboxItem}>
          <input
            type="checkbox"
            name="allow_unverified"
            checked={form.allow_unverified}
            onChange={handleInput}
          />
          <span>Allow unverified</span>
        </label>

      </div>

      <div className={styles.actions}>
        {disabled ? (
          <button type="button" className={styles.stopButton} onClick={onStop}>
            Stop Searching
          </button>
        ) : (
          <button type="submit" className={styles.submitButton}>
            Search Images
          </button>
        )}
        <button type="button" className={styles.resetButton} onClick={onReset}>
          Reset
        </button>
      </div>
    </form>
  );
}
