import React from 'react';

interface CircuitVisualizationProps {
  lightIntensity: number;
  resistance: number;
}

export const CircuitVisualization: React.FC<CircuitVisualizationProps> = ({
  lightIntensity,
  resistance,
}) => {
  // Calculate brightness based on light intensity
  const brightness = Math.min(100, Math.max(20, lightIntensity));

  // Calculate the LDR color based on resistance (darker = higher resistance)
  const resistanceColor = `rgb(${Math.floor(255 - (resistance / 100) * 255)}, ${Math.floor(255 - (resistance / 100) * 255)}, 255)`;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-64 h-64">
        {/* Circuit board background */}
        <div className="absolute inset-0 bg-green-100 rounded-md"></div>

        {/* Battery */}
        <div className="absolute top-12 left-4 w-8 h-16 bg-gray-300 border border-gray-500 rounded-sm flex flex-col">
          <div className="h-2 w-full bg-red-500"></div>
          <div className="flex-1"></div>
          <div className="h-2 w-full bg-black"></div>
        </div>

        {/* Light source */}
        <div className="absolute top-10 right-16 w-12 h-12 rounded-full flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full bg-yellow-300 flex items-center justify-center"
            style={{
              boxShadow: `0 0 ${brightness / 4}px ${brightness / 10}px rgba(255, 255, 0, 0.8)`,
              opacity: brightness / 100,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
              />
            </svg>
          </div>
        </div>

        {/* LDR component */}
        <div
          className="absolute bottom-16 right-16 w-16 h-8 rounded-md flex items-center justify-center"
          style={{ backgroundColor: resistanceColor, transition: 'background-color 0.5s ease' }}
        >
          <div className="text-xs font-bold text-gray-800">LDR</div>
        </div>

        {/* Voltmeter */}
        <div className="absolute bottom-10 left-10 w-14 h-14 bg-white border-2 border-gray-700 rounded-full flex items-center justify-center">
          <div className="w-12 h-12 bg-white border border-gray-400 rounded-full flex items-center justify-center">
            <div className="text-xs font-semibold text-gray-800">V</div>
          </div>
        </div>

        {/* Wires */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Battery to Resistor */}
          <path d="M12 20 L12 40 L48 40" stroke="red" strokeWidth="2" fill="none" />
          <path d="M8 28 L8 48 L48 48" stroke="black" strokeWidth="2" fill="none" />

          {/* Resistor to Meter */}
          <path d="M48 40 L80 40 L80 28" stroke="red" strokeWidth="2" fill="none" />
          <path d="M48 48 L90 48 L90 28" stroke="black" strokeWidth="2" fill="none" />
        </svg>
      </div>
    </div>
  );
};
