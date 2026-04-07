import { useState } from 'react';
import axios from 'axios';

function AdminUpload({ courseId, onUploadSuccess }) {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [notesFile, setNotesFile] = useState(null);
  const [duration, setDuration] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate YouTube URL
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
      setMessage('Please enter a valid YouTube URL');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Please login as admin');
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('videoUrl', videoUrl);
    formData.append('duration', duration);
    if (notesFile) formData.append('notes', notesFile);

    try {
      const response = await axios.post(
        `http://localhost:5003/api/courses/${courseId}/lectures`,
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
      if (onUploadSuccess) onUploadSuccess(response.data.course);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add lecture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Lecture</h3>
      
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lecture Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter lecture title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            YouTube Video URL *
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.youtube.com/watch?v=xxxxx"
          />
          <p className="mt-1 text-xs text-gray-500">
            Paste a YouTube video link (e.g., https://youtube.com/watch?v=xxxxx or https://youtu.be/xxxxx)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 45"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes PDF (Optional)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setNotesFile(e.target.files[0])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {notesFile && (
            <p className="mt-1 text-sm text-gray-500">Selected: {notesFile.name}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {uploading ? 'Adding Lecture...' : 'Add Lecture'}
        </button>
      </form>
    </div>
  );
}

export default AdminUpload;
