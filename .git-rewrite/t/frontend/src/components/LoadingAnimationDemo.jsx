import React, { useState } from 'react';
import LoadingAnimation from '../LoadingAnimation';

/**
 * LoadingAnimationDemo Component
 * Showcases all available loading animation variants
 */
const LoadingAnimationDemo = () => {
  const [selectedVariant, setSelectedVariant] = useState('default');

  const variants = [
    {
      id: 'default',
      name: 'Default',
      description: 'Multi-ring rotating animation with pulsing center',
      icon: '🎯'
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Simple single ring spinner',
      icon: '⚙️'
    },
    {
      id: 'skeleton',
      name: 'Skeleton',
      description: 'Skeleton loading with shimmer effect',
      icon: '📋'
    },
    {
      id: 'dots',
      name: 'Dots',
      description: 'Animated dot particles',
      icon: '💫'
    },
    {
      id: 'gradient',
      name: 'Gradient',
      description: 'Premium gradient spinner with dark theme',
      icon: '✨'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Loading Animation Variants
          </h1>
          <p className="text-lg text-gray-600">
            Explore 5 beautiful loading animations for your dashboard
          </p>
        </div>

        {/* Variant Selector */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Select a Variant
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant.id)}
                className={`p-4 rounded-lg border-2 transition ${
                  selectedVariant === variant.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">{variant.icon}</div>
                <h3 className="font-semibold text-gray-900">{variant.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{variant.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Live Preview</h2>
            <p className="text-gray-600 text-sm mt-1">
              {variants.find(v => v.id === selectedVariant)?.description}
            </p>
          </div>
          <div className="aspect-video bg-gray-50 flex items-center justify-center">
            <LoadingAnimation
              variant={selectedVariant}
              message={`Loading ${variants.find(v => v.id === selectedVariant)?.name}...`}
            />
          </div>
        </div>

        {/* Usage Guide */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          {/* Basic Usage */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📖 Basic Usage
            </h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`import LoadingAnimation from '@/components/LoadingAnimation';

export default function MyComponent() {
  return (
    <LoadingAnimation 
      variant="default"
      message="Loading..."
    />
  );
}`}
            </pre>
          </div>

          {/* Props Reference */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ⚡ Props Reference
            </h3>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-900">variant</p>
                <p className="text-sm text-gray-600">
                  'default' | 'minimal' | 'skeleton' | 'dots' | 'gradient'
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">message</p>
                <p className="text-sm text-gray-600">
                  String to display below animation
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">fullScreen</p>
                <p className="text-sm text-gray-600">
                  Boolean - fill entire viewport if true
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Examples */}
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          {/* Dashboard Loading */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="font-bold text-gray-900 mb-3">🏗️ Dashboard Load</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs text-gray-700 overflow-x-auto">
{`{isLoading ? (
  <LoadingAnimation
    variant="default"
    message="Loading dashboard..."
  />
) : (
  <Dashboard />
)}`}
            </pre>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="font-bold text-gray-900 mb-3">📑 Tab Switch</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs text-gray-700 overflow-x-auto">
{`const [loading, setLoading] = useState(false);

const switchTab = (tab) => {
  setLoading(true);
  setTimeout(() => {
    setActiveTab(tab);
    setLoading(false);
  }, 600);
};`}
            </pre>
          </div>

          {/* Data Fetching */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="font-bold text-gray-900 mb-3">🔄 Data Fetch</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs text-gray-700 overflow-x-auto">
{`const [data, setData] = useState(null);

useEffect(() => {
  const load = async () => {
    const res = await fetch(url);
    setData(await res.json());
  };
  load();
}, []);

return data ? <Content /> : <Loading />;`}
            </pre>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">✨ Features</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
              <h4 className="font-bold text-gray-900 mb-2">🎨 Beautiful Designs</h4>
              <p className="text-gray-700">
                5 carefully crafted loading animations with smooth transitions and professional aesthetics.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
              <h4 className="font-bold text-gray-900 mb-2">⚡ Performance</h4>
              <p className="text-gray-700">
                CSS-based animations with no JavaScript overhead, optimized for smooth 60fps rendering.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <h4 className="font-bold text-gray-900 mb-2">🎯 Customizable</h4>
              <p className="text-gray-700">
                Easy to customize with props. Adjust messages, variants, and styling to match your brand.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
              <h4 className="font-bold text-gray-900 mb-2">📦 Lightweight</h4>
              <p className="text-gray-700">
                Single component file with no external dependencies. Just copy and use in your project.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimationDemo;
