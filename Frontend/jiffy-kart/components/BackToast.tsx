import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface BackToastProps {
    visible: boolean;
    message?: string;
    duration?: number;
    onDismiss: () => void;
}

export const BackToast: React.FC<BackToastProps> = ({
    visible,
    message = 'Press back again to exit',
    duration = 2000,
    onDismiss,
}) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (visible) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                onDismiss();
            }, duration);
            return () => clearTimeout(timer);
        } else {
            setShow(false);
        }
    }, [visible, duration, onDismiss]);

    if (!show) return null;

    return createPortal(
        <div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in slide-in-from-bottom-4 duration-300"
            role="alert"
        >
            <div className="bg-slate-900/95 text-white px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-white/10 text-sm font-bold tracking-wide whitespace-nowrap">
                {message}
            </div>
        </div>,
        document.body
    );
};
