import { createContext, useContext, useState, useEffect } from 'react';

// Default partners that match both admin and website
const DEFAULT_PARTNERS = [
  { id: 1, name: 'SEMA', category: 'Civic technology' },
  { id: 2, name: 'Strategic Applications', category: 'International' },
  { id: 3, name: 'Creatives Garage', category: 'Creative hub' },
  { id: 4, name: 'YWCA', category: 'Community' },
];

const PartnerContext = createContext();

export function PartnerProvider({ children }) {
  // Load partners from localStorage or use defaults
  const [partners, setPartners] = useState(() => {
    const saved = localStorage.getItem('anika_partners');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_PARTNERS;
      }
    }
    return DEFAULT_PARTNERS;
  });

  // Save to localStorage whenever partners change
  useEffect(() => {
    localStorage.setItem('anika_partners', JSON.stringify(partners));
  }, [partners]);

  const addPartner = (partner) => {
    const newPartner = {
      ...partner,
      id: partner.id || Date.now()
    };
    setPartners(prev => [newPartner, ...prev]);
  };

  const editPartner = (partner) => {
    setPartners(prev => prev.map(p => p.id === partner.id ? partner : p));
  };

  const deletePartner = (id) => {
    setPartners(prev => prev.filter(p => p.id !== id));
  };

  const savePartner = (partner) => {
    const exists = partners.some(p => p.id === partner.id);
    if (exists) {
      editPartner(partner);
    } else {
      addPartner(partner);
    }
  };

  return (
    <PartnerContext.Provider value={{
      partners,
      addPartner,
      editPartner,
      deletePartner,
      savePartner,
    }}>
      {children}
    </PartnerContext.Provider>
  );
}

export function usePartners() {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error('usePartners must be used within a PartnerProvider');
  }
  return context;
}