interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorAlert = ({ message, onDismiss }: ErrorAlertProps) => {
  return (
    <div className="alert alert-error" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span>{message}</span>
      {onDismiss && (
        <button
          className="btn btn-sm btn-icon"
          onClick={onDismiss}
          style={{ background: "transparent", color: "inherit", padding: 4 }}
        >
          ✕
        </button>
      )}
    </div>
  );
};
