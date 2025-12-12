'use client';

import { useTranslations } from 'next-intl';

export default function Footer() {
    const t = useTranslations('Footer');
    
    return (
        <footer className="py-4 px-4 bg-card border-t border-border">
            <div className="container mx-auto text-center text-sm text-muted-foreground">
                {t('copyright')}
            </div>
        </footer>
    );
}