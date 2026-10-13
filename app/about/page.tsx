import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Back link */}
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm mb-8 inline-block"
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-6xl shadow-lg">
            🩺
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            About Me
          </h1>
          <p className="text-lg text-blue-600 font-medium">
            MD Faizan · Medical Student · Researcher · Content Creator
          </p>
        </div>

        {/* Intro */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">👋 Hello!</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            My name is <strong>MD Faizan</strong>. I am an Indian medical student 
            currently studying at <strong>IKBFU (Immanuel Kant Baltic Federal University)</strong> in 
            Kaliningrad, Russia.
          </p>
          <p className="text-gray-700 leading-relaxed">
            I am currently a <strong>3rd year MBBS student</strong>, passionate about 
            medicine, research, and sharing knowledge with fellow medical students around the world.
          </p>
        </section>

        {/* Research */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🔬 My Research</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            My main research interests are in <strong>Neurology</strong> and <strong>Microbiology</strong>. 
            I love exploring how microorganisms interact with the human body, especially 
            in relation to neurological conditions.
          </p>
          <p className="text-gray-700 leading-relaxed">
            On this website, I share research papers and topics in <strong>simple, easy-to-understand language</strong> — 
            because I believe complex medical concepts should be accessible to everyone.
          </p>
        </section>

        {/* Vlogging */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎥 My Vlogs</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            I create vlogs about <strong>daily medical student life</strong> — 
            study routines, exam preparation, clinical experiences, and the real journey 
            of becoming a doctor.
          </p>
          <p className="text-gray-700 leading-relaxed">
            I also <strong>upload free study notes</strong> for medical students to help them 
            in their own journey. Education should be shared, not gatekept.
          </p>
        </section>

        {/* Hobbies */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎨 My Hobbies</h2>
          <p className="text-gray-700 leading-relaxed">
            When I am not studying or creating content, you will find me 
            <strong> painting and drawing</strong>. Art is my way of relaxing 
            and expressing creativity outside of medicine.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📫 Connect With Me</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://instagram.com/flar.orc.067"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
            >
              Instagram
            </a>
            <a
              href="https://youtube.com/@medicosfaizan"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              YouTube
            </a>
            <a
              href="https://www.linkedin.com/in/md-faizan-b285442a8"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
            >
              LinkedIn
            </a>
          </div>
        </section>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center mt-16">
          Content is for educational purposes only and not medical advice.
        </p>

      </div>
    </main>
  );
}