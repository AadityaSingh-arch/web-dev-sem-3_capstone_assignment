export const label = (s) => s.replace('_', ' ');
export const StatusBadge = ({ status }) => <span className={`badge status-${status}`}>{label(status)}</span>;
export const PriorityBadge = ({ priority }) => <span className={`badge prio-${priority}`}>{priority}</span>;
