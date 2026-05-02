import React, { useState, useEffect } from 'react';
import { useVoicePersona } from '../../hooks/useVoicePersona';
import './VoiceSettings.css';

/**
 * VoiceSettings Component
 * Allows users to customize voice persona, accent, gender, and emotion
 * for the AI interview system.
 */
export function VoiceSettings({ interviewType = 'general', difficulty = 'medium', onClose = null }) {
    const {
        currentPersona,
        currentAccent,
        currentGender,
        currentEmotion,
        changePersona,
        changeAccent,
        changeGender,
        changeEmotion,
        playPreview,
        savePreferences,
        getRecommendedPersonas,
        getSummary
    } = useVoicePersona();

    const [previewText, setPreviewText] = useState('Hello! I am your AI interview assistant. Let\'s get started.');
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const [previewError, setPreviewError] = useState(null);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [savedMessage, setSavedMessage] = useState(null);

    // Recommended personas based on interview type
    const recommendedPersonas = getRecommendedPersonas ? getRecommendedPersonas(interviewType, difficulty) : [];

    const voiceSummary = getSummary ? getSummary() : {};

    /**
     * Handle preview button click
     */
    const handlePlayPreview = async () => {
        setIsPreviewPlaying(true);
        setPreviewError(null);

        try {
            const success = await playPreview(previewText, currentPersona, currentAccent, currentGender);
            if (!success) {
                setPreviewError('Failed to generate preview. Please try again.');
            }
        } catch (error) {
            console.error('Preview error:', error);
            setPreviewError(error.message || 'Error generating preview');
        } finally {
            setIsPreviewPlaying(false);
        }
    };

    /**
     * Handle persona change
     */
    const handlePersonaChange = (newPersona) => {
        changePersona(newPersona);
        setShowRecommendations(false);
    };

    /**
     * Handle accent change
     */
    const handleAccentChange = (newAccent) => {
        changeAccent(newAccent);
    };

    /**
     * Handle gender change
     */
    const handleGenderChange = (newGender) => {
        changeGender(newGender);
    };

    /**
     * Handle emotion change
     */
    const handleEmotionChange = (newEmotion) => {
        changeEmotion(newEmotion);
    };

    /**
     * Handle save preferences
     */
    const handleSavePreferences = async () => {
        try {
            await savePreferences();
            setSavedMessage('Preferences saved successfully!');
            setTimeout(() => setSavedMessage(null), 3000);
        } catch (error) {
            console.error('Save error:', error);
            setPreviewError('Failed to save preferences');
        }
    };

    /**
     * Apply recommended persona
     */
    const applyRecommendation = (persona) => {
        handlePersonaChange(persona.name);
        // Auto-select recommended accent if available
        if (persona.suggested_accent && persona.suggested_accent !== currentAccent) {
            handleAccentChange(persona.suggested_accent);
        }
    };

    return (
        <div className="voice-settings-container">
            <div className="voice-settings-header">
                <h2>🎙️ Voice Settings</h2>
                {onClose && (
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                )}
            </div>

            {/* Messages */}
            {savedMessage && <div className="success-message">{savedMessage}</div>}
            {previewError && <div className="error-message">{previewError}</div>}

            {/* Persona Selection */}
            <div className="voice-settings-section">
                <label htmlFor="persona-select">
                    <strong>Voice Persona</strong>
                    <span className="help-text">Choose the personality and style of your AI interviewer</span>
                </label>
                <select
                    id="persona-select"
                    value={currentPersona}
                    onChange={(e) => handlePersonaChange(e.target.value)}
                    className="voice-select"
                >
                    <optgroup label="Professional">
                        <option value="professional_neutral">Professional Neutral</option>
                        <option value="professional_assertive">Professional Assertive</option>
                    </optgroup>
                    <optgroup label="Conversational">
                        <option value="conversational_friendly">Conversational Friendly</option>
                        <option value="conversational_curious">Conversational Curious</option>
                    </optgroup>
                    <optgroup label="Analytical">
                        <option value="analytical_precise">Analytical Precise</option>
                        <option value="analytical_inquisitive">Analytical Inquisitive</option>
                    </optgroup>
                    <optgroup label="Supportive">
                        <option value="calm_supportive">Calm Supportive</option>
                        <option value="calm_empathetic">Calm Empathetic</option>
                    </optgroup>
                    <optgroup label="Energetic">
                        <option value="energetic_enthusiastic">Energetic Enthusiastic</option>
                        <option value="energetic_driven">Energetic Driven</option>
                    </optgroup>
                    <optgroup label="Industry-Specific">
                        <option value="mentor_guide">Mentor Guide</option>
                        <option value="recruiter_hr">Recruiter HR</option>
                        <option value="startup_founder">Startup Founder</option>
                        <option value="technical_lead">Technical Lead</option>
                    </optgroup>
                    <optgroup label="Default">
                        <option value="default_neutral">Default Neutral</option>
                    </optgroup>
                </select>

                {/* Recommendations Button */}
                <button
                    className="recommendations-btn"
                    onClick={() => setShowRecommendations(!showRecommendations)}
                >
                    💡 Recommendations
                </button>

                {/* Recommendations Panel */}
                {showRecommendations && recommendedPersonas.length > 0 && (
                    <div className="recommendations-panel">
                        <strong>Recommended for {interviewType} ({difficulty} difficulty):</strong>
                        <div className="recommendations-list">
                            {recommendedPersonas.map((persona) => (
                                <button
                                    key={persona.name}
                                    className={`recommendation-btn ${persona.name === currentPersona ? 'active' : ''}`}
                                    onClick={() => applyRecommendation(persona)}
                                >
                                    <span className="persona-name">{persona.label}</span>
                                    <span className="persona-reason">{persona.reason}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Accent Selection */}
            <div className="voice-settings-section">
                <label htmlFor="accent-select">
                    <strong>Accent</strong>
                    <span className="help-text">Choose the accent and language variation</span>
                </label>
                <select
                    id="accent-select"
                    value={currentAccent}
                    onChange={(e) => handleAccentChange(e.target.value)}
                    className="voice-select"
                >
                    <option value="neutral">Neutral</option>
                    <option value="american">American</option>
                    <option value="british">British</option>
                    <option value="indian">Indian</option>
                    <option value="australian">Australian</option>
                    <option value="canadian">Canadian</option>
                </select>
            </div>

            {/* Gender Selection */}
            <div className="voice-settings-section">
                <label>
                    <strong>Gender</strong>
                    <span className="help-text">Select voice gender</span>
                </label>
                <div className="radio-group">
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={currentGender === 'male'}
                            onChange={(e) => handleGenderChange(e.target.value)}
                        />
                        Male
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={currentGender === 'female'}
                            onChange={(e) => handleGenderChange(e.target.value)}
                        />
                        Female
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value="neutral"
                            checked={currentGender === 'neutral'}
                            onChange={(e) => handleGenderChange(e.target.value)}
                        />
                        Neutral
                    </label>
                </div>
            </div>

            {/* Emotion Selection */}
            <div className="voice-settings-section">
                <label htmlFor="emotion-select">
                    <strong>Emotion Tone</strong>
                    <span className="help-text">Choose how the interviewer sounds</span>
                </label>
                <select
                    id="emotion-select"
                    value={currentEmotion}
                    onChange={(e) => handleEmotionChange(e.target.value)}
                    className="voice-select"
                >
                    <option value="neutral">Neutral</option>
                    <option value="encouraging">Encouraging</option>
                    <option value="challenging">Challenging</option>
                    <option value="supportive">Supportive</option>
                </select>
            </div>

            {/* Preview Section */}
            <div className="voice-settings-section preview-section">
                <label htmlFor="preview-text">
                    <strong>Voice Preview</strong>
                    <span className="help-text">Hear how your chosen voice sounds</span>
                </label>
                <textarea
                    id="preview-text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Enter text to preview..."
                    className="preview-textarea"
                    maxLength="200"
                />
                <div className="preview-controls">
                    <button
                        className="play-btn"
                        onClick={handlePlayPreview}
                        disabled={isPreviewPlaying}
                        title="Preview the voice with current settings"
                    >
                        {isPreviewPlaying ? '🔊 Playing...' : '▶️ Play Preview'}
                    </button>
                    <span className="char-count">
                        {previewText.length} / 200 characters
                    </span>
                </div>
            </div>

            {/* Summary Information */}
            {voiceSummary && (
                <div className="voice-settings-section info-section">
                    <div className="info-row">
                        <span className="info-label">Current Persona:</span>
                        <span className="info-value">{currentPersona}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Accent:</span>
                        <span className="info-value">{currentAccent}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Gender:</span>
                        <span className="info-value">{currentGender}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Emotion:</span>
                        <span className="info-value">{currentEmotion}</span>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="voice-settings-footer">
                <button className="save-btn" onClick={handleSavePreferences}>
                    💾 Save Preferences
                </button>
                {onClose && (
                    <button className="cancel-btn" onClick={onClose}>
                        Close
                    </button>
                )}
            </div>
        </div>
    );
}

export default VoiceSettings;
