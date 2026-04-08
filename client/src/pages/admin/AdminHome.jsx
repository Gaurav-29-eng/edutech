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
    pendingPayments: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login as admin to view dashboard');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await axios.get(`${API}/api/auth/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { stats: dashboardStats, recentUsers: users } = response.data;
      
      setStats({
        totalCourses: dashboardStats?.totalCourses || 0,
        totalUsers: dashboardStats?.totalUsers || 0,
        totalEnrollments: dashboardStats?.totalEnrollments || 0,
        pendingPayments: dashboardStats?.pendingPayments || 0,
      });
      
      setRecentUsers(users || []);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your platform</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Refresh"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-red-700 text-sm">{error}</p>
              <button 
                onClick={fetchDashboardData}
                className="text-red-600 text-sm font-medium mt-2 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Mobile: 2 columns, scrollable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Courses</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Users</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Enrollments</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalEnrollments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Mobile friendly grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Link
          to="/admin/add-course"
          className="bg-blue-600 text-white p-4 sm:p-6 rounded-xl text-center hover:bg-blue-700 transition-colors"
        >
          <div className="text-3xl mb-2">➕</div>
          <h3 className="text-sm sm:text-base font-semibold">Add Course</h3>
        </Link>

        <Link
          to="/admin/upload-lecture"
          className="bg-green-600 text-white p-4 sm:p-6 rounded-xl text-center hover:bg-green-700 transition-colors"
        >
          <div className="text-3xl mb-2">🎥</div>
          <h3 className="text-sm sm:text-base font-semibold">Add Lecture</h3>
        </Link>

        <Link
          to="/admin/courses"
          className="bg-white text-gray-700 p-4 sm:p-6 rounded-xl text-center hover:bg-gray-50 transition-colors border border-gray-200"
        >
          <div className="text-3xl mb-2">📚</div>
          <h3 className="text-sm sm:text-base font-semibold">Courses</h3>
        </Link>

        <Link
          to="/admin/payments"
          className={`p-4 sm:p-6 rounded-xl text-center transition-colors border ${
            stats.pendingPayments > 0 
              ? 'bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100' 
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="text-3xl mb-2">💰</div>
          <h3 className="text-sm sm:text-base font-semibold">Payments</h3>
          {stats.pendingPayments > 0 && (
            <span className="inline-block mt-1 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
              {stats.pendingPayments} pending
            </span>
          )}
        </Link>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
        </div>
        
        {recentUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No users yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentUsers.map((user) => (
              <div key={user._id} className="p-4 sm:p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center min-w-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-gray-600 font-medium">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{user.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                  <p className="text-xs text-gray-400 mt-1 hidden sm:block">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="p-4 border-t border-gray-100 text-center">
          <Link 
            to="/admin/users" 
            className="text-blue-600 text-sm font-medium hover:text-blue-700"
          >
            View All Users →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
