export function BookingStepper({ currentStep }: { currentStep: number }) {
  const steps = ["Select Test", "Address", "Date & Time", "Confirm"]

  return (
    <div className="w-full">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 ${
                  index < currentStep ? "bg-green-500" : index === currentStep ? "bg-blue-900" : "bg-gray-300"
                }`}
              >
                {index < currentStep ? "✓" : index + 1}
              </div>
              <p className="text-sm text-center text-gray-700">{step}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 ${index < currentStep - 1 ? "bg-green-500" : "bg-gray-300"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BookingStepper
