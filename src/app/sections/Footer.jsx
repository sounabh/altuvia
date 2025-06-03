export default function AltuviaFooter() {   
  return (     
    <footer className="bg-white border-t border-gray-100">       
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-8 sm:pb-12">         
        {/* Main Footer Content */}         
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 lg:gap-16 mb-8 sm:mb-12">           
          {/* Brand Section */}           
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 text-center sm:text-left">             
            <div className="mb-4">           
              <span className="font-inter font-semibold tracking-[-1.7px] leading-[28.8px] text-xl sm:text-[22px] text-[#1a1a1a]">             
                Altuvia           
              </span>             
            </div>             
            <p className="text-[#404245] text-sm sm:text-base font-inter font-normal leading-6 sm:leading-[27px] max-w-xs mx-auto sm:mx-0">               
              Your partner in simplifying the admissions process.             
            </p>           
          </div>              
          
          {/* Quick Links */}           
          <div className="col-span-1 text-center sm:text-left">             
            <h3 className="text-[#1a1a1a] font-medium font-inter text-base sm:text-lg mb-3 sm:mb-4">
              Quick Links
            </h3>             
            <ul className="space-y-2 sm:space-y-3">               
              <li>                 
                <a href="#" className="text-[#0088FF] hover:text-[#6595dd] text-sm sm:text-base transition-colors font-inter font-normal inline-block sm:block py-1">                   
                  Home                 
                </a>               
              </li>               
              <li>                 
                <a href="#" className="text-[#0088FF] hover:text-[#6595dd] text-sm sm:text-base transition-colors font-inter font-normal inline-block sm:block py-1">                   
                  Features                 
                </a>               
              </li>               
              <li>                 
                <a href="#" className="text-[#0088FF] hover:text-[#6595dd] text-sm sm:text-base transition-colors font-inter font-normal inline-block sm:block py-1">                   
                  Pricing                 
                </a>               
              </li>             
            </ul>           
          </div>            
          
          {/* Support */}           
          <div className="col-span-1 text-center sm:text-left">             
            <h3 className="text-[#1a1a1a] font-medium font-inter text-base sm:text-lg mb-3 sm:mb-4">
              Support
            </h3>             
            <ul className="space-y-2 sm:space-y-3">               
              <li>                 
                <a href="#" className="text-[#0088FF] hover:text-[#6595dd] text-sm sm:text-base transition-colors font-inter font-normal inline-block sm:block py-1">                   
                  FAQs                 
                </a>               
              </li>               
              <li>                 
                <a href="#" className="text-[#0088FF] hover:text-[#6595dd] text-sm sm:text-base transition-colors font-inter font-normal inline-block sm:block py-1">                   
                  Contact Us                 
                </a>               
              </li>               
              <li>                 
                <span className="text-[#404245] text-sm sm:text-base font-inter font-normal inline-block sm:block py-1 cursor-pointer hover:text-[#6595dd] transition-colors">                   
                  Privacy Policy                 
                </span>               
              </li>             
            </ul>           
          </div>            
          
          {/* Connect with Us */}           
          <div className="col-span-1 text-center sm:text-left">             
            <h3 className="text-[#1a1a1a] font-medium font-inter text-base sm:text-lg mb-3 sm:mb-4">
              Connect with Us
            </h3>             
            <ul className="space-y-2 sm:space-y-3">               
              <li>                 
                <a href="#" className="text-[#404245] hover:text-[#0088FF] text-sm sm:text-base font-normal font-inter inline-block sm:block py-1 transition-colors">                   
                  LinkedIn                 
                </a>               
              </li>               
              <li>                 
                <a href="#" className="text-[#404245] hover:text-[#0088FF] text-sm sm:text-base font-normal font-inter inline-block sm:block py-1 transition-colors">                   
                  Twitter                 
                </a>               
              </li>               
              <li>                 
                <a href="#" className="text-[#404245] hover:text-[#0088FF] text-sm sm:text-base font-normal font-inter inline-block sm:block py-1 transition-colors">                   
                  Facebook                 
                </a>               
              </li>             
            </ul>           
          </div>         
        </div>            
        
        {/* Bottom Section */}         
        <div className="flex flex-col sm:flex-row justify-center items-center pt-6 sm:pt-8 border-t border-gray-300/60">           
          <div className="text-[#404245] text-sm sm:text-base leading-6 sm:leading-[27px] font-normal text-center">             
            © 2025. All rights reserved           
          </div>                    
        </div>       
      </div>     
    </footer>   
  ); 
}