export default function AltuviaFooter() {
  return (
    <footer className=" border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 ">
        
        {/* ========================== */}
        {/* Main Footer Grid Container */}
        {/* ========================== */}
       

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
