interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => {
  return (
    <div className="empty-state">
      <div className="empty-state-title">{title}</div>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
};
