'use client';

import { diffWords, diffChars, Change } from 'diff';

interface TextDiffProps {
    oldText: string;
    newText: string;
    mode?: 'words' | 'chars';
}

export default function TextDiff({ oldText, newText, mode = 'words' }: TextDiffProps) {
    const differences: Change[] = mode === 'words'
        ? diffWords(oldText, newText)
        : diffChars(oldText, newText);

    // If there are no differences, just return the text normally
    if (differences.length === 1 && !differences[0].added && !differences[0].removed) {
        return <span className="text-gray-900 dark:text-white whitespace-pre-line">{newText}</span>;
    }

    return (
        <div className="space-y-2">
            {/* Old version with removals highlighted */}
            <div className="bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">− Removed</div>
                <p className="text-red-700 dark:text-red-300 whitespace-pre-line">
                    {differences.map((part, index) => {
                        if (part.added) return null;
                        if (part.removed) {
                            return (
                                <span
                                    key={index}
                                    className="bg-red-200 dark:bg-red-800/50 line-through"
                                >
                                    {part.value}
                                </span>
                            );
                        }
                        return <span key={index}>{part.value}</span>;
                    })}
                </p>
            </div>

            {/* New version with additions highlighted */}
            <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">+ Added</div>
                <p className="text-green-700 dark:text-green-300 whitespace-pre-line">
                    {differences.map((part, index) => {
                        if (part.removed) return null;
                        if (part.added) {
                            return (
                                <span
                                    key={index}
                                    className="bg-green-200 dark:bg-green-800/50 font-semibold"
                                >
                                    {part.value}
                                </span>
                            );
                        }
                        return <span key={index}>{part.value}</span>;
                    })}
                </p>
            </div>
        </div>
    );
}
