'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Service {
  id: number;
  name: string;
}

interface ServiceSelectorProps {
  selectedServices: number[];
  onChange: (selectedServices: number[]) => void;
  error?: string;
}

export default function ServiceSelector({ selectedServices, onChange, error }: ServiceSelectorProps) {
  const t = useTranslations('ServiceSelector');
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch services on component mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [t]);

  // Handle service selection
  const handleServiceChange = (serviceId: number) => {
    if (selectedServices.includes(serviceId)) {
      onChange(selectedServices.filter(id => id !== serviceId));
    } else {
      onChange([...selectedServices, serviceId]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('title')}
        </label>
        <div className="mt-1 h-10 w-full bg-gray-100 dark:bg-gray-700 animate-pulse rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('title')}
      </label>
      <div className="mt-1 space-y-2">
        {services.map(service => (
          <div key={service.id} className="flex items-center">
            <input
              type="checkbox"
              id={`service-${service.id}`}
              checked={selectedServices.includes(service.id)}
              onChange={() => handleServiceChange(service.id)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor={`service-${service.id}`}
              className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
            >
              {service.name}
            </label>
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('noServices')}</p>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>}
    </div>
  );
}