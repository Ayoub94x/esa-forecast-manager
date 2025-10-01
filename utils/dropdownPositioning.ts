export interface DropdownPosition {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    maxHeight?: number;
}

export interface PositioningOptions {
    dropdownWidth?: number;
    dropdownHeight?: number;
    margin?: number;
    preferredPosition?: 'below' | 'above' | 'auto';
    preferredAlignment?: 'left' | 'right' | 'center' | 'auto';
}

/**
 * Calcola la posizione ottimale per un dropdown basandosi sullo spazio disponibile
 */
export const calculateDropdownPosition = (
    triggerElement: HTMLElement,
    options: PositioningOptions = {}
): DropdownPosition => {
    const {
        dropdownWidth = 320,
        dropdownHeight = 400,
        margin = 8,
        preferredPosition = 'auto',
        preferredAlignment = 'auto'
    } = options;

    const triggerRect = triggerElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const position: DropdownPosition = {};

    // Calcola spazi disponibili
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const spaceRight = viewportWidth - triggerRect.left;
    const spaceLeft = triggerRect.right;

    // Posizionamento verticale
    let positionBelow = false;
    
    if (preferredPosition === 'below') {
        positionBelow = spaceBelow >= margin;
    } else if (preferredPosition === 'above') {
        positionBelow = spaceAbove < margin;
    } else {
        // Auto: scegli la posizione con più spazio
        positionBelow = spaceBelow >= spaceAbove;
    }

    if (positionBelow) {
        // Posiziona sotto il trigger
        position.top = triggerRect.bottom + scrollY + margin;
        if (spaceBelow < dropdownHeight + margin) {
            position.maxHeight = Math.max(spaceBelow - margin * 2, 200);
        }
    } else {
        // Posiziona sopra il trigger
        position.bottom = viewportHeight - triggerRect.top - scrollY + margin;
        if (spaceAbove < dropdownHeight + margin) {
            position.maxHeight = Math.max(spaceAbove - margin * 2, 200);
        }
    }

    // Posizionamento orizzontale
    let alignLeft = true;
    
    if (preferredAlignment === 'left') {
        alignLeft = spaceRight >= margin;
    } else if (preferredAlignment === 'right') {
        alignLeft = spaceLeft < dropdownWidth + margin;
    } else if (preferredAlignment === 'center') {
        // Centra rispetto al trigger
        const centerX = triggerRect.left + triggerRect.width / 2;
        const dropdownLeft = centerX - dropdownWidth / 2;
        
        if (dropdownLeft >= margin && dropdownLeft + dropdownWidth <= viewportWidth - margin) {
            position.left = dropdownLeft + scrollX;
            return position;
        }
        // Se non può centrare, usa la logica auto
        alignLeft = spaceRight >= spaceLeft;
    } else {
        // Auto: scegli l'allineamento con più spazio
        alignLeft = spaceRight >= spaceLeft;
    }

    if (alignLeft) {
        // Allinea a sinistra del trigger
        position.left = triggerRect.left + scrollX;
        
        // Assicurati che non esca dal viewport
        if (position.left + dropdownWidth > viewportWidth - margin) {
            position.left = Math.max(margin, viewportWidth - dropdownWidth - margin) + scrollX;
        }
    } else {
        // Allinea a destra del trigger
        position.right = viewportWidth - triggerRect.right - scrollX;
        
        // Assicurati che non esca dal viewport
        if (position.right + dropdownWidth > viewportWidth - margin) {
            position.right = Math.max(margin, viewportWidth - dropdownWidth - margin) - scrollX;
        }
    }

    return position;
};

/**
 * Hook per gestire il riposizionamento automatico dei dropdown
 */
export const useDropdownPositioning = (
    isOpen: boolean,
    triggerRef: React.RefObject<HTMLElement>,
    options: PositioningOptions = {}
) => {
    const [position, setPosition] = React.useState<DropdownPosition>({});

    React.useEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const updatePosition = () => {
            if (triggerRef.current) {
                setPosition(calculateDropdownPosition(triggerRef.current, options));
            }
        };

        // Calcola posizione iniziale
        updatePosition();

        // Ricalcola su resize e scroll
        const handleResize = () => updatePosition();
        const handleScroll = () => updatePosition();

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true); // true per catturare tutti gli eventi di scroll

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen, triggerRef, JSON.stringify(options)]); // Usa JSON.stringify per evitare loop infiniti con oggetti options

    return position;
};

// Import React per il hook
import React from 'react';