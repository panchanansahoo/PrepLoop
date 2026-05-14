import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Settings, X, CheckCircle, AlertCircle, Loader2, Video, Volume2, Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function SetupInterviewModal({ isOpen, onClose, onStart, config }) {
  const [permissions, setPermissions] = useState({ camera: false, mic: false });
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    if (isOpen) {
      checkPermissions();
    } else {
      stopStream();
    }
    return () => stopStream();
  }, [isOpen]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const checkPermissions = async () => {
    setChecking(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermissions({ camera: true, mic: true });
    } catch (err) {
      console.error("Permission error:", err);
      setError("Please allow camera and microphone access to continue.");
      setPermissions({ camera: false, mic: false });
    } finally {
      setChecking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`relative w-full max-w-2xl ${isLight ? 'bg-white' : 'bg-[#0a0a0c]'} border ${isLight ? 'border-gray-200' : 'border-white/10'} rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 ${isLight ? '' : 'ring-1 ring-white/5'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isLight ? 'border-gray-200 bg-gray-50/50' : 'border-white/5 bg-white/[0.02]'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 border ${isLight ? 'border-indigo-100' : 'border-white/10'} shadow-[0_0_15px_rgba(99,102,241,0.1)]`}>
              <Settings size={22} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} tracking-tight`}>System Check</h2>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Configure your environment before starting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2.5 ${isLight ? 'text-gray-400 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-500 hover:text-white hover:bg-white/10'} rounded-full transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Video Preview */}
          <div className="space-y-4">
            <div className={`relative aspect-video rounded-2xl overflow-hidden bg-black border ${isLight ? 'border-gray-200' : 'border-white/10'} shadow-inner group ${isLight ? '' : 'ring-1 ring-white/5'}`}>
              {permissions.camera ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-white/5">
                  <Camera size={48} className="mb-3 opacity-20" />
                  <span className="text-sm font-medium">Camera preview unavailable</span>
                </div>
              )}

              {/* Status Overlay */}
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 text-xs font-bold text-white backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-lg">
                <div className={`w-2 h-2 rounded-full ${permissions.camera ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`} />
                {permissions.camera ? 'Signal Active' : 'No Signal'}
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={checkPermissions}
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1.5 transition-colors font-medium"
              >
                <Settings size={12} /> Check permissions again
              </button>
            </div>
          </div>

          {/* Checklist & Config */}
          <div className="space-y-6 flex flex-col justify-center">
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${permissions.camera
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-rose-500/5 border-rose-500/20'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${permissions.camera ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                    <Video size={18} />
                  </div>
                  <span className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-200'}`}>Camera Access</span>
                </div>
                {checking ? <Loader2 size={18} className="animate-spin text-indigo-400" /> : (
                  permissions.camera ? <CheckCircle size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-rose-400" />
                )}
              </div>

              <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${permissions.mic
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-rose-500/5 border-rose-500/20'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${permissions.mic ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                    <Volume2 size={18} />
                  </div>
                  <span className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-200'}`}>Microphone Input</span>
                </div>
                {checking ? <Loader2 size={18} className="animate-spin text-indigo-400" /> : (
                  permissions.mic ? <CheckCircle size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-rose-400" />
                )}
              </div>
            </div>

            <div className={`pt-6 border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
              <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Shield size={12} />
                Session Configuration
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3.5 rounded-xl ${isLight ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100' : 'bg-white/5 border border-white/5 hover:bg-white/10'} transition-colors group`}>
                  <span className="text-xs text-gray-500 block mb-1.5 group-hover:text-gray-400 transition-colors">Interview Type</span>
                  <span className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'} capitalize flex items-center gap-2`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config?.type === 'technical' ? 'bg-blue-500' :
                        config?.type === 'system-design' ? 'bg-purple-500' :
                          'bg-emerald-500'
                      }`}></span>
                    {config?.type || 'Technical'}
                  </span>
                </div>
                <div className={`p-3.5 rounded-xl ${isLight ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100' : 'bg-white/5 border border-white/5 hover:bg-white/10'} transition-colors group`}>
                  <span className="text-xs text-gray-500 block mb-1.5 group-hover:text-gray-400 transition-colors">Difficulty</span>
                  <span className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'} capitalize flex items-center gap-2`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config?.difficulty === 'easy' ? 'bg-emerald-400' :
                        config?.difficulty === 'medium' ? 'bg-amber-400' :
                          'bg-rose-400'
                      }`}></span>
                    {config?.difficulty || 'Medium'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${isLight ? 'border-gray-200 bg-gray-50/50' : 'border-white/5 bg-white/[0.02]'} flex justify-end gap-3 rounded-b-3xl`}>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-xl font-medium ${isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-white/5'} transition-all duration-200`}
          >
            Cancel
          </button>
          <button
            onClick={onStart}
            disabled={!permissions.camera || !permissions.mic}
            className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 flex items-center gap-2.5"
          >
            Start Session <CheckCircle size={18} />
          </button>
        </div>

        {error && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 px-4 py-3 bg-rose-500/90 text-white text-sm font-medium rounded-xl shadow-xl animate-in slide-in-from-bottom-4 flex items-center gap-2.5 backdrop-blur-md border border-white/10">
            <AlertCircle size={18} /> {error}
          </div>
        )}
      </div>
    </div>
  );
}
