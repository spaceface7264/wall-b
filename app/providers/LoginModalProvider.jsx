import { useState, createContext, useContext } from 'react';
import LoginModal from '../components/LoginModal';

const LoginModalContext = createContext();

export function LoginModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("Sign In");
  const [subtitle, setSubtitle] = useState("Sign in to continue");
  const [redirectTo, setRedirectTo] = useState(null);

  const showLoginModal = (options = {}) => {
    setTitle(options.title || "Sign In");
    setSubtitle(options.subtitle || "Sign in to continue");
    setRedirectTo(options.redirectTo || null);
    setIsOpen(true);
  };

  const closeLoginModal = () => {
    setIsOpen(false);
    // Reset after a short delay to allow animations
    setTimeout(() => {
      setTitle("Sign In");
      setSubtitle("Sign in to continue");
      setRedirectTo(null);
    }, 300);
  };

  return (
    <LoginModalContext.Provider value={{ showLoginModal }}>
      {children}
      <LoginModal
        isOpen={isOpen}
        onClose={closeLoginModal}
        title={title}
        subtitle={subtitle}
        redirectTo={redirectTo}
      />
    </LoginModalContext.Provider>
  );
}

export const useLoginModal = () => {
  const context = useContext(LoginModalContext);
  if (!context) throw new Error('useLoginModal must be used within LoginModalProvider');
  return context;
};

