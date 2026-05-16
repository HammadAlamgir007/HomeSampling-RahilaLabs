"use client"

import React from "react"

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    onChange: (value: string) => void;
}

export function PhoneInput({ className = "", onChange, value, ...props }: PhoneInputProps) {

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, "")
        // Optional basic auto-formatting for display like 0300 1234567
        // For pure numeric storage, we just emit the digits.
        onChange(val)
    }

    // Formatting for display
    const displayValue = () => {
        const valStr = (value as string) || ""
        if (valStr.length > 4) {
            return `${valStr.slice(0, 4)} ${valStr.slice(4)}`
        }
        return valStr
    }

    return (
        <input
            {...props}
            type="tel"
            inputMode="numeric"
            maxLength={12} // 11 digits + 1 space
            value={displayValue()}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${className}`}
        />
    )
}
