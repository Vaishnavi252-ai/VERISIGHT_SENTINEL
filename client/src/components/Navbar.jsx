import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';


const AuthButtons = () => {
  const { currentUser, signOut } = useContext(AuthContext);
  const nav = useNavigate();

  if (currentUser) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-gray-200">Hi, <strong className="text-white">{currentUser.username}</strong></span>
        {currentUser.role === 'Admin' && (
          <Link to="/admin/dashboard" className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-gray-200">Admin</Link>
        )}
        <button onClick={async ()=>{await signOut(); nav('/');}} className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-gray-200">Sign out</button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <Link to="/signin" className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-gray-200">Sign In</Link>
      <Link to="/signup" className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white">Sign Up</Link>
    </div>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [currentRole, setCurrentRole] = useState('User');
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Upload & Detect', href: '/detection' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Blog', href: '#blog' },
    { name: 'Contact', href: '#contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navContainerClasses = `
    w-full max-w-7xl mx-auto h-16 flex justify-between items-center transition-all duration-300
    px-4 sm:px-6 lg:px-8 rounded-full
    ${
      scrolled
        ? 'bg-slate-900/90 backdrop-blur-xl border border-purple-500/20 shadow-xl shadow-purple-900/50'
        : 'bg-slate-900/80 backdrop-blur-md border border-slate-700'
    }
  `;

  // --- Simplified Link Rendering ---
  const [activeSection, setActiveSection] = useState('home');

  const smoothScroll = (e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    if (isOpen) setIsOpen(false);
  };

  useEffect(() => {
    const observerOptions = {
      rootMargin: '-20% 0px -40% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    const sections = ['home', 'how-it-works', 'blog', 'contact'].map(id => document.getElementById(id));
    sections.forEach(section => section && observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const renderNavLink = (link, mobile = false) => {
    const className = mobile
      ? "block px-3 py-2 text-gray-300 hover:text-purple-400 transition-all duration-200 rounded-lg hover:bg-slate-800/50"
      : "text-gray-300 hover:text-purple-400 transition-all duration-200 relative group py-2";

    const sectionId = link.href.replace('#', '');
    const isActive = activeSection === sectionId;

    const handleClick = (e) => {
      if (link.href.startsWith('#')) {
        smoothScroll(e, link.href);
      } else {
        setIsOpen(false);
      }
    };

    return (
      <a
        href={link.href}
        key={link.name}
        className={`${className} ${isActive ? (mobile ? 'text-purple-400 bg-slate-800' : 'text-purple-400') : ''}`}
        onClick={handleClick}
      >
        {link.name}
        {!mobile && <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-purple-400 transition-all duration-300 group-hover:w-full ${isActive ? 'w-full' : ''}`}></span>}
      </a>
    );
  };
  // ---------------------------------


  return (
    <header className="fixed top-0 left-0 w-full z-50 pt-6">
      <nav className={navContainerClasses}>
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group cursor-pointer">
  <img 
    src="/images/Logo.png" 
    alt="Logo" 
    className="h-15 w-20 object-contain rounded-full"
  />

  <span className="text-2xl font-extrabold tracking-wide
    bg-gradient-to-r from-cyan-400 via-yellow-300 to-purple-600
    bg-clip-text text-transparent
    transition-all duration-300
    group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]">
    
    VeriSight Sentinel
  </span>
</Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => renderNavLink(link, false))}
        </div>

        {/* Auth actions & CTA */}
        <div className="hidden md:flex items-center space-x-4">
          <AuthButtons />
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-300 hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-slate-800/50"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`
            md:hidden transition-all duration-300 ease-in-out overflow-hidden
            ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="mt-2 px-2 pt-2 pb-3 space-y-1 bg-slate-900/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-lg">
            {navLinks.map((link, index) => (
              <div
                key={link.name}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-in slide-in-from-top-2"
              >
                {renderNavLink(link, true)}
              </div>
            ))}
            <div className="pt-4 border-t border-slate-800">
              <Link
                to="/detection"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 block text-center"
                onClick={() => setIsOpen(false)}
              >
                Join Now
              </Link>
              <div className="mt-3 space-y-2 px-2">
                <Link to="/signin" onClick={() => setIsOpen(false)} className="block w-full text-center px-4 py-2 rounded bg-slate-700 text-gray-200">Sign In</Link>
                <Link to="/signup" onClick={() => setIsOpen(false)} className="block w-full text-center px-4 py-2 rounded bg-purple-600 text-white">Sign Up</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
