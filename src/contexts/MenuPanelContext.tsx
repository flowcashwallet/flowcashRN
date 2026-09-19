import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface MenuPanelContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MenuPanelContext = createContext<MenuPanelContextType | undefined>(undefined);

/**
 * Estado (abierto/cerrado) del panel lateral de navegación (`SideMenuPanel`).
 * Es UI efímera, no datos de la app, así que vive en Context en vez de
 * Redux — mismo criterio que `ThemeContext`.
 *
 * Se monta una sola vez en `app/_layout.tsx`, por encima de todo el árbol
 * autenticado, para que cualquier pantalla (el botón de hamburguesa de cada
 * pestaña) pueda abrirlo sin tener que pasar props a través de la
 * navegación.
 */
export const MenuPanelProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  );

  return (
    <MenuPanelContext.Provider value={value}>
      {children}
    </MenuPanelContext.Provider>
  );
};

export const useMenuPanel = () => {
  const context = useContext(MenuPanelContext);
  if (!context) {
    throw new Error("useMenuPanel must be used within a MenuPanelProvider");
  }
  return context;
};
