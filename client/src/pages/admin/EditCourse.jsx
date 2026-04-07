import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

function EditCourse() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    isPublished: true
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [currentThumbnail, setCurrentThumbnail] = useState('');
  const [currentUpiId, setCurrentUpiId] = useState('');
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingLecture, setEditingLecture] = useState(null);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:5003/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const course = response.data.course;
      
      setFormData({
        title: course.title,
        description: course.description,
        price: course.price,
        isPublished: course.isPublished
      });
      setCurrentThumbnail(course.thumbnail);
      setUpiId(course.upiId || '');
      setCurrentUpiId(course.upiId || '');
      setLectures(course.lectures || []);
    } catch (err) {
      setError('Failed to fetch course');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const token = localStorage.getItem('token');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('isPublished', formData.isPublished);
    data.append('upiId', upiId);
    if (thumbnail) data.append('thumbnail', thumbnail);

    try {
      await axios.put(`http://localhost:5003/api/courses/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage('Course updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5003/api/courses/${id}/lectures/${lectureId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Lecture deleted successfully');
      fetchCourse();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lecture');
    }
  };

  const handleUpdateLecture = async (lectureId, updatedData) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5003/api/courses/${id}/lectures/${lectureId}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Lecture updated successfully');
      setEditingLecture(null);
      fetchCourse();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update lecture');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading course...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
        <button
          onClick={() => navigate('/admin/courses')}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200"
        >
          Back to Courses
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Course Details */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Course Details</h2>
          
          <div className="space-y-6">
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
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Published (visible to students)
              </label>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Images & Payment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail
              </label>
              {currentThumbnail && (
                <img src={currentThumbnail} alt="Current thumbnail" className="w-full h-40 object-cover rounded-lg mb-3" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files[0])}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
              />
              {thumbnail && <p className="mt-1 text-sm text-gray-500">New: {thumbnail.name}</p>}
            </div>

            {/* UPI ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID for Payments
              </label>
              <div className="p-4 bg-gray-50 rounded-lg mb-3">
                <p className="text-sm text-gray-500">Current:</p>
                <p className="font-medium text-gray-900">{currentUpiId || 'Not set'}</p>
              </div>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="yourname@upi or mobile@paytm"
              />
              {/* QR Code Preview */}
              {upiId && formData.price > 0 && (
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <p className="text-sm font-medium text-gray-700 mb-2 text-center">
                    QR Code Preview
                  </p>
                  <div className="flex justify-center">
                    <QRCodeSVG 
                      value={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=EduTech&am=${formData.price}&cu=INR`}
                      size={140}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-600">
                      <strong>Pay to:</strong> {upiId}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Amount:</strong> ₹{formData.price}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Lectures Management */}
      <div className="bg-white rounded-xl shadow-sm p-8 mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Manage Lectures</h2>
        
        {lectures.length === 0 ? (
          <p className="text-gray-500">No lectures yet.</p>
        ) : (
          <div className="space-y-3">
            {lectures.map((lecture, index) => (
              <div key={lecture._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                {editingLecture === lecture._id ? (
                  <LectureEditForm
                    lecture={lecture}
                    onSave={(data) => handleUpdateLecture(lecture._id, data)}
                    onCancel={() => setEditingLecture(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{lecture.title}</h4>
                        {lecture.duration > 0 && (
                          <span className="text-sm text-gray-500">{lecture.duration} min</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingLecture(lecture._id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLecture(lecture._id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Lecture Edit Form Component
function LectureEditForm({ lecture, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: lecture.title,
    videoUrl: lecture.videoUrl,
    duration: lecture.duration
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Lecture title"
        required
      />
      <input
        type="url"
        value={formData.videoUrl}
        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="YouTube URL"
        required
      />
      <input
        type="number"
        value={formData.duration}
        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Duration (min)"
      />
      <div className="flex gap-2">
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          Save
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default EditCourse;
