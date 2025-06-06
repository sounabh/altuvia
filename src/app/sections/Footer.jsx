export default function AltuviaFooter() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 ">
        
        {/* ========================== */}
        {/* Main Footer Grid Container */}
        {/* ========================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 lg:gap-16 mb-8 sm:mb-12">
          
          {/* ================== */}
          {/* Brand / Logo Block */}
          {/* ================== */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 text-center sm:text-left">
            
            {/* Logo / Brand Name */}
            <div className="mb-4">
              <span className="font-serif font-semibold tracking-[-0.1px] leading-[28.8px] text-[22px] text-[#002147]">
                Altu<span className="text-[#3598FE]">via</span>
              </span>
            </div>

            {/* Brand Description */}
            <p className="text-[#6C7280] text-sm sm:text-base font-inter font-normal leading-6 sm:leading-[27px] max-w-xs mx-auto sm:mx-0">
              Your partner in simplifying the admissions process.
            </p>
          </div>

          {/* ================ */}
          {/* Quick Links Block */}
          {/* ================ */}
          <div className="col-span-1 text-center sm:text-left">
            
            {/* Section Title */}
            <h3 className="text-[#002147] font-medium font-inter text-base sm:text-lg mb-3 sm:mb-4">
              Quick Links
            </h3>

            {/* Navigation Links */}
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a
                  href="#"
                  className="text-[#3598FE] hover:text-[#6595dd] text-sm sm:text-base transition-colors font-inter font-normal inline-block sm:block py-1"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[#3598FE] hover:text-[#6595dd] text-sm sm:text-base transition-colors font-inter font-normal inline-block sm:block py-1"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[#3598FE] hover:text-[#6595dd] text-sm sm:text-base transition-colors font-inter font-normal inline-block sm:block py-1"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* =============== */}
          {/* Support Section */}
          {/* =============== */}
          <div className="col-span-1 text-center sm:text-left">
            
            {/* Section Title */}
            <h3 className="text-[#002147] font-medium font-inter text-base sm:text-lg mb-3 sm:mb-4">
              Support
            </h3>

            {/* Support Links */}
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a
                  href="#"
                  className="text-[#3598FE] hover:text-[#6595dd] text-sm sm:text-base transition-colors font-inter font-normal inline-block sm:block py-1"
                >
                  FAQs
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[#3598FE] hover:text-[#6595dd] text-sm sm:text-base transition-colors font-inter font-normal inline-block sm:block py-1"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* ===================== */}
          {/* (Optional) Follow Us */}
          {/* ===================== */}
          <div className="col-span-1 text-center sm:text-left">
            <h3 className="text-[#002147] font-medium font-inter text-base sm:text-lg mb-3 sm:mb-4">
              Follow Us
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a
                  href="#"
                  className="text-[#3598FE] hover:text-[#6595dd] text-sm sm:text-base transition-colors font-inter font-normal inline-block sm:block py-1"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[#3598FE] hover:text-[#6595dd] text-sm sm:text-base transition-colors font-inter font-normal inline-block sm:block py-1"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ========================== */}
        {/* Footer Bottom - Copyright */}
        {/* ========================== */}
        <div className="border-t border-gray-200 pt-4 sm:pt-6 text-center text-sm text-gray-500 font-inter">
          © {new Date().getFullYear()} Altu<span className="text-[#3598FE]">via</span>. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
