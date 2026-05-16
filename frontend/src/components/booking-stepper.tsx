import { Check } from "lucide-react"

export function BookingStepper({ currentStep }: { currentStep: number }) {
  const steps = ["Select Test", "Address", "Date & Time", "Confirm"]

  return (
    <div className="w-full py-4">
      <div className="flex items-start justify-between relative">
        {/* Background connector track */}
        <div className="absolute top-5 left-[calc(12.5%)] right-[calc(12.5%)] h-0.5 bg-white/20 rounded-full" />

        {/* Completed connector */}
        <div
          className="absolute top-5 left-[calc(12.5%)] h-0.5 bg-green-400 rounded-full transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 75}%`,
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep - 1
          const isCurrent = index === currentStep - 1

          return (
            <div key={step} className="flex-1 flex flex-col items-center relative z-10">
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                  isCompleted
                    ? "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/30"
                    : isCurrent
                    ? "bg-white border-white text-blue-900 shadow-xl shadow-white/30 scale-110"
                    : "bg-transparent border-white/30 text-white/40"
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" strokeWidth={3} /> : index + 1}
              </div>

              {/* Label */}
              <p
                className={`text-xs text-center font-semibold mt-2.5 whitespace-nowrap transition-colors duration-300 ${
                  isCurrent
                    ? "text-white drop-shadow-sm"
                    : isCompleted
                    ? "text-green-300"
                    : "text-white/40"
                }`}
              >
                {step}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BookingStepper
