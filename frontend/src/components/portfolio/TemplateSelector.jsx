import React from 'react';

const templateOptions = [
  {
    id: 'minimal',
    title: 'Minimal Professional',
    description: 'Clean and recruiter-friendly layout with strong readability.',
  },
  {
    id: 'dark',
    title: 'Developer Dark',
    description: 'Code-inspired dark style that highlights projects and stack.',
  },
  {
    id: 'creative',
    title: 'Creative Modern',
    description: 'Bolder visuals with cards and stronger personal branding.',
  },
  {
    id: 'fresher',
    title: 'Fresher Starter',
    description: 'Experience-light layout focused on skills and projects.',
  },
];

export default function TemplateSelector({ settings, setSettings, onBack, onNext }) {
  return (
    <section className="portfolio-step-card">
      <h2>Choose template and branding</h2>

      <div className="portfolio-template-grid">
        {templateOptions.map((option) => {
          const active = settings.template === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className={`portfolio-template-card${active ? ' active' : ''}`}
              onClick={() => setSettings((prev) => ({ ...prev, template: option.id }))}
            >
              <strong>{option.title}</strong>
              <p>{option.description}</p>
            </button>
          );
        })}
      </div>

      <div className="portfolio-row">
        <div>
          <label className="portfolio-label" htmlFor="primaryColor">Primary color</label>
          <input
            id="primaryColor"
            type="color"
            className="portfolio-color-input"
            value={settings.theme.primaryColor}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                theme: { ...prev.theme, primaryColor: event.target.value },
              }))
            }
          />
        </div>

        <div>
          <label className="portfolio-label" htmlFor="accentColor">Accent color</label>
          <input
            id="accentColor"
            type="color"
            className="portfolio-color-input"
            value={settings.theme.accentColor}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                theme: { ...prev.theme, accentColor: event.target.value },
              }))
            }
          />
        </div>
      </div>

      <label className="portfolio-label" htmlFor="fontFamily">Font family</label>
      <select
        id="fontFamily"
        className="portfolio-input"
        value={settings.theme.fontFamily}
        onChange={(event) =>
          setSettings((prev) => ({
            ...prev,
            theme: { ...prev.theme, fontFamily: event.target.value },
          }))
        }
      >
        <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">Segoe UI</option>
        <option value="'Poppins', sans-serif">Poppins</option>
        <option value="'Merriweather', serif">Merriweather</option>
        <option value="'Fira Sans', sans-serif">Fira Sans</option>
      </select>

      <div className="portfolio-actions">
        <button type="button" className="portfolio-secondary-btn" onClick={onBack}>Back</button>
        <button type="button" className="portfolio-primary-btn" onClick={onNext}>Continue to publish</button>
      </div>
    </section>
  );
}
