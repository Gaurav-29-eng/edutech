import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const API = import.meta.env.VITE_API_URL;

function CreateCourse() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [globalUpi, setGlobalUpi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch global UPI from admin settings
  useEffect(() => {
    const fetchGlobalUpi = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${API}/api/auth/admin/upi`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGlobalUpi(response.data.defaultUpiId || '');
      } catch (err) {
        console.log('Could not fetch global UPI');
      }
    };
    fetchGlobalUpi();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login as admin');
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('price', formData.price);
    // UPI is automatically set from admin's global UPI
    if (thumbnail) data.append('thumbnail', thumbnail);

    try {
      await axios.post(`${API}/api/courses`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      navigate('/admin/courses');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New Course</h1>

      <div className="max-w-2xl bg-white rounded-xl shadow-sm p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Introduction to React"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what students will learn..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (₹ INR)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="499"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter price in Indian Rupees (₹). Set 0 for free course.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0])}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {thumbnail && (
              <p className="mt-2 text-sm text-gray-500">Selected: {thumbnail.name}</p>
            )}
          </div>

          {/* Payment Section - Shows Global UPI */}
          <div className="bg-gray-50 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Payment (Global UPI)
            </label>
            
            {globalUpi ? (
              <>
                <div className="p-3 bg-white rounded-lg border mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>UPI ID:</strong> {globalUpi}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Set in Profile. All courses use this UPI.
                  </p>
                </div>

                {/* QR Code Preview */}
                {formData.price > 0 && (
                  <div className="p-4 bg-white rounded-lg border">
                    <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                      QR Code Preview (Students will scan this)
                    </p>
                    <div className="flex justify-center">
                      <QRCodeSVG 
                        value={`upi://pay?pa=${encodeURIComponent(globalUpi)}&pn=EduTech&am=${formData.price}&cu=INR`}
                        size={160}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-sm text-gray-600">
                        <strong>Pay to:</strong> {globalUpi}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Amount:</strong> ₹{formData.price}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700">
                  No global UPI ID set. Please set it in your Profile first.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="mt-2 text-blue-600 font-medium text-sm hover:underline"
                >
                  Go to Profile →
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCourse;
