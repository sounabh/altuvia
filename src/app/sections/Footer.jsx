export default function AltuviaFooter() {
  return (
    <footer className="bg-[#002147] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ========================== */}
        {/* Main Footer Grid Container */}
        {/* ========================== */}
       

        {/* ========================== */}
        {/* Footer Bottom - Copyright */}
        {/* ========================== */}
        <div className="border-t border-white/10 pt-4 sm:pt-6 text-center text-sm text-white font-inter">
          © {new Date().getFullYear()} Altu<span className="text-[#3598FE]">via</span>. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
