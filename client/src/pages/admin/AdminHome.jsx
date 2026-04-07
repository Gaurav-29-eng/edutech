import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

function AdminHome() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalUsers: 0,
    totalEnrollments: 0,
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [coursesRes, usersRes] = await Promise.all([
        axios.get(`${API}/api/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/api/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { users: [] } })),
      ]);

      const courses = coursesRes.data.courses || [];
      const users = usersRes.data.users || [];
      
      const enrollments = courses.reduce((acc, c) => acc + (c.enrolledStudents?.length || 0), 0);
      
      setStats({
        totalCourses: courses.length,
        totalUsers: users.length,
        totalEnrollments: enrollments,
      });
      
      setRecentCourses(courses.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              📚
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
              👥
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEnrollments}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
              🎓
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Large Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/admin/add-course"
          className="bg-blue-600 text-white p-8 rounded-2xl text-center hover:bg-blue-700 transition-colors"
        >
          <div className="text-5xl mb-4">➕</div>
          <h3 className="text-2xl font-bold">Add Course</h3>
          <p className="text-blue-100 mt-2">Create a new course</p>
        </Link>

        <Link
          to="/admin/upload-lecture"
          className="bg-green-600 text-white p-8 rounded-2xl text-center hover:bg-green-700 transition-colors"
        >
          <div className="text-5xl mb-4">🎥</div>
          <h3 className="text-2xl font-bold">Upload Lecture</h3>
          <p className="text-green-100 mt-2">Add video to a course</p>
        </Link>

        <Link
          to="/admin/courses"
          className="bg-white text-gray-700 p-8 rounded-2xl text-center hover:bg-gray-50 transition-colors border-2 border-gray-200"
        >
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-2xl font-bold">All Courses</h3>
          <p className="text-gray-500 mt-2">View and manage courses</p>
        </Link>

        <Link
          to="/admin/payments"
          className="bg-white text-gray-700 p-8 rounded-2xl text-center hover:bg-gray-50 transition-colors border-2 border-gray-200"
        >
          <div className="text-5xl mb-4">💰</div>
          <h3 className="text-2xl font-bold">Payments</h3>
          <p className="text-gray-500 mt-2">Approve student payments</p>
        </Link>
      </div>

      {/* Recent Courses */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Courses</h2>
        {recentCourses.length === 0 ? (
          <p className="text-gray-500">No courses yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentCourses.map((course) => (
              <div key={course._id} className="py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-500">
                    {course.lectures?.length || 0} lectures • ₹{course.price}
                  </p>
                </div>
                <Link
                  to={`/courses/${course._id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminHome;
