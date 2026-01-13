import React, { useEffect, useState } from 'react';
import { getUsers, updateUserRole, deleteUser } from '../services/users';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';
import { User } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id: number, role: string) => {
    try {
      await updateUserRole(id, role);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить этого пользователя?')) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h2>Управление пользователями</h2>
      {error && <ErrorMessage message={error} />}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Имя</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Роль</th>
            <th style={thStyle}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={tdStyle}>{user.id}</td>
              <td style={tdStyle}>{user.name}</td>
              <td style={tdStyle}>{user.email}</td>
              <td style={tdStyle}>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  style={selectStyle}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td style={tdStyle}>
                <button onClick={() => handleDelete(user.id)} style={deleteButtonStyle}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const thStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  padding: '1rem',
  textAlign: 'left',
  borderBottom: '2px solid #dee2e6',
};

const tdStyle: React.CSSProperties = {
  padding: '1rem',
  borderBottom: '1px solid #dee2e6',
};

const selectStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
};

const deleteButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export default UserManagement;
