import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-6">Contact</h1>
      
      <p className="text-lg text-gray-700 mb-4">
        For collaborations, research queries, or corrections, feel free to reach out to me directly via email.
      </p>
      
      <div className="mb-12">
        <a href="mailto:mdfaizanbth01234@gmail.com" className="text-xl font-semibold text-blue-600 hover:underline">
          ✉️ mdfaizanbth01234@gmail.com
        </a>
        <p className="text-gray-500 mt-2 text-sm">Response time: 2-3 days</p>
      </div>

      {/* Social Media Icons at the bottom */}
      <div className="pt-8 border-t border-gray-200 flex flex-col items-center justify-center space-y-4">
        <p className="text-sm font-medium text-gray-700">Connect with me on social media</p>
        
        <div className="flex gap-6">
          {/* Instagram */}
          <a href="https://instagram.com/flar.orc.067" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          
          {/* YouTube */}
          <a href="https://youtube.com/@medicosfaizan?si=bUrktJ4yKUKwUt70" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
            </svg>
          </a>
          
          {/* LinkedIn */}
          <a href="https://linkedin.com/in/md-faizan-b285442a8" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
          </a>
        </div>
        
        <div className="text-sm text-gray-500 mt-4 text-center">
          <p>Content for educational purposes only and not medical advice. © 2026 M D Faizan</p>
          <div className="flex gap-4 mt-2 justify-center">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
          </div>
        </div>
      </div>
    </main>
  );
}