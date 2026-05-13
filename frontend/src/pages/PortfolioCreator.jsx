import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import ImportStep from '../components/portfolio/ImportStep';
import ReviewStep from '../components/portfolio/ReviewStep';
import TemplateSelector from '../components/portfolio/TemplateSelector';
import PublishStep from '../components/portfolio/PublishStep';
import {
  createPortfolioSite,
  importPortfolioProfile,
  updatePortfolioProfile,
} from '../api/portfolioService';
import './PortfolioCreator.css';

const steps = ['Import', 'Review', 'Template', 'Publish'];

const defaultForm = {
  resumeText: '',
  resumeFileName: '',
  githubUsername: '',
  linkedinUrl: '',
  linkedinHeadline: '',
  linkedinSummary: '',
};

const defaultSettings = {
  template: 'minimal',
  theme: {
    primaryColor: '#0c4a6e',
    accentColor: '#0284c7',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  slug: '',
  visibility: 'public',
};

export default function PortfolioCreator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);

  const [loadingImport, setLoadingImport] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [error, setError] = useState('');
  const [publishResult, setPublishResult] = useState(null);

  const progress = useMemo(() => Math.round(((currentStep + 1) / steps.length) * 100), [currentStep]);

  const handleImport = async () => {
    if (!form.resumeText.trim() && !form.githubUsername.trim() && !form.linkedinUrl.trim()) {
      setError('Please add at least one source: resume text, GitHub username, or LinkedIn URL.');
      return;
    }

    setError('');
    setLoadingImport(true);
    setPublishResult(null);

    try {
      const payload = {
        resumeText: form.resumeText,
        resumeMeta: { fileName: form.resumeFileName || null },
        githubUsername: form.githubUsername || null,
        linkedin: {
          url: form.linkedinUrl || null,
          headline: form.linkedinHeadline || null,
          summary: form.linkedinSummary || null,
        },
      };

      const imported = await importPortfolioProfile(payload);
      setProfile(imported);

      const fallbackSlug = (imported?.basicInfo?.fullName || 'portfolio')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60);

      setSettings((prev) => ({ ...prev, slug: prev.slug || fallbackSlug || 'portfolio' }));
      setCurrentStep(1);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to import portfolio profile.');
    } finally {
      setLoadingImport(false);
    }
  };

  const handleSaveReview = async () => {
    if (!profile?.id) return;

    setError('');
    setSavingReview(true);

    try {
      const updated = await updatePortfolioProfile(profile.id, {
        basicInfo: profile.basicInfo,
        socials: profile.socials,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education,
        projects: profile.projects,
        achievements: profile.achievements,
      });

      setProfile(updated);
      setCurrentStep(2);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to save profile updates.');
    } finally {
      setSavingReview(false);
    }
  };

  const handlePublish = async () => {
    if (!profile?.id) return;

    setError('');
    setPublishing(true);

    try {
      const published = await createPortfolioSite({
        profileId: profile.id,
        slug: settings.slug,
        template: settings.template,
        theme: settings.theme,
        visibility: settings.visibility,
      });

      setPublishResult(published);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to publish portfolio.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main className="portfolio-creator-page">
      <section className="portfolio-creator-shell">
        <header className="portfolio-creator-header">
          <Link to="/profile" className="portfolio-back-link">
            <ArrowLeft size={16} /> Back to profile
          </Link>
          <h1>Portfolio Generator</h1>
          <p>Connect your profile sources, review, and publish a shareable link.</p>
        </header>

        <section className="portfolio-progress-wrapper" aria-label="Portfolio wizard progress">
          <div className="portfolio-progress-track">
            <div className="portfolio-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <ol className="portfolio-step-indicator-list">
            {steps.map((step, index) => {
              const isDone = index < currentStep;
              const isActive = index === currentStep;
              return (
                <li key={step} className={`portfolio-step-indicator ${isActive ? 'active' : ''}`}>
                  {isDone ? <CheckCircle2 size={14} /> : <span>{index + 1}</span>}
                  <span>{step}</span>
                </li>
              );
            })}
          </ol>
        </section>

        {currentStep === 0 ? (
          <ImportStep
            form={form}
            setForm={setForm}
            loading={loadingImport}
            onImport={handleImport}
            error={error}
          />
        ) : null}

        {currentStep === 1 ? (
          <ReviewStep
            profile={profile}
            setProfile={setProfile}
            onBack={() => setCurrentStep(0)}
            onNext={handleSaveReview}
            saving={savingReview}
            error={error}
          />
        ) : null}

        {currentStep === 2 ? (
          <TemplateSelector
            settings={settings}
            setSettings={setSettings}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        ) : null}

        {currentStep === 3 ? (
          <PublishStep
            settings={settings}
            setSettings={setSettings}
            onBack={() => setCurrentStep(2)}
            onPublish={handlePublish}
            publishing={publishing}
            error={error}
            result={publishResult}
          />
        ) : null}
      </section>
    </main>
  );
}
