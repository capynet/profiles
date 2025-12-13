// components/PaymentMethodSelector.tsx
'use client';

import useSWR from 'swr';
import { useTranslations } from 'next-intl';

interface PaymentMethod {
    id: number;
    name: string;
}

interface PaymentMethodSelectorProps {
    selectedPaymentMethods: number[];
    onChange: (paymentMethodIds: number[]) => void;
    error?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PaymentMethodSelector({
                                                  selectedPaymentMethods,
                                                  onChange,
                                                  error
                                              }: PaymentMethodSelectorProps) {
    const t = useTranslations('PaymentMethodSelector');

    const { data: paymentMethods = [], error: loadError, isLoading, mutate } = useSWR<PaymentMethod[]>(
        '/api/payment-methods',
        fetcher,
        {
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 10000,
        }
    );

    // Handle payment method selection/deselection
    const handlePaymentMethodChange = (paymentMethodId: number) => {
        const newSelectedPaymentMethods = selectedPaymentMethods.includes(paymentMethodId)
            ? selectedPaymentMethods.filter(id => id !== paymentMethodId)
            : [...selectedPaymentMethods, paymentMethodId];

        onChange(newSelectedPaymentMethods);
    };

    // CSS classes
    const checkboxClassName = "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded";

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('title')}
                </label>
                <button
                    type="button"
                    onClick={() => mutate()}
                    disabled={isLoading}
                    className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                    title="Refresh list"
                >
                    {isLoading ? '⟳' : '↻'} Refresh
                </button>
            </div>

            {isLoading && paymentMethods.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                    {t('loading')}
                </div>
            ) : loadError ? (
                <div className="p-3 text-sm text-red-500 dark:text-red-400">
                    {t('failedToLoad')}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                    {paymentMethods.length > 0 ? (
                        paymentMethods.map(method => (
                            <div key={method.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`payment-method-${method.id}`}
                                    checked={selectedPaymentMethods.includes(method.id)}
                                    onChange={() => handlePaymentMethodChange(method.id)}
                                    className={checkboxClassName}
                                />
                                <label
                                    htmlFor={`payment-method-${method.id}`}
                                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    {method.name}
                                </label>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 col-span-2 py-2">
                            {t('noPaymentMethods')}
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>
            )}

            {selectedPaymentMethods.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t('selected', { count: selectedPaymentMethods.length })}
                    </span>
                </div>
            )}
        </div>
    );
}