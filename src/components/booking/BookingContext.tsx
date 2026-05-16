"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';

type AddressData = {
    house: string;
    street: string;
    area: string;
    city: string;
    state: string;
    zipCode: string;
};

type ScheduleData = {
    date: string;
    time: string;
};

type BookingContextType = {
    step: number;
    setStep: (step: number) => void;
    selectedTests: string[];
    setSelectedTests: (tests: string[]) => void;
    address: AddressData;
    setAddress: (address: AddressData) => void;
    schedule: ScheduleData;
    setSchedule: (schedule: ScheduleData) => void;
    notes: string;
    setNotes: (notes: string) => void;
    idempotencyKey: string;
};

const defaultAddress = { house: "", street: "", area: "", city: "", state: "", zipCode: "" };
const defaultSchedule = { date: '', time: '' };

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
    const [step, setStep] = useState(1);
    const [selectedTests, setSelectedTests] = useState<string[]>([]);
    const [address, setAddress] = useState<AddressData>(defaultAddress);
    const [schedule, setSchedule] = useState<ScheduleData>(defaultSchedule);
    const [notes, setNotes] = useState("");
    const [idempotencyKey, setIdempotencyKey] = useState("");

    // Generate idempotency key on mount
    useEffect(() => {
        setIdempotencyKey(crypto.randomUUID());
    }, []);

    // Load from local storage for persistence (optional future feature)
    useEffect(() => {
        const saved = localStorage.getItem('bookingDraft');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // restore logic here
            } catch (e) {}
        }
    }, []);

    return (
        <BookingContext.Provider value={{
            step, setStep,
            selectedTests, setSelectedTests,
            address, setAddress,
            schedule, setSchedule,
            notes, setNotes,
            idempotencyKey
        }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBookingContext() {
    const context = useContext(BookingContext);
    if (context === undefined) {
        throw new Error('useBookingContext must be used within a BookingProvider');
    }
    return context;
}
