import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tripsApi, stopsApi, notesApi, expensesApi } from "../api";
import type { TripWithDetails, Stop, Note, Expense } from "../types";
import { LoadingSpinner, ErrorAlert, EmptyState, Modal, ConfirmDialog } from "../components";
import { extractErrorMessage, formatDate, formatDateTime, toInputDate } from "../utils";
import { useAuth } from "../context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// =========== TABS ===========
type TabType = "stops" | "notes" | "expenses" | "participants";

// =========== STOP FORM ===========
const stopSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  address: z.string().optional(),
  arrivalDate: z.string().optional(),
  departureDate: z.string().optional(),
  order: z.coerce.number().int().nonnegative(),
});
type StopForm = z.infer<typeof stopSchema>;

// =========== NOTE FORM ===========
const noteSchema = z.object({
  content: z.string().min(1, "Заметка не может быть пустой"),
});
type NoteForm = z.infer<typeof noteSchema>;

// =========== EXPENSE FORM ===========
const expenseSchema = z.object({
  amount: z.coerce.number().positive("Сумма должна быть положительной"),
  category: z.string().optional(),
  description: z.string().optional(),
  date: z.string().min(1, "Дата обязательна"),
});
type ExpenseForm = z.infer<typeof expenseSchema>;

// =========== SHARE FORM ===========
const shareSchema = z.object({
  userId: z.string().uuid("Введите корректный UUID пользователя"),
});
type ShareForm = z.infer<typeof shareSchema>;

