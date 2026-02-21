"use client"

import React from "react"
import { Loader2 } from "lucide-react"

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading: boolean;
    children: React.ReactNode;
}

export function SubmitButton({ isLoading, children, className = "", ...props }: SubmitButtonProps) {
    return (
        <button
            {...props}
            disabled={isLoading || props.disabled}
            className={`relative w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
        >
            {isLoading && <Loader2 className="animate-spin h-5 w-5" />}
            {children}
        </button>
    )
}
