import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

const fetchSuppliers = async () => {
  const { data } = await api.get('/suppliers?limit=100');
  return data.data;
};

const createSupplier = async (payload) => {
  const { data } = await api.post('/suppliers', payload);
  return data.data;
};

const updateSupplier = async ({ id, payload }) => {
  const { data } = await api.patch(`/suppliers/${id}`, payload);
  return data.data;
};

const deleteSupplier = async (id) => {
  const { data } = await api.delete(`/suppliers/${id}`);
  return data.data;
};

export default function Suppliers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  });

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
      setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', notes: '' });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Gagal menyimpan'),
  });

  const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setEditing(null);
      setOpen(false);
      setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', notes: '' });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Gagal update'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
    onError: (err) => alert(err.response?.data?.message || 'Gagal hapus'),
  });

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', notes: '' });
    setError('');
    setOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      notes: s.notes || '',
    });
    setError('');
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) {
      setError('Nama supplier wajib diisi');
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const confirmDelete = (id) => {
    if (window.confirm('Yakin hapus supplier ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', notes: '' });
    setError('');
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#1E293B' }}>
          Supplier
        </h1>
        <button onClick={handleOpenCreate} className="btn-primary text-sm">
          + Supplier Baru
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12" style={{ color: '#64748B' }}>
          <p className="mb-4">Belum ada supplier</p>
          <button onClick={handleOpenCreate} className="btn-primary">
            + Tambah Supplier Pertama
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Nama</th>
                <th>Kontak</th>
                <th>Telepon</th>
                <th style={{ width: '100px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="font-medium">{s.code}</td>
                  <td>{s.name}</td>
                  <td>{s.contactPerson || '-'}</td>
                  <td>{s.phone || '-'}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="btn-icon"
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => confirmDelete(s.id)}
                        className="btn-icon text-red-500 hover:bg-red-50"
                        title="Hapus"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="modal-box space-y-3">
            <h2 className="font-semibold text-lg" style={{ color: '#1E293B' }}>
              {editing ? 'Edit Supplier' : 'Supplier Baru'}
            </h2>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>
                Nama *
              </label>
              <input
                placeholder="Contoh: Sumber Rejeki"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>
                Kontak Person
              </label>
              <input
                placeholder="Nama kontak"
                value={form.contactPerson}
                onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>
                  Telepon
                </label>
                <input
                  placeholder="08xxx"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>
                  Email
                </label>
                <input
                  placeholder="email@contoh.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>
                Alamat
              </label>
              <textarea
                rows={2}
                placeholder="Alamat supplier"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>
                Notes
              </label>
              <textarea
                rows={2}
                placeholder="Catatan tambahan"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button onClick={closeModal} className="btn-outline flex-1">
                Batal
              </button>
              <button
                onClick={submit}
                disabled={isPending}
                className="btn-primary flex-1"
              >
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}