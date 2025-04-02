// components/PaymentMethodSelector.tsx
'use client';

import { useState, useEffect } from 'react';

interface PaymentMethod {
    id: number;
    name: string;
}

interface PaymentMethodSelectorProps {
    selectedPaymentMethods: number[];
    onChange: (paymentMethodIds: number[]) => void;
    error?: string;
}

export default function PaymentMethodSelector({
                                                  selectedPaymentMethods,
                                                  onChange,
                                                  error
                                              }: PaymentMethodSelectorProps) {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Fetch payment methods on component mount
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                const response = await fetch('/api/payment-methods');

                if (!response.ok) {
                    throw new Error('Failed to fetch payment methods');
                }

                const data = await response.json();
                setPaymentMethods(data);
            } catch (error) {
                console.error('Error fetching payment methods:', error);
                setLoadError('Failed to load payment methods. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPaymentMethods();
    }, []);

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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Methods
            </label>

            {isLoading ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                    Loading payment methods...
                </div>
            ) : loadError ? (
                <div className="p-3 text-sm text-red-500 dark:text-red-400">
                    {loadError}
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
                            No payment methods available
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>
            )}

            {selectedPaymentMethods.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {selectedPaymentMethods.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedPaymentMethods.length} payment method(s) selected
            </span>
                    )}
                </div>
            )}
        </div>
    );
}