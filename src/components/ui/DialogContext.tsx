import { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';

type DialogOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isPrompt?: boolean;
  promptPlaceholder?: string;
};

type DialogContextType = {
  confirm: (options: string | DialogOptions) => Promise<boolean>;
  prompt: (options: string | DialogOptions) => Promise<string | null>;
};

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within DialogProvider');
  return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DialogOptions & { resolve: (val: any) => void }>({
    title: '',
    resolve: () => {},
  });
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const openDialog = (options: string | DialogOptions, isPrompt = false) => {
    const opts = typeof options === 'string' ? { title: options } : options;
    return new Promise<any>((resolve) => {
      setConfig({
        ...opts,
        isPrompt,
        resolve,
      });
      setInputValue('');
      setIsOpen(true);
    });
  };

  const confirm = (options: string | DialogOptions) => openDialog(options, false) as Promise<boolean>;
  const prompt = (options: string | DialogOptions) => openDialog(options, true) as Promise<string | null>;

  const handleConfirm = () => {
    setIsOpen(false);
    config.resolve(config.isPrompt ? inputValue : true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    config.resolve(config.isPrompt ? null : false);
  };

  useEffect(() => {
    if (isOpen && config.isPrompt && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, config.isPrompt]);

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {isOpen && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{config.title}</h2>
            {config.message && <p className="modal-message">{config.message}</p>}
            
            {config.isPrompt && (
              <input
                ref={inputRef}
                type="text"
                className="modal-input"
                placeholder={config.promptPlaceholder || ''}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
            )}

            <div className="modal-actions">
              <button className="secondary-button" onClick={handleCancel}>
                {config.cancelText || 'Cancelar'}
              </button>
              <button className="primary-button" onClick={handleConfirm}>
                {config.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
