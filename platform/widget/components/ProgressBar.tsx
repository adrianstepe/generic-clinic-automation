import React from 'react';
import { Language } from '../types';
import { useTexts } from '../hooks/useConfig';

interface ProgressBarProps {
  currentStep: number;
  language: Language;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, language }) => {
  const texts = useTexts();

  const steps = [
    { num: 1, label: texts.stepService[language] },
    { num: 2, label: texts.stepDate[language] },
    { num: 3, label: texts.stepDetails[language] },
    { num: 4, label: texts.stepPayment[language] },
  ];

  return (
    <div className="px-4 py-6 bg-white dark:bg-slate-800 transition-colors duration-300">
      <div className="flex justify-between items-center relative">
        {/* Progress Line Background */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-slate-700 -z-10 rounded-full"></div>

        {/* Active Progress Line */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => (
          <div key={step.num} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${currentStep >= step.num
                ? 'bg-primary text-white ring-4 ring-teal-50 dark:ring-teal-900/30'
                : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-600 border-2 border-gray-200 dark:border-slate-700'
                }`}
            >
              {currentStep > step.num ? '✓' : step.num}
            </div>
            <span
              className={`text-xs mt-2 font-medium hidden sm:block ${currentStep >= step.num ? 'text-primary dark:text-teal-400' : 'text-gray-400 dark:text-slate-600'
                }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;