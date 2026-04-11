export function BookingStepper({ currentStep }: { currentStep: number }) {
  const steps = ["Select Test", "Address", "Date & Time", "Confirm"]

  return (
    <div className="w-full pb-6">
      <div className="flex justify-between relative">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep - 1;
          const isCurrent = index === currentStep - 1;
          
          return (
            <div key={step} className="flex-1 flex flex-col items-center relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div 
                  className={`absolute top-5 left-[50%] w-full h-1 transition-colors duration-300 ${
                    isCompleted ? "bg-green-500" : "bg-blue-800/40"
                  }`} 
                  style={{ zIndex: 0 }}
                />
              )}

              {/* Circle */}
              <div
                style={{ zIndex: 10 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-white text-blue-900 shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-110"
                    : "bg-blue-800/40 text-blue-200/60"
                }`}
              >
                {isCompleted ? "✓" : index + 1}
              </div>

              {/* Text */}
              <p className={`text-sm text-center font-medium mt-2 whitespace-nowrap transition-colors duration-300 ${
                isCurrent ? "text-white drop-shadow-md" : isCompleted ? "text-blue-100" : "text-blue-200/50"
              }`}>
                {step}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  )
}

export default BookingStepper
