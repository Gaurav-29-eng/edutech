import { useState, useEffect } from 'react';
import axios from 'axios';

function UploadLecture() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [notesFile, setNotesFile] = useState(null);
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
    }
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCourse) {
      setMessage('Please select a course');
      return;
    }

    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
      setMessage('Please enter a valid YouTube URL');
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('videoUrl', videoUrl);
    formData.append('duration', duration);
    if (notesFile) formData.append('notes', notesFile);

    try {
      await axios.post(
        `http://localhost:5003/api/courses/${selectedCourse}/lectures`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage('Lecture added successfully!');
      setTitle('');
      setVideoUrl('');
      setNotesFile(null);
      setDuration('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add lecture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Lecture</h1>

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
        {/* Course Selection */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Select Course *
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a course...</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {/* Lecture Title */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Lecture Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Introduction to Variables"
          />
        </div>

        {/* YouTube URL */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            YouTube Video URL *
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            required
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://youtube.com/watch?v=xxxxx"
          />
          <p className="mt-1 text-sm text-gray-500">
            Paste any YouTube video link
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="45"
          />
        </div>

        {/* Notes PDF */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Notes PDF (Optional)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setNotesFile(e.target.files[0])}
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-base file:font-medium file:bg-blue-50 file:text-blue-700"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-4 text-xl font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Uploading...' : 'Add Lecture'}
        </button>
      </form>
    </div>
  );
}

export default UploadLecture;
