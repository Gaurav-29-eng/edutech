import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API}/api/courses`);
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4 text-sm sm:text-base">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">All Courses</h1>
      
      {courses.length === 0 ? (
        <p className="text-gray-600 text-sm sm:text-base">No courses available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {courses.map((course) => (
            <Link
              key={course._id}
              to={`/courses/${course._id}`}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden block"
            >
              <div className="h-40 sm:h-48 bg-gray-200 flex items-center justify-center">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-5xl sm:text-6xl">📚</div>
                )}
              </div>
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {course.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-semibold text-sm sm:text-base">
                    ₹{course.price}
                  </span>
                  <span className="text-gray-500 text-xs sm:text-sm">
                    {course.lectures?.length || 0} lectures
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default CourseList;
