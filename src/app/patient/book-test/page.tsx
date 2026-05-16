import { BookingProvider } from "@/components/booking/BookingContext"
import { BookingWizard } from "@/components/booking/BookingWizard"

export default function BookTestPage() {
    return (
        <BookingProvider>
            <BookingWizard />
        </BookingProvider>
    )
}
