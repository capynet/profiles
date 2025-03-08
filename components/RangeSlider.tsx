// components/RangeSlider.tsx
'use client';

import { useState, useEffect } from 'react';

interface RangeSliderProps {
    min: number;
    max: number;
    step: number;
    minValue: string | number;
    maxValue: string | number;
    onMinChange: (value: string) => void;
    onMaxChange: (value: string) => void;
    label: string;
    showInputs?: boolean;
}

export default function RangeSlider({
                                        min,
                                        max,
                                        step,
                                        minValue,
                                        maxValue,
                                        onMinChange,
                                        onMaxChange,
                                        label,
                                        showInputs = true
                                    }: RangeSliderProps) {
    // Convert to numbers for calculations
    const minVal = minValue === '' ? min : Number(minValue);
    const maxVal = maxValue === '' ? max : Number(maxValue);

    // Track for slider position calculation
    const [minPercent, setMinPercent] = useState(((minVal - min) / (max - min)) * 100);
    const [maxPercent, setMaxPercent] = useState(((maxVal - min) / (max - min)) * 100);

    // Update position indicators when values change
    useEffect(() => {
        const minValuePercent = ((minVal - min) / (max - min)) * 100;
        setMinPercent(minValuePercent);

        const maxValuePercent = ((maxVal - min) / (max - min)) * 100;
        setMaxPercent(maxValuePercent);
    }, [minVal, maxVal, min, max]);

    return (
        <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                {showInputs && (
                    <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>{minVal}</span>
                        <span>-</span>
                        <span>{maxVal}</span>
                    </div>
                )}
            </div>

            {/* Single slider approach - more reliable */}
            <div className="py-4">
                <div className="relative">
                    {/* Track background */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>

                    {/* Selected range */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded"
                        style={{
                            left: `${minPercent}%`,
                            right: `${100 - maxPercent}%`
                        }}
                    ></div>

                    {/* Slider thumbs */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full cursor-pointer"
                        style={{ left: `calc(${minPercent}% - 8px)` }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            const startX = e.clientX;
                            const startLeft = minPercent;
                            // Get the parent element's width at the start of dragging
                            const sliderWidth = e.currentTarget.parentElement?.offsetWidth || 1;

                            const handleMouseMove = (e: MouseEvent) => {
                                const newX = e.clientX;
                                const diff = ((newX - startX) / sliderWidth) * 100;
                                const newLeft = Math.min(Math.max(startLeft + diff, 0), maxPercent - 5);
                                const newValue = Math.min(Math.round((newLeft / 100) * (max - min) / step) * step + min, maxVal - step);
                                onMinChange(newValue.toString());
                            };

                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            const startX = e.touches[0].clientX;
                            const startLeft = minPercent;
                            // Get the parent element's width at the start of dragging
                            const sliderWidth = e.currentTarget.parentElement?.offsetWidth || 1;

                            const handleTouchMove = (e: TouchEvent) => {
                                const newX = e.touches[0].clientX;
                                const diff = ((newX - startX) / sliderWidth) * 100;
                                const newLeft = Math.min(Math.max(startLeft + diff, 0), maxPercent - 5);
                                const newValue = Math.min(Math.round((newLeft / 100) * (max - min) / step) * step + min, maxVal - step);
                                onMinChange(newValue.toString());
                            };

                            const handleTouchEnd = () => {
                                document.removeEventListener('touchmove', handleTouchMove);
                                document.removeEventListener('touchend', handleTouchEnd);
                            };

                            document.addEventListener('touchmove', handleTouchMove);
                            document.addEventListener('touchend', handleTouchEnd);
                        }}
                    />

                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full cursor-pointer"
                        style={{ left: `calc(${maxPercent}% - 8px)` }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            const startX = e.clientX;
                            const startLeft = maxPercent;
                            // Get the parent element's width at the start of dragging
                            const sliderWidth = e.currentTarget.parentElement?.offsetWidth || 1;

                            const handleMouseMove = (e: MouseEvent) => {
                                const newX = e.clientX;
                                const diff = ((newX - startX) / sliderWidth) * 100;
                                const newLeft = Math.max(Math.min(startLeft + diff, 100), minPercent + 5);
                                const newValue = Math.max(Math.round((newLeft / 100) * (max - min) / step) * step + min, minVal + step);
                                onMaxChange(newValue.toString());
                            };

                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            const startX = e.touches[0].clientX;
                            const startLeft = maxPercent;
                            // Get the parent element's width at the start of dragging
                            const sliderWidth = e.currentTarget.parentElement?.offsetWidth || 1;

                            const handleTouchMove = (e: TouchEvent) => {
                                const newX = e.touches[0].clientX;
                                const diff = ((newX - startX) / sliderWidth) * 100;
                                const newLeft = Math.max(Math.min(startLeft + diff, 100), minPercent + 5);
                                const newValue = Math.max(Math.round((newLeft / 100) * (max - min) / step) * step + min, minVal + step);
                                onMaxChange(newValue.toString());
                            };

                            const handleTouchEnd = () => {
                                document.removeEventListener('touchmove', handleTouchMove);
                                document.removeEventListener('touchend', handleTouchEnd);
                            };

                            document.addEventListener('touchmove', handleTouchMove);
                            document.addEventListener('touchend', handleTouchEnd);
                        }}
                    />
                </div>
            </div>

            {showInputs && (
                <div className="flex mt-2 space-x-2">
                    <div className="w-1/2">
                        <input
                            type="number"
                            placeholder="Min"
                            value={minValue}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                if (newValue === '' || Number(newValue) < maxVal) {
                                    onMinChange(newValue);
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                    </div>
                    <div className="w-1/2">
                        <input
                            type="number"
                            placeholder="Max"
                            value={maxValue}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                if (newValue === '' || Number(newValue) > minVal) {
                                    onMaxChange(newValue);
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}