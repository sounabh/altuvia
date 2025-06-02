import React from 'react';
import { Users, Smile, Clock } from 'lucide-react';

const ImpactNumbers = () => {
  return (
    <div className='flex justify-center items-center mt-32  md:mt-18 lg:mt-56  px-4'>
      {/* Main Long Card */}
      <div className='w-full max-w-sm sm:max-w-md md:max-w-lg bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl border-4 sm:border-6 md:border-8 border-black shadow-[8px_8px_20px_0px_rgba(0,0,0,0.3)] sm:shadow-[10px_10px_25px_0px_rgba(0,0,0,0.35)] lg:shadow-[12px_12px_30px_0px_rgba(0,0,0,0.4)] hover:shadow-[10px_10px_25px_0px_rgba(0,0,0,0.4)] sm:hover:shadow-[14px_14px_35px_0px_rgba(0,0,0,0.45)] lg:hover:shadow-[16px_16px_40px_0px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out relative overflow-hidden group'>
        <div className='absolute inset-2 sm:inset-3 bg-white rounded-xl sm:rounded-2xl border border-gray-100 sm:border-2'></div>
                  
        <div className='relative p-6 sm:p-8 md:p-10 lg:p-12 z-10'>
          {/* Header */}
          <div className='text-center mb-8 sm:mb-10 lg:mb-12'>
            <h2 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-2 sm:mb-3 lg:mb-4 tracking-tight'>By the Numbers</h2>
            <p className='text-base sm:text-lg lg:text-xl text-gray-600 font-medium'>Our impact on future students.</p>
          </div>
                      
          {/* Three Stat Boxes */}
          <div className='flex flex-col gap-4 sm:gap-6 lg:gap-8'>
            {/* Stat 1 */}
            <div className='bg-white rounded-xl sm:rounded-2xl border-3 sm:border-4 md:border-6 border-black p-4 sm:p-6 lg:p-8 text-center transform hover:scale-102 transition-all duration-300 group/stat shadow-md sm:shadow-lg relative'>
              <div className='absolute inset-1 sm:inset-2 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200'></div>
              <div className='relative z-10 flex flex-col items-center justify-center'>
                <Users className='w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#1a1a1a] mb-2 sm:mb-3 lg:mb-4' />
                <div className='text-2xl sm:text-3xl lg:text-4xl font-bold text-black group-hover/stat:text-[#1a1a1a] transition-colors duration-300 mb-2 sm:mb-3'>50K+</div>
                <hr className='w-8 sm:w-10 border-t border-gray-300 mb-2 sm:mb-3' />
                <p className='text-gray-700 text-sm sm:text-base leading-relaxed group-hover/stat:text-[#1a1a1a] transition-colors duration-300'>
                  Applications managed through Altuvia.
                </p>
              </div>
            </div>
                          
            {/* Stat 2 */}
            <div className='bg-white rounded-xl sm:rounded-2xl border-3 sm:border-4 md:border-6 border-black p-4 sm:p-6 lg:p-8 text-center transform hover:scale-102 transition-all duration-300 group/stat shadow-md sm:shadow-lg relative'>
              <div className='absolute inset-1 sm:inset-2 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200'></div>
              <div className='relative z-10 flex flex-col items-center justify-center'>
                <Smile className='w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#1a1a1a]mb-2 sm:mb-3 lg:mb-4' />
                <div className='text-2xl sm:text-3xl lg:text-4xl font-bold text-black group-hover/stat:text-[#1a1a1a] transition-colors duration-300 mb-2 sm:mb-3'>95%</div>
                <hr className='w-8 sm:w-10 border-t border-gray-300 mb-2 sm:mb-3' />
                <p className='text-gray-700 text-sm sm:text-base leading-relaxed group-hover/stat:text-[#1a1a1a] transition-colors duration-300'>
                  Applicants report reduced stress.
                </p>
              </div>
            </div>
                          
            {/* Stat 3 */}
            <div className='bg-white rounded-xl sm:rounded-2xl border-3 sm:border-4 md:border-6 border-black p-4 sm:p-6 lg:p-8 text-center transform hover:scale-102 transition-all duration-300 group/stat shadow-md sm:shadow-lg relative'>
              <div className='absolute inset-1 sm:inset-2 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200'></div>
              <div className='relative z-10 flex flex-col items-center justify-center'>
                <Clock className='w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#1a1a1a] mb-2 sm:mb-3 lg:mb-4' />
                <div className='text-2xl sm:text-3xl lg:text-4xl font-bold text-black group-hover/stat:text-[#1a1a1a] transition-colors duration-300 mb-2 sm:mb-3'>7+</div>
                <hr className='w-8 sm:w-10 border-t border-gray-300 mb-2 sm:mb-3' />
                <p className='text-gray-700 text-sm sm:text-base leading-relaxed group-hover/stat:text-[#1a1a1a] transition-colors duration-300'>
                  Years of combined experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactNumbers;