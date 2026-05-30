const LoadingAnimation = ({ 
  variant = 'default',
  message = 'Loading...',
  fullScreen = false 
}) => {
  const baseClasses = fullScreen 
    ? 'fixed inset-0 z-50' 
    : 'w-full min-h-[280px]';

  const variants = {
    default: (
      <div className={`${baseClasses} flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100`}>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
              {/* Middle rotating ring - slower */}
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-500 border-l-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              {/* Inner pulse */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-700 font-medium text-lg">{message}</p>
          <div className="flex gap-1 justify-center mt-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    ),
    minimal: (
      <div className={`${baseClasses} flex items-center justify-center bg-white/50`}>
        <div className="text-center">
          <div className="inline-flex">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 text-sm mt-3">{message}</p>
        </div>
      </div>
    ),
    skeleton: (
      <div className={`${baseClasses} space-y-4 p-4`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-5/6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-4/6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    ),
    dots: (
      <div className={`${baseClasses} flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50`}>
        <div className="text-center">
          <div className="flex gap-2 justify-center mb-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  opacity: 1 - (i * 0.15)
                }}
              ></div>
            ))}
          </div>
          <p className="text-gray-700 font-medium">{message}</p>
        </div>
      </div>
    ),
    gradient: (
      <div className={`${baseClasses} flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`}>
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-spin"></div>
            <div className="absolute inset-1 bg-slate-900 rounded-full flex items-center justify-center">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">✨</div>
            </div>
          </div>
          <p className="text-white font-medium text-lg">{message}</p>
        </div>
      </div>
    ),
  };

  return variants[variant] || variants.default;
};

export default LoadingAnimation;
