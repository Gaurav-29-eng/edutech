import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

function StudentDashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ totalCourses: 0, completedLectures: 0, inProgress: 0 });
  const [resumingCourse, setResumingCourse] = useState(null);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to view your dashboard');
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const response = await axios.get(`${API}/api/courses/my/enrolled`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const courses = response.data.courses || [];
      setEnrolledCourses(courses);
      
      // Calculate stats
      const totalLectures = courses.reduce((acc, c) => acc + (c.totalLectures || 0), 0);
      const completedLectures = courses.reduce((acc, c) => acc + (c.completedCount || 0), 0);
      
      setStats({
        totalCourses: courses.length,
        completedLectures: completedLectures,
        inProgress: courses.filter(c => c.progress > 0 && c.progress < 100).length,
        completedCourses: courses.filter(c => c.progress === 100).length
      });
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
      setError(err.response?.data?.message || 'Failed to load your courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLearning = async (courseId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setResumingCourse(courseId);
    
    try {
      const response = await axios.get(`${API}/api/courses/${courseId}/resume`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { lecture, lectureIndex } = response.data;
      if (lecture) {
        navigate(`/courses/${courseId}/lectures/${lecture._id}`, { 
          state: { lectureIndex, resume: true }
        });
      } else {
        navigate(`/courses/${courseId}`);
      }
    } catch (err) {
      console.error('Error getting resume lecture:', err);
      // Fallback to course detail page
      navigate(`/courses/${courseId}`);
    } finally {
      setResumingCourse(null);
    }
  };

  const getLastWatchedInfo = (course) => {
    if (!course.lastWatchedLecture || !course.lectures?.length) return null;
    const lastLecture = course.lectures.find(l => l._id === course.lastWatchedLecture);
    const lectureIndex = course.lectures.findIndex(l => l._id === course.lastWatchedLecture);
    return lastLecture ? { ...lastLecture, index: lectureIndex + 1 } : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Learning</h1>
              <p className="text-sm text-gray-600 mt-0.5">Welcome back, {user.name || 'Student'}!</p>
            </div>
            <Link 
              to="/courses" 
              className="sm:hidden bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              Explore
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 sm:mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-700 text-sm">{error}</p>
                <button 
                  onClick={fetchEnrolledCourses}
                  className="text-red-600 text-sm font-medium mt-2 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards - Mobile: Scrollable Horizontal */}
        <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 min-w-[140px] sm:min-w-0 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Enrolled</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 min-w-[140px] sm:min-w-0 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">In Progress</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 min-w-[140px] sm:min-w-0 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Completed</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">My Courses</h2>
            <Link 
              to="/courses" 
              className="hidden sm:inline-block text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              Browse More →
            </Link>
          </div>
          
          {enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4 text-sm sm:text-base">You haven't enrolled in any courses yet.</p>
              <Link
                to="/courses"
                className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 text-sm sm:text-base"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {enrolledCourses.map((course) => {
                const progressPercent = course.progress || 0;
                const lastWatched = getLastWatchedInfo(course);
                const isCompleted = progressPercent === 100;
                const isResuming = resumingCourse === course._id;
                
                return (
                  <div key={course._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* Course Thumbnail */}
                    <div className="h-40 sm:h-48 bg-gray-200 relative">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                          <span className="text-white text-3xl sm:text-4xl font-bold">{course.title?.charAt(0) || 'C'}</span>
                        </div>
                      )}
                      
                      {/* Progress Badge */}
                      <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${
                        isCompleted 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-white text-gray-700'
                      }`}>
                        {isCompleted ? 'Completed' : `${progressPercent}%`}
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-gray-500 text-xs sm:text-sm mb-3 line-clamp-2">
                        {course.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-3 sm:mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{course.completedCount || 0} / {course.totalLectures || 0} lectures</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div
                            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-green-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Last Watched Info */}
                      {lastWatched && !isCompleted && (
                        <div className="flex items-center text-xs text-gray-500 mb-3">
                          <svg className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="truncate">Lecture {lastWatched.index}: {lastWatched.title}</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handleContinueLearning(course._id)}
                          disabled={isResuming}
                          className={`w-full py-2.5 sm:py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center ${
                            isCompleted
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isResuming ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                              Loading...
                            </>
                          ) : isCompleted ? (
                            'Review Course'
                          ) : lastWatched ? (
                            'Continue Learning'
                          ) : (
                            'Start Learning'
                          )}
                        </button>
                        
                        <Link
                          to={`/courses/${course._id}`}
                          className="block w-full text-center py-2 text-gray-600 text-sm font-medium hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
