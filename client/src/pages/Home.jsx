import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Transform Your Learning Journey
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
            Discover a world of knowledge with cutting-edge courses, expert instructors, and a community that inspires growth.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link
              to="/signup"
              className="bg-blue-600 text-white px-6 sm:px-8 py-4 min-h-[48px] rounded-xl text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors w-full sm:w-auto flex items-center justify-center"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-gray-100 text-gray-700 px-6 sm:px-8 py-4 min-h-[48px] rounded-xl text-base sm:text-lg font-semibold hover:bg-gray-200 transition-colors w-full sm:w-auto flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Why Choose EduTech?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            {/* Learn Card */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Learn</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Access quality educational content and resources from industry experts.
              </p>
            </div>

            {/* Connect Card */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Connect</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Connect with teachers and fellow students in a collaborative environment.
              </p>
            </div>

            {/* Grow Card */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Grow</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Track your progress and achieve your goals with personalized learning paths.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 px-2">
            Join thousands of students already transforming their futures with EduTech.
          </p>
          <Link
            to="/signup"
            className="bg-blue-600 text-white px-6 sm:px-8 py-4 min-h-[48px] rounded-xl text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center w-full sm:w-auto"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 EduTech. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
