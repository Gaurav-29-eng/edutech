import { useState, useEffect } from 'react';
import axios from 'axios';

function Profile() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [defaultUpi, setDefaultUpi] = useState('');
  const [upiMessage, setUpiMessage] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch admin's default UPI from server
    const fetchDefaultUpi = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await axios.get('http://localhost:5003/api/auth/admin/upi', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDefaultUpi(response.data.defaultUpiId || '');
      } catch (err) {
        console.log('Could not fetch default UPI');
      }
    };
    
    fetchDefaultUpi();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveDefaultUpi = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        'http://localhost:5003/api/auth/admin/upi',
        { defaultUpiId: defaultUpi.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUpiMessage('Global UPI ID saved! All courses will use this UPI.');
      setTimeout(() => setUpiMessage(''), 3000);
    } catch (err) {
      setUpiMessage(err.response?.data?.message || 'Failed to save UPI ID');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      await axios.put(
        'http://localhost:5003/api/auth/change-password',
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('Password changed successfully!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600 mb-6">Manage your account settings</p>

          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Logged in as</p>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
              user.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {user.role}
            </span>
          </div>

          {/* Admin: Default UPI Setting */}
          {user.role === 'admin' && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Global UPI ID (All Courses)</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={defaultUpi}
                  onChange={(e) => setDefaultUpi(e.target.value)}
                  placeholder="yourname@upi"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveDefaultUpi}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
              {upiMessage && (
                <p className="mt-2 text-sm text-green-700">{upiMessage}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                This UPI ID will be used for ALL courses automatically. Only price changes per course.
              </p>
            </div>
          )}

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>

          {message && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
