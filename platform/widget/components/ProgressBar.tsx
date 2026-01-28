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
    <div className="px-6 py-8 bg-surface transition-colors duration-300">
      <div className="flex justify-between items-center relative max-w-sm mx-auto">
        {/* Progress Line Background - Ultra thin */}
        <div className="absolute top-4 left-0 w-full h-[1px] bg-gray-200 -z-10"></div>

        {/* Active Progress Line */}
        <div
          className="absolute top-4 left-0 h-[1px] bg-secondary -z-10 transition-all duration-500 ease-in-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => (
          <div key={step.num} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center text-lg font-serif font-bold transition-all duration-500 ${currentStep >= step.num
                ? 'bg-secondary text-surface scale-110 shadow-lg' // Active: Olive bg, Cream text
                : 'bg-surface text-gray-300 border border-gray-200' // Inactive: Cream bg, Gray text
                } rounded-full z-10`}
            >
              {currentStep > step.num ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.num
              )}
            </div>
            <span
              className={`text-[10px] mt-2 font-bold uppercase tracking-widest transition-colors duration-300 ${currentStep >= step.num ? 'text-secondary' : 'text-gray-300'
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