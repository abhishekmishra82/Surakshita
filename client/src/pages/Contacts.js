import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from '../components/Toast';
import ToastContainer from '../components/Toast';
import LoginPrompt from '../components/LoginPrompt';
import { useAuth } from '../context/AuthContext';
import './Contacts.css';

const emptyForm = { name: '', phone: '', email: '', relationship: '', notifyBySMS: true, notifyByEmail: false };

export default function Contacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchContacts = () => {
    if (!user) return;
    api.get('/contacts').then((r) => setContacts(r.data.contacts)).catch(() => {});
  };

  useEffect(() => { fetchContacts(); }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/contacts/${editId}`, form);
        toast.success('Contact updated');
      } else {
        await api.post('/contacts', form);
        toast.success('Contact added');
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      fetchContacts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (c) => {
    setForm({ name: c.name, phone: c.phone, email: c.email || '', relationship: c.relationship || '', notifyBySMS: c.notifyBySMS, notifyByEmail: c.notifyByEmail });
    setEditId(c._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      toast.success('Contact deleted');
      fetchContacts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="contacts-page">
      <ToastContainer />
      {showLogin && (
        <LoginPrompt
          featureLabel="manage emergency contacts"
          onClose={() => setShowLogin(false)}
          onSuccess={() => { setShowLogin(false); fetchContacts(); }}
        />
      )}
      <div className="page-header">
        <h2>Emergency Contacts</h2>
        <button className="add-btn" onClick={() => {
          if (!user) { setShowLogin(true); return; }
          setForm(emptyForm); setEditId(null); setShowForm(true);
        }}>
          + Add Contact
        </button>
      </div>

      {!user && (
        <div className="empty-state">
          <span>🔐</span>
          <p>Sign in to manage your emergency contacts.</p>
          <button className="add-btn" style={{ marginTop: 12 }} onClick={() => setShowLogin(true)}>Sign In</button>
        </div>
      )}

      {user && contacts.length === 0 && !showForm && (
        <div className="empty-state">
          <span>👥</span>
          <p>No emergency contacts yet.</p>
          <p>Add at least one contact to activate SOS features.</p>
        </div>
      )}

      <div className="contacts-list">
        {contacts.map((c) => (
          <div key={c._id} className="contact-card">
            <div className="contact-avatar">{c.name[0].toUpperCase()}</div>
            <div className="contact-info">
              <strong>{c.name}</strong>
              <span>{c.phone}</span>
              {c.relationship && <span className="contact-rel">{c.relationship}</span>}
              <div className="contact-badges">
                {c.notifyBySMS && <span className="badge sms">SMS</span>}
                {c.notifyByEmail && <span className="badge email">Email</span>}
              </div>
            </div>
            <div className="contact-actions">
              <button className="icon-btn edit" onClick={() => handleEdit(c)}>✏️</button>
              <button className="icon-btn delete" onClick={() => handleDelete(c._id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editId ? 'Edit Contact' : 'Add Contact'}</h3>
            <form onSubmit={handleSubmit} className="contact-form">
              <input className="form-input" name="name" placeholder="Full name *" value={form.name} onChange={handleChange} required />
              <input className="form-input" name="phone" placeholder="Phone (with country code) *" value={form.phone} onChange={handleChange} required />
              <input className="form-input" name="email" placeholder="Email (optional)" type="email" value={form.email} onChange={handleChange} />
              <input className="form-input" name="relationship" placeholder="Relationship (e.g. Mom, Friend)" value={form.relationship} onChange={handleChange} />
              <div className="checkbox-row">
                <label><input type="checkbox" name="notifyBySMS" checked={form.notifyBySMS} onChange={handleChange} /> Notify by SMS</label>
                <label><input type="checkbox" name="notifyByEmail" checked={form.notifyByEmail} onChange={handleChange} /> Notify by Email</label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
