// components/Footer.tsx
'use client';
export default function Footer() {
    return (
        <footer className="py-4 px-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} Profiles App. Todos los derechos reservados.
            </div>
        </footer>
    );
}