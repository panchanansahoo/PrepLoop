import {useState} from 'react';
import {
    ChevronDown,
    X,
    Filter,
    CheckCircle2,
    Circle,
    BarChart3,
} from 'lucide-react';
import './roadmap-filters.css';

export default function RoadmapFilters({
    _difficulties = [],
    selectedDifficulties = [],
    onDifficultyChange = () => {},
    completionStatuses = ['completed', 'in-progress', 'not-started'],
    selectedStatuses = [],
    onStatusChange = () => {},
    sortBy = 'default',
    onSortChange = () => {},
    onReset = () => {},
    onApply = () => {},
    isFiltered = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [localDifficulties, setLocalDifficulties] = useState(selectedDifficulties);
    const [localStatuses, setLocalStatuses] = useState(selectedStatuses);
    const [localSort, setLocalSort] = useState(sortBy);

    const handleDifficultyToggle = (difficulty) => {
        setLocalDifficulties((prev) =>
            prev.includes(difficulty)
                ? prev.filter((d) => d !== difficulty)
                : [...prev, difficulty]
        );
    };

    const handleStatusToggle = (status) => {
        setLocalStatuses((prev) =>
            prev.includes(status)
                ? prev.filter((s) => s !== status)
                : [...prev, status]
        );
    };

    const handleApply = () => {
        onDifficultyChange(localDifficulties);
        onStatusChange(localStatuses);
        onSortChange(localSort);
        onApply();
        setIsOpen(false);
    };

    const handleReset = () => {
        setLocalDifficulties([]);
        setLocalStatuses([]);
        setLocalSort('default');
        onReset();
    };

    const activeFiltersCount = localDifficulties.length + localStatuses.length;

    const statusIcons = {
        completed: <CheckCircle2 size={14} />,
        'in-progress': <BarChart3 size={14} />,
        'not-started': <Circle size={14} />,
    };

    const statusLabels = {
        completed: 'Completed',
        'in-progress': 'In Progress',
        'not-started': 'Not Started',
    };

    return (
        <div className="roadmap-filters-container">
            <button
                className={`roadmap-filters-button ${isOpen ? 'is-open' : ''} ${isFiltered ? 'has-active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle filters"
            >
                <Filter size={14} />
                <span>Filter</span>
                {activeFiltersCount > 0 && (
                    <span className="roadmap-filters-badge">{activeFiltersCount}</span>
                )}
                <ChevronDown size={13} className="roadmap-filters-chevron" />
            </button>

            {isOpen && (
                <div className="roadmap-filters-dropdown">
                    {/* Difficulty Filter */}
                    <div className="roadmap-filter-section">
                        <div className="roadmap-filter-header">
                            <span className="roadmap-filter-title">Difficulty</span>
                        </div>
                        <div className="roadmap-filter-options">
                            {['Easy', 'Medium', 'Hard'].map((difficulty) => (
                                <label key={difficulty} className="roadmap-filter-option">
                                    <input
                                        type="checkbox"
                                        checked={localDifficulties.includes(difficulty)}
                                        onChange={() => handleDifficultyToggle(difficulty)}
                                    />
                                    <span className="roadmap-filter-option-label">{difficulty}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="roadmap-filter-divider" />

                    {/* Status Filter */}
                    <div className="roadmap-filter-section">
                        <div className="roadmap-filter-header">
                            <span className="roadmap-filter-title">Status</span>
                        </div>
                        <div className="roadmap-filter-options">
                            {completionStatuses.map((status) => (
                                <label key={status} className="roadmap-filter-option">
                                    <input
                                        type="checkbox"
                                        checked={localStatuses.includes(status)}
                                        onChange={() => handleStatusToggle(status)}
                                    />
                                    <span className="roadmap-filter-option-icon">
                                        {statusIcons[status]}
                                    </span>
                                    <span className="roadmap-filter-option-label">
                                        {statusLabels[status]}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="roadmap-filter-divider" />

                    {/* Sort Option */}
                    <div className="roadmap-filter-section">
                        <div className="roadmap-filter-header">
                            <span className="roadmap-filter-title">Sort By</span>
                        </div>
                        <select
                            value={localSort}
                            onChange={(e) => setLocalSort(e.target.value)}
                            className="roadmap-filter-select"
                        >
                            <option value="default">Default (Roadmap order)</option>
                            <option value="difficulty-asc">Difficulty (Easy → Hard)</option>
                            <option value="difficulty-desc">Difficulty (Hard → Easy)</option>
                            <option value="progress-desc">Progress (Most → Least)</option>
                            <option value="progress-asc">Progress (Least → Most)</option>
                            <option value="name-asc">Name (A → Z)</option>
                            <option value="name-desc">Name (Z → A)</option>
                        </select>
                    </div>

                    <div className="roadmap-filter-divider" />

                    {/* Actions */}
                    <div className="roadmap-filter-actions">
                        <button
                            className="roadmap-filter-action-btn roadmap-filter-action-reset"
                            onClick={handleReset}
                        >
                            <X size={14} />
                            Reset
                        </button>
                        <button
                            className="roadmap-filter-action-btn roadmap-filter-action-apply"
                            onClick={handleApply}
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
