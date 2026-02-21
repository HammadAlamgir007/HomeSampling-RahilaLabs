"use client"

import React, { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    showStrengthMeter?: boolean;
}

export function PasswordInput({ showStrengthMeter = false, className = "", ...props }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false)
    const value = (props.value as string) || ""

    const calculateStrength = (pwd: string) => {
        let score = 0
        if (pwd.length >= 8) score += 1
        if (/[A-Z]/.test(pwd)) score += 1
        if (/[a-z]/.test(pwd)) score += 1
        if (/[0-9]/.test(pwd)) score += 1
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1
        return score
    }

    const strength = calculateStrength(value)
    const strengthColors = ["bg-gray-200 dark:bg-slate-700", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"]
    const strengthLabels = ["Too short", "Very Weak", "Weak", "Fair", "Good", "Strong"]

    return (
        <div className="w-full space-y-2">
            <div className="relative">
                <input
                    {...props}
                    type={showPassword ? "text" : "password"}
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10 ${className}`}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    tabIndex={-1}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>

            {showStrengthMeter && value.length > 0 && (
                <div className="space-y-1">
                    <div className="flex gap-1 h-1.5 mt-2">
                        {[1, 2, 3, 4, 5].map((level) => (
                            <div
                                key={level}
                                className={`flex-1 rounded-full transition-colors duration-300 ${strength >= level ? strengthColors[strength] : "bg-gray-200 dark:bg-slate-700"
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 text-right">
                        {strengthLabels[strength]}
                    </p>
                </div>
            )}
        </div>
    )
}
