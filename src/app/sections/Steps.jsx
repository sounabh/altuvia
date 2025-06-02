import React from 'react'
import { ArrowRight, User, FolderOpen } from 'lucide-react'

const Steps = () => {
  return (
    <div className='flex justify-center items-center flex-col gap-[14px] text-center mt-20 sm:mt-32 md:mt-28 lg:mt-48 mb-20 px-4'>

      <h1 className="font-inter tracking-[-1px] sm:tracking-[-1.5px] md:tracking-[-1.7px] lg:tracking-[-1.9px] leading-[35px] sm:leading-[42px] md:leading-[50px] lg:leading-[57px] text-[28px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-semibold w-full ">
        <span className="block">Streamline Your</span>
        <span className="block">Application Process</span>
      </h1>
             
      <p className="font-inter leading-[24px] sm:leading-[26px] md:leading-[28px] lg:leading-[30px] text-[#404245] font-normal text-base sm:text-lg max-w-xl sm:max-w-2xl w-full px-4 mx-auto text-center">
        <span className="block">Follow these simple steps to maximize your application success.</span>
      </p>
             
      <div className='flex flex-col lg:flex-row items-center gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8 w-full lg:ml-52 max-w-6xl'>
        {/* Step 1 Card */}
        <div className='w-full max-w-[280px] sm:max-w-[350px] lg:w-[400px] h-[300px] sm:h-[380px] lg:h-[450px] bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 sm:border-2 lg:border-4 border-black shadow-[4px_4px_12px_0px_rgba(0,0,0,0.2)] sm:shadow-[6px_6px_15px_0px_rgba(0,0,0,0.25)] lg:shadow-[8px_8px_20px_0px_rgba(0,0,0,0.3)] transform rotate-1 sm:rotate-2 lg:rotate-3 hover:-rotate-1 transition-all duration-500 ease-out hover:shadow-[6px_6px_20px_0px_rgba(0,0,0,0.3)] sm:hover:shadow-[8px_8px_25px_0px_rgba(0,0,0,0.35)] lg:hover:shadow-[12px_12px_30px_0px_rgba(0,0,0,0.4)] group relative overflow-hidden'>
          <div className='absolute inset-1 sm:inset-1 lg:inset-2 bg-white rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-100'></div>
          <div className='relative p-3 sm:p-4 lg:p-8 h-full flex flex-col justify-between z-10'>
            <div className='flex-1 flex items-center justify-center'>
              <div className='w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-[#1a1a1a]  rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg'>
                <User size={20} className="sm:w-8 sm:h-8 lg:w-12 lg:h-12 text-white drop-shadow-sm" />
              </div>
            </div>
                         
            <div className='text-left'>
              <h3 className='text-base sm:text-lg lg:text-2xl font-bold mb-1 sm:mb-2 lg:mb-4 text-black'>Step 1: Set Up Your Profile</h3>
              <p className='text-gray-600 text-xs sm:text-sm lg:text-lg leading-relaxed'>
                Create a personalized profile and connect your applications.
              </p>
            </div>
          </div>
        </div>
                 
        {/* Arrow */}
        <div className='flex-shrink-0 rotate-90 lg:rotate-0'>
          <div className='w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300'>
            <ArrowRight size={16} className="sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-white transform hover:translate-x-1 lg:hover:translate-y-0 hover:translate-y-1 lg:hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
                 
        {/* Step 2 Card */}
        <div className='w-full max-w-[280px] sm:max-w-[350px] lg:w-[400px] h-[300px] sm:h-[380px] lg:h-[450px] bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 sm:border-2 lg:border-4 border-black shadow-[4px_4px_12px_0px_rgba(0,0,0,0.2)] sm:shadow-[6px_6px_15px_0px_rgba(0,0,0,0.25)] lg:shadow-[8px_8px_20px_0px_rgba(0,0,0,0.3)] transform -rotate-1 sm:-rotate-2 lg:-rotate-3 hover:rotate-1 transition-all duration-500 ease-out hover:shadow-[6px_6px_20px_0px_rgba(0,0,0,0.3)] sm:hover:shadow-[8px_8px_25px_0px_rgba(0,0,0,0.35)] lg:hover:shadow-[12px_12px_30px_0px_rgba(0,0,0,0.4)] group relative overflow-hidden'>
          <div className='absolute inset-1 sm:inset-1 lg:inset-2 bg-white rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-100'></div>
          <div className='relative p-3 sm:p-4 lg:p-8 h-full flex flex-col justify-between z-10'>
            <div className='flex-1 flex items-center justify-center'>
              <div className='w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-[#1a1a1a] rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 shadow-lg'>
                <FolderOpen size={20} className="sm:w-8 sm:h-8 lg:w-12 lg:h-12 text-white drop-shadow-sm" />
              </div>
            </div>
                         
            <div className='text-left'>
              <h3 className='text-base sm:text-lg lg:text-2xl font-bold mb-1 sm:mb-2 lg:mb-4 text-black'>Step 2: Organize Your Applications</h3>
              <p className='text-gray-600 text-xs sm:text-sm lg:text-lg leading-relaxed'>
                Sync deadlines, documents, and resources in one intuitive workspace.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Steps