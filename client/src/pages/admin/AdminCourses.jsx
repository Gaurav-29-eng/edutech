import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://localhost:5003/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5003/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(courses.filter(c => c._id !== courseId));
      setDeleteConfirm(null);
    } catch (error) {
      alert('Failed to delete course');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading courses...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
        <Link
          to="/admin/courses/create"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Create Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">No courses yet.</p>
          <Link
            to="/admin/courses/create"
            className="text-blue-600 font-medium hover:underline"
          >
            Create your first course
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Course</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Instructor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Lectures</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Enrolled</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => (
                <tr key={course._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xl">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          '📚'
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{course.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {course.instructor?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">₹{course.price}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {course.lectures?.length || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {course.enrolledStudents?.length || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/courses/${course._id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1"
                      >
                        View
                      </Link>
                      <Link
                        to={`/admin/courses/edit/${course._id}`}
                        className="text-green-600 hover:text-green-800 text-sm font-medium px-3 py-1"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(course._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this course? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCourses;
