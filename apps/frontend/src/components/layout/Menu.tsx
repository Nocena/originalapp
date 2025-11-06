import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PrimaryButton from '../ui/PrimaryButton';
import ThematicImage from '../ui/ThematicImage';
import ThematicContainer from '../ui/ThematicContainer';
import WalletMenu from './menu/Wallet';
import NoceniteMenu from './menu/Nocenite';
import SettingsMenu from './menu/Settings';
import FAQMenu from './menu/FAQ';
import SupportMenu from './menu/Support';
import FeedbackMenu from './menu/Feedback';
import Image from 'next/image';
import getAvatar from 'src/helpers/getAvatar';
import getAccount from '../../helpers/getAccount';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  showBottomNavbar?: boolean;
}

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, onLogout, showBottomNavbar = false }) => {
  const { currentLensAccount } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const defaultProfilePic = '/images/profile.png';

  // Enhanced MenuItem with proper scroll detection
  const MenuItem = ({
    icon,
    title,
    onClick,
    description,
  }: {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    description?: string;
  }) => {
    const [isPressed, setIsPressed] = useState(false);
    const touchStartRef = useRef<{
      x: number;
      y: number;
      time: number;
      scrollTop: number;
    } | null>(null);

    const scrollThreshold = 10;
    const timeThreshold = 500;

    const handleTouchStart = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const currentScrollTop = contentRef.current?.scrollTop || 0;

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        scrollTop: currentScrollTop,
      };
      setIsPressed(true);
      setIsScrolling(false);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      const currentScrollTop = contentRef.current?.scrollTop || 0;
      const scrollDelta = Math.abs(currentScrollTop - touchStartRef.current.scrollTop);

      // Detect scrolling by movement or scroll position change
      if (deltaX > scrollThreshold || deltaY > scrollThreshold || scrollDelta > 5) {
        setIsPressed(false);
        setIsScrolling(true);
        touchStartRef.current = null;
      }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStartRef.current || isScrolling) {
        setIsPressed(false);
        touchStartRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      const deltaTime = Date.now() - touchStartRef.current.time;
      const currentScrollTop = contentRef.current?.scrollTop || 0;
      const scrollDelta = Math.abs(currentScrollTop - touchStartRef.current.scrollTop);

      setIsPressed(false);

      // Only trigger if it's a genuine tap
      if (
        deltaX <= scrollThreshold &&
        deltaY <= scrollThreshold &&
        deltaTime <= timeThreshold &&
        scrollDelta <= 5
      ) {
        e.preventDefault();
        e.stopPropagation();

        // Add small delay for visual feedback
        requestAnimationFrame(() => {
          onClick();
        });
      }

      touchStartRef.current = null;
    };

    const handleTouchCancel = () => {
      setIsPressed(false);
      touchStartRef.current = null;
    };

    // Mouse fallback
    const handleClick = (e: React.MouseEvent) => {
      if (isScrolling) return;
      e.preventDefault();
      e.stopPropagation();
      onClick();
    };

    return (
      <div
        className={`w-full flex items-center py-4 px-6 transition-all duration-100 cursor-pointer text-left rounded-lg select-none ${
          isPressed && !isScrolling ? 'bg-white/20 scale-[0.98]' : 'bg-transparent'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        style={{
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
      >
        <div className="flex-shrink-0 w-5 h-5 text-white/70">{icon}</div>
        <div className="flex-1 ml-4">
          <div className="text-white font-medium text-base">{title}</div>
          {description && <div className="text-white/60 text-sm mt-0.5">{description}</div>}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white/50"
        >
          <polyline points="9,18 15,12 9,6" />
        </svg>
      </div>
    );
  };

  // Enhanced SocialButton with scroll awareness
  const SocialButton = ({
    href,
    children,
    gradientFrom,
    gradientTo,
  }: {
    href: string;
    children: React.ReactNode;
    gradientFrom: string;
    gradientTo: string;
  }) => {
    const [isPressed, setIsPressed] = useState(false);
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      setIsPressed(true);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStartRef.current) {
        setIsPressed(false);
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      const deltaTime = Date.now() - touchStartRef.current.time;

      setIsPressed(false);

      if (deltaX <= 10 && deltaY <= 10 && deltaTime <= 300) {
        e.preventDefault();
        setTimeout(() => {
          window.open(href, '_blank');
        }, 0);
      }

      touchStartRef.current = null;
    };

    const handleTouchCancel = () => {
      setIsPressed(false);
      touchStartRef.current = null;
    };

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      window.open(href, '_blank');
    };

    return (
      <div
        className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center transition-transform duration-100 cursor-pointer shadow-lg select-none ${
          isPressed ? 'scale-95' : ''
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        style={{
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          touchAction: 'manipulation',
        }}
      >
        {children}
      </div>
    );
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle swipe to close (only for menu panel, not content)
  const handleMenuTouchStart = (e: React.TouchEvent) => {
    // Only handle if touch is on the menu panel itself, not scrollable content
    if (contentRef.current?.contains(e.target as Node)) return;
    setTouchStart(e.touches[0].clientX);
  };

  const handleMenuTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || contentRef.current?.contains(e.target as Node)) return;

    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    if (diff > 50) {
      onClose();
      setTouchStart(null);
    }
  };

  const handleMenuTouchEnd = () => {
    setTouchStart(null);
  };

  // Handle scroll events to detect scrolling state
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Set new timeout to clear scrolling state
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        contentElement.removeEventListener('scroll', handleScroll);
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
      };
    }
  }, []);

  const renderMainMenu = () => (
    <div className="flex flex-col h-full">
      {/* User Info */}
      <div className="text-center py-8 px-6 border-b border-white/20 flex-shrink-0">
        <div className="w-20 h-20 mx-auto mb-4">
          <ThematicImage className="w-full h-full z-999">
            <Image
              src={getAvatar(currentLensAccount) || defaultProfilePic}
              alt="Profile"
              width={80}
              height={80}
              className="w-full h-full object-cover rounded-full"
            />
          </ThematicImage>
        </div>
        <h3 className="text-white font-semibold text-xl mb-1">
          {getAccount(currentLensAccount)?.name || 'User'}
        </h3>
        <p className="text-white/70 text-sm mb-4">
          {currentLensAccount?.metadata?.bio || 'No bio yet'}
        </p>
        <PrimaryButton
          text="Logout"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onLogout();
          }}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white border-red-500/30"
        />
      </div>

      {/* Scrollable Menu Items */}
      <div
        className="flex-1 py-4 px-3 space-y-2 overflow-y-auto scrollbar-hide"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <MenuItem
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
              <circle cx="12" cy="16" r="1" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
          title="Wallet"
          description="Manage your tokens and rewards"
          onClick={() => setActiveSection('wallet')}
        />

        <MenuItem
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
          title="Nocenite"
          description="Your token balance and history"
          onClick={() => setActiveSection('nocenite')}
        />

        <MenuItem
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          }
          title="Settings"
          description="App preferences and notifications"
          onClick={() => setActiveSection('settings')}
        />

        <MenuItem
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
          title="FAQ"
          description="Beta info and common questions"
          onClick={() => setActiveSection('faq')}
        />

        <MenuItem
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
          title="Support"
          description="Help & contact"
          onClick={() => setActiveSection('support')}
        />

        <MenuItem
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 9V5a3 3 0 0 0-6 0v4" />
              <rect x="2" y="9" width="20" height="12" rx="2" ry="2" />
              <circle cx="12" cy="15" r="1" />
            </svg>
          }
          title="Feedback"
          description="Help us improve Nocena"
          onClick={() => setActiveSection('feedback')}
        />
      </div>

      {/* Social Links - Fixed at bottom */}
      <div className="px-6 py-4 border-t border-white/20 space-y-4 flex-shrink-0">
        <div>
          <p className="text-white/70 text-sm mb-4 text-center">Connect with us</p>
          <div className="flex justify-center space-x-4">
            <SocialButton
              href="https://x.com/nocena_app"
              gradientFrom="from-blue-500"
              gradientTo="to-blue-700"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </SocialButton>

            <SocialButton
              href="https://discord.gg/nocena"
              gradientFrom="from-purple-500"
              gradientTo="to-purple-700"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </SocialButton>

            <SocialButton
              href="https://t.me/+whC098-RLD02N2I0"
              gradientFrom="from-blue-400"
              gradientTo="to-blue-600"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.942 13.98l-2.955-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.954z" />
              </svg>
            </SocialButton>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'wallet':
        return <WalletMenu onBack={() => setActiveSection(null)} />;
      case 'nocenite':
        return <NoceniteMenu onBack={() => setActiveSection(null)} />;
      case 'settings':
        return <SettingsMenu onBack={() => setActiveSection(null)} />;
      case 'faq':
        return <FAQMenu onBack={() => setActiveSection(null)} />;
      case 'support':
        return <SupportMenu onBack={() => setActiveSection(null)} />;
      case 'feedback':
        return <FeedbackMenu onBack={() => setActiveSection(null)} />;
      default:
        return renderMainMenu();
    }
  };

  return (
    <>
      {/* Menu panel */}
      <div
        ref={menuRef}
        className={`fixed top-0 left-0 h-full w-[85%] max-w-sm transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-[9990]`}
        onTouchStart={handleMenuTouchStart}
        onTouchMove={handleMenuTouchMove}
        onTouchEnd={handleMenuTouchEnd}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Clean glassmorphic background */}
        <div className="h-full bg-black/30 backdrop-blur-xl border-r border-white/20">
          {/* Close button */}
          <div className="flex absolute justify-end p-4 pb-2 bg-transparent right-0 z-10">
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 transition-transform duration-200 cursor-pointer select-none"
              role="button"
              tabIndex={0}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div ref={contentRef} className="h-full overflow-y-auto pb-4">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Menu;
