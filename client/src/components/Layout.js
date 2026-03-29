import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSOS } from '../context/SOSContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const { sosActive } = useSOS();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`layout ${sosActive ? 'sos-active-layout' : ''}`}>
      {sosActive && (
        <div className="sos-banner">
          🚨 SOS ACTIVE — Emergency alerts sent to your contacts
        </div>
      )}
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo">
            <div className="logo-shield">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2 L34 8 L34 20 C34 28 28 35 20 38 C12 35 6 28 6 20 L6 8 Z"
                  stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <polyline points="13,20 18,25 27,16" stroke="white" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-text">SURAKSHITA</span>
          </NavLink>
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </header>

      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="nav-links">
          {[
            { to: '/', icon: '🏠', label: 'Home' },
            { to: '/contacts', icon: '👥', label: 'Contacts' },
            { to: '/journey', icon: '🗺️', label: 'Journey' },
            { to: '/incidents', icon: '📋', label: 'Incidents' },
            { to: '/settings', icon: '⚙️', label: 'Settings' },
          ].map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
        <div className="nav-footer">
          <span className="nav-user">{user?.name || user?.email}</span>
          <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
