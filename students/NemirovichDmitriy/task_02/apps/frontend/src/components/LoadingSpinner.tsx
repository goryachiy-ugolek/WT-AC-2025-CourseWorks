interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner = ({ message = "Загрузка..." }: LoadingSpinnerProps) => {
  return (
    <div className="loading">
      <div className="spinner" style={{ marginRight: 12 }} />
      {message}
    </div>
  );
};