export const TripDetailPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("stops");

  // Stops
  const [stops, setStops] = useState<Stop[]>([]);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);

  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Share
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ type: "stop" | "note" | "expense"; id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isOwner = trip?.ownerId === user?.id;
  const canEdit = isOwner || isAdmin;

  // =========== LOAD TRIP ===========
  const loadTrip = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tripsApi.get(tripId!);
      setTrip(data);
      setStops(data.stops || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  // =========== LOAD NOTES / EXPENSES ===========
  const loadNotes = useCallback(async () => {
    try {
      setNotesLoading(true);
      const data = await notesApi.list({ tripId: tripId! });
      setNotes(data.items);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setNotesLoading(false);
    }
  }, [tripId]);

  const loadExpenses = useCallback(async () => {
    try {
      setExpensesLoading(true);
      const data = await expensesApi.list({ tripId: tripId! });
      setExpenses(data.items);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setExpensesLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (activeTab === "notes") loadNotes();
    if (activeTab === "expenses") loadExpenses();
  }, [activeTab, loadNotes, loadExpenses]);

  // =========== STOP CRUD ===========
  const stopForm = useForm<StopForm>({
    resolver: zodResolver(stopSchema),
    defaultValues: { name: "", address: "", arrivalDate: "", departureDate: "", order: stops.length },
  });

  const openStopModal = (stop?: Stop) => {
    if (stop) {
      setEditingStop(stop);
      stopForm.reset({
        name: stop.name,
        address: stop.address || "",
        arrivalDate: stop.arrivalDate ? toInputDate(stop.arrivalDate) : "",
        departureDate: stop.departureDate ? toInputDate(stop.departureDate) : "",
        order: stop.order,
      });
    } else {
      setEditingStop(null);
      stopForm.reset({ name: "", address: "", arrivalDate: "", departureDate: "", order: stops.length });
    }
    setStopModalOpen(true);
  };

  const handleStopSubmit = async (data: StopForm) => {
    try {
      if (editingStop) {
        const updated = await stopsApi.update(editingStop.id, {
          name: data.name,
          address: data.address || undefined,
          arrivalDate: data.arrivalDate ? new Date(data.arrivalDate).toISOString() : undefined,
          departureDate: data.departureDate ? new Date(data.departureDate).toISOString() : undefined,
          order: data.order,
        });
        setStops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)).sort((a, b) => a.order - b.order));
      } else {
        const created = await stopsApi.create({
          tripId: tripId!,
          name: data.name,
          address: data.address || undefined,
          arrivalDate: data.arrivalDate ? new Date(data.arrivalDate).toISOString() : undefined,
          departureDate: data.departureDate ? new Date(data.departureDate).toISOString() : undefined,
          order: data.order,
        });
        setStops((prev) => [...prev, created].sort((a, b) => a.order - b.order));
      }
      setStopModalOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  // =========== NOTE CRUD ===========
  const noteForm = useForm<NoteForm>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: "" },
  });

  const openNoteModal = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      noteForm.reset({ content: note.content });
    } else {
      setEditingNote(null);
      noteForm.reset({ content: "" });
    }
    setNoteModalOpen(true);
  };

  const handleNoteSubmit = async (data: NoteForm) => {
    try {
      if (editingNote) {
        const updated = await notesApi.update(editingNote.id, { content: data.content });
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      } else {
        const created = await notesApi.create({ tripId: tripId!, content: data.content });
        setNotes((prev) => [created, ...prev]);
      }
      setNoteModalOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const canEditNote = (note: Note) => note.authorId === user?.id;
  const canDeleteNote = (note: Note) => note.authorId === user?.id || isOwner || isAdmin;

  // =========== EXPENSE CRUD ===========
  const expenseForm = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { amount: 0, category: "", description: "", date: "" },
  });

  const openExpenseModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      expenseForm.reset({
        amount: expense.amount,
        category: expense.category || "",
        description: expense.description || "",
        date: toInputDate(expense.date),
      });
    } else {
      setEditingExpense(null);
      expenseForm.reset({ amount: 0, category: "", description: "", date: "" });
    }
    setExpenseModalOpen(true);
  };

  const handleExpenseSubmit = async (data: ExpenseForm) => {
    try {
      if (editingExpense) {
        const updated = await expensesApi.update(editingExpense.id, {
          amount: data.amount,
          category: data.category || undefined,
          description: data.description || undefined,
          date: new Date(data.date).toISOString(),
        });
        setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const created = await expensesApi.create({
          tripId: tripId!,
          amount: data.amount,
          category: data.category || undefined,
          description: data.description || undefined,
          date: new Date(data.date).toISOString(),
        });
        setExpenses((prev) => [created, ...prev]);
      }
      setExpenseModalOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const canEditExpense = (expense: Expense) => expense.authorId === user?.id;
  const canDeleteExpense = (expense: Expense) => expense.authorId === user?.id || isOwner || isAdmin;

  // =========== SHARE ===========
  const shareForm = useForm<ShareForm>({
    resolver: zodResolver(shareSchema),
    defaultValues: { userId: "" },
  });

  const handleShare = async (data: ShareForm) => {
    try {
      await tripsApi.share(tripId!, data.userId);
      await loadTrip();
      setShareModalOpen(false);
      shareForm.reset();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    try {
      await tripsApi.removeParticipant(tripId!, userId);
      await loadTrip();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  // =========== DELETE ===========
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (deleteTarget.type === "stop") {
        await stopsApi.delete(deleteTarget.id);
        setStops((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      } else if (deleteTarget.type === "note") {
        await notesApi.delete(deleteTarget.id);
        setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      } else if (deleteTarget.type === "expense") {
        await expensesApi.delete(deleteTarget.id);
        setExpenses((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // =========== RENDER ===========
  if (loading) {
    return <LoadingSpinner message="Загрузка поездки..." />;
  }

  if (!trip) {
    return <ErrorAlert message={error || "Поездка не найдена"} />;
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {trip.title}
            {isOwner && <span className="badge badge-owner">владелец</span>}
          </h1>
          {trip.description && <p style={{ color: "var(--text-muted)", marginTop: 4 }}>{trip.description}</p>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {canEdit && (
            <button className="btn btn-outline" onClick={() => navigate(`/trips/${tripId}/edit`)}>
              Редактировать
            </button>
          )}
          {isOwner && (
            <button className="btn btn-primary" onClick={() => setShareModalOpen(true)}>
              Поделиться
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-value">{formatDate(trip.startDate)}</div>
          <div className="stat-label">Начало</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatDate(trip.endDate)}</div>
          <div className="stat-label">Окончание</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stops.length}</div>
          <div className="stat-label">Остановок</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{trip.budget ? `${trip.budget.toLocaleString()} ₽` : "—"}</div>
          <div className="stat-label">Бюджет</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalExpenses.toLocaleString()} ₽</div>
          <div className="stat-label">Потрачено</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "stops" ? "active" : ""}`} onClick={() => setActiveTab("stops")}>
          Маршрут
        </button>
        <button className={`tab ${activeTab === "notes" ? "active" : ""}`} onClick={() => setActiveTab("notes")}>
          Заметки
        </button>
        <button className={`tab ${activeTab === "expenses" ? "active" : ""}`} onClick={() => setActiveTab("expenses")}>
          Расходы
        </button>
        <button className={`tab ${activeTab === "participants" ? "active" : ""}`} onClick={() => setActiveTab("participants")}>
          Участники
        </button>
      </div>

      {/* Stops Tab */}
      {activeTab === "stops" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Остановки</h3>
            <button className="btn btn-primary btn-sm" onClick={() => openStopModal()}>
              + Добавить
            </button>
          </div>
          {stopsLoading ? (
            <LoadingSpinner />
          ) : stops.length === 0 ? (
            <EmptyState title="Нет остановок" description="Добавьте первую точку маршрута" />
          ) : (
            <ul className="list">
              {stops.map((stop, idx) => (
                <li key={stop.id} className="list-item">
                  <div className="list-item-content">
                    <div className="list-item-title">
                      {idx + 1}. {stop.name}
                    </div>
                    <div className="list-item-meta">
                      {stop.address && <span>{stop.address}</span>}
                      {stop.arrivalDate && <span> • Прибытие: {formatDate(stop.arrivalDate)}</span>}
                      {stop.departureDate && <span> • Отъезд: {formatDate(stop.departureDate)}</span>}
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => openStopModal(stop)}>
                      ✏️
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget({ type: "stop", id: stop.id })}>
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === "notes" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Заметки</h3>
            <button className="btn btn-primary btn-sm" onClick={() => openNoteModal()}>
              + Добавить
            </button>
          </div>
          {notesLoading ? (
            <LoadingSpinner />
          ) : notes.length === 0 ? (
            <EmptyState title="Нет заметок" description="Добавьте первую заметку" />
          ) : (
            <ul className="list">
              {notes.map((note) => (
                <li key={note.id} className="list-item">
                  <div className="list-item-content">
                    <div className="list-item-title">{note.content}</div>
                    <div className="list-item-meta">
                      {formatDateTime(note.createdAt)}
                      {note.authorId === user?.id && <span> • Вы</span>}
                    </div>
                  </div>
                  <div className="list-item-actions">
                    {canEditNote(note) && (
                      <button className="btn btn-outline btn-sm" onClick={() => openNoteModal(note)}>
                        ✏️
                      </button>
                    )}
                    {canDeleteNote(note) && (
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget({ type: "note", id: note.id })}>
                        🗑️
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === "expenses" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Расходы</h3>
            <button className="btn btn-primary btn-sm" onClick={() => openExpenseModal()}>
              + Добавить
            </button>
          </div>
          {expensesLoading ? (
            <LoadingSpinner />
          ) : expenses.length === 0 ? (
            <EmptyState title="Нет расходов" description="Добавьте первый расход" />
          ) : (
            <ul className="list">
              {expenses.map((expense) => (
                <li key={expense.id} className="list-item">
                  <div className="list-item-content">
                    <div className="list-item-title">
                      {expense.amount.toLocaleString()} ₽
                      {expense.category && <span className="badge" style={{ marginLeft: 8 }}>{expense.category}</span>}
                    </div>
                    <div className="list-item-meta">
                      {expense.description && <span>{expense.description} • </span>}
                      {formatDate(expense.date)}
                      {expense.authorId === user?.id && <span> • Вы</span>}
                    </div>
                  </div>
                  <div className="list-item-actions">
                    {canEditExpense(expense) && (
                      <button className="btn btn-outline btn-sm" onClick={() => openExpenseModal(expense)}>
                        ✏️
                      </button>
                    )}
                    {canDeleteExpense(expense) && (
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget({ type: "expense", id: expense.id })}>
                        🗑️
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === "participants" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Участники ({trip.participants?.length || 0})</h3>
            {isOwner && (
              <button className="btn btn-primary btn-sm" onClick={() => setShareModalOpen(true)}>
                + Добавить
              </button>
            )}
          </div>
          {!trip.participants || trip.participants.length === 0 ? (
            <EmptyState title="Нет участников" />
          ) : (
            <ul className="list">
              {trip.participants.map((p) => (
                <li key={p.id} className="list-item">
                  <div className="list-item-content">
                    <div className="list-item-title">
                      {p.userId}
                      {p.userId === trip.ownerId && <span className="badge badge-owner" style={{ marginLeft: 8 }}>владелец</span>}
                      {p.userId === user?.id && <span className="badge" style={{ marginLeft: 8 }}>вы</span>}
                    </div>
                    <div className="list-item-meta">Присоединился: {formatDateTime(p.joinedAt)}</div>
                  </div>
                  {(isOwner || p.userId === user?.id) && p.userId !== trip.ownerId && (
                    <div className="list-item-actions">
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemoveParticipant(p.userId)}>
                        Удалить
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Stop Modal */}
      <Modal
        isOpen={stopModalOpen}
        onClose={() => setStopModalOpen(false)}
        title={editingStop ? "Редактировать остановку" : "Новая остановка"}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setStopModalOpen(false)}>
              Отмена
            </button>
            <button
              className="btn btn-primary"
              onClick={stopForm.handleSubmit(handleStopSubmit)}
              disabled={stopForm.formState.isSubmitting}
            >
              {stopForm.formState.isSubmitting ? "Сохранение..." : "Сохранить"}
            </button>
          </>
        }
      >
        <form>
          <div className="form-group">
            <label className="form-label">Название</label>
            <input className="form-input" {...stopForm.register("name")} />
            {stopForm.formState.errors.name && (
              <div className="form-error">{stopForm.formState.errors.name.message}</div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Адрес</label>
            <input className="form-input" {...stopForm.register("address")} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Дата прибытия</label>
              <input className="form-input" type="date" {...stopForm.register("arrivalDate")} />
            </div>
            <div className="form-group">
              <label className="form-label">Дата отъезда</label>
              <input className="form-input" type="date" {...stopForm.register("departureDate")} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Порядок</label>
            <input className="form-input" type="number" {...stopForm.register("order")} />
          </div>
        </form>
      </Modal>

      {/* Note Modal */}
      <Modal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title={editingNote ? "Редактировать заметку" : "Новая заметка"}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setNoteModalOpen(false)}>
              Отмена
            </button>
            <button
              className="btn btn-primary"
              onClick={noteForm.handleSubmit(handleNoteSubmit)}
              disabled={noteForm.formState.isSubmitting}
            >
              {noteForm.formState.isSubmitting ? "Сохранение..." : "Сохранить"}
            </button>
          </>
        }
      >
        <form>
          <div className="form-group">
            <label className="form-label">Содержимое</label>
            <textarea className="form-textarea" {...noteForm.register("content")} />
            {noteForm.formState.errors.content && (
              <div className="form-error">{noteForm.formState.errors.content.message}</div>
            )}
          </div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title={editingExpense ? "Редактировать расход" : "Новый расход"}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setExpenseModalOpen(false)}>
              Отмена
            </button>
            <button
              className="btn btn-primary"
              onClick={expenseForm.handleSubmit(handleExpenseSubmit)}
              disabled={expenseForm.formState.isSubmitting}
            >
              {expenseForm.formState.isSubmitting ? "Сохранение..." : "Сохранить"}
            </button>
          </>
        }
      >
        <form>
          <div className="form-group">
            <label className="form-label">Сумма (₽)</label>
            <input className="form-input" type="number" {...expenseForm.register("amount")} />
            {expenseForm.formState.errors.amount && (
              <div className="form-error">{expenseForm.formState.errors.amount.message}</div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Категория</label>
            <input className="form-input" {...expenseForm.register("category")} placeholder="Еда, Транспорт..." />
          </div>
          <div className="form-group">
            <label className="form-label">Описание</label>
            <input className="form-input" {...expenseForm.register("description")} />
          </div>
          <div className="form-group">
            <label className="form-label">Дата</label>
            <input className="form-input" type="date" {...expenseForm.register("date")} />
            {expenseForm.formState.errors.date && (
              <div className="form-error">{expenseForm.formState.errors.date.message}</div>
            )}
          </div>
        </form>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Поделиться поездкой"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShareModalOpen(false)}>
              Отмена
            </button>
            <button
              className="btn btn-primary"
              onClick={shareForm.handleSubmit(handleShare)}
              disabled={shareForm.formState.isSubmitting}
            >
              {shareForm.formState.isSubmitting ? "Добавление..." : "Добавить"}
            </button>
          </>
        }
      >
        <form>
          <div className="form-group">
            <label className="form-label">ID пользователя (UUID)</label>
            <input className="form-input" {...shareForm.register("userId")} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            {shareForm.formState.errors.userId && (
              <div className="form-error">{shareForm.formState.errors.userId.message}</div>
            )}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Введите UUID пользователя, которому хотите дать доступ к поездке.
          </p>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Удаление"
        message="Вы уверены, что хотите удалить этот элемент?"
        confirmLabel="Удалить"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};
