import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { tripsApi } from "../api";
import type { Trip } from "../types";
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmDialog } from "../components";
import { extractErrorMessage, formatDate } from "../utils";
import { useAuth } from "../context";

export const TripsListPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tripsApi.list();
      setTrips(data.items);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await tripsApi.delete(deleteId);
      setTrips((prev) => prev.filter((t) => t.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = (trip: Trip) => {
    return trip.ownerId === user?.id || isAdmin;
  };

  if (loading) {
    return <LoadingSpinner message="Загрузка поездок..." />;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Мои поездки</h1>
        <Link to="/trips/new" className="btn btn-primary">
          + Новая поездка
        </Link>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {trips.length === 0 ? (
        <EmptyState
          title="Нет поездок"
          description="Создайте первую поездку, чтобы начать планирование!"
          action={
            <Link to="/trips/new" className="btn btn-primary">
              Создать поездку
            </Link>
          }
        />
      ) : (
        <div className="trips-grid">
          {trips.map((trip) => (
            <div key={trip.id} className="card trip-card">
              <div className="trip-card-body">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: "1.125rem" }}>{trip.title}</h3>
                  {trip.ownerId === user?.id && <span className="badge badge-owner">владелец</span>}
                </div>
                {trip.description && (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: 8 }}>
                    {trip.description}
                  </p>
                )}
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  📅 {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                  {trip.budget && <span style={{ marginLeft: 12 }}>💰 {trip.budget.toLocaleString()} ₽</span>}
                </div>
              </div>
              <div className="trip-card-footer">
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/trips/${trip.id}`)}>
                  Открыть
                </button>
                {canDelete(trip) && (
                  <>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/trips/${trip.id}/edit`)}>
                      Редактировать
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(trip.id)}>
                      Удалить
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Удаление поездки"
        message="Вы уверены? Все связанные данные (остановки, заметки, расходы) будут удалены."
        confirmLabel="Удалить"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
};
