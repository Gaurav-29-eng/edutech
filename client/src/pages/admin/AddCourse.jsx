import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const API = import.meta.env.VITE_API_URL;

function AddCourse() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [globalUpi, setGlobalUpi] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Please login as admin');
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('title', title);
    data.append('description', description);
    data.append('price', price);
    if (thumbnail) data.append('thumbnail', thumbnail);

    try {
      await axios.post(`${API}/api/courses`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage('Course created successfully!');
      setTitle('');
      setDescription('');
      setPrice('');
      setThumbnail(null);
      setTimeout(() => navigate('/admin/courses'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Course</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg text-center font-medium ${
          message.includes('success') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Course Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Introduction to React"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What will students learn?"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Price (₹)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="499"
          />
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Thumbnail Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnail(e.target.files[0])}
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-base file:font-medium file:bg-blue-50 file:text-blue-700"
          />
        </div>

        {/* Payment Preview */}
        {globalUpi && price > 0 && (
          <div className="p-6 bg-gray-50 rounded-xl text-center">
            <p className="text-lg font-medium text-gray-700 mb-4">
              Payment QR (Students will scan)
            </p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG 
                value={`upi://pay?pa=${encodeURIComponent(globalUpi)}&pn=EduTech&am=${price}&cu=INR`}
                size={180}
                level="M"
                includeMargin={true}
              />
            </div>
            <p className="text-gray-600">Pay to: {globalUpi}</p>
            <p className="text-gray-600">Amount: ₹{price}</p>
          </div>
        )}

        {!globalUpi && (
          <div className="p-4 bg-yellow-50 rounded-xl text-center">
            <p className="text-yellow-700">Set your UPI ID in Profile to enable payments</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 text-xl font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Creating...' : 'Create Course'}
        </button>
      </form>
    </div>
  );
}

export default AddCourse;
