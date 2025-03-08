'use client';

import {useEffect, useState} from "react";

export default function Footer() {
    const [year, setYear] = useState('');

    useEffect(() => {
        setYear(new Date().getFullYear().toString());
    }, []);

    return (
        <footer className="py-4 px-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
                &copy; {year || '2025'} Profiles App. Todos los derechos reservados.
            </div>
        </footer>
    );
}