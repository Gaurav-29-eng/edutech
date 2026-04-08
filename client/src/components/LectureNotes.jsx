import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;

function LectureNotes({ courseId, lectureId, currentTime = 0, onSeekTo }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' or 'bookmarks'

  useEffect(() => {
    if (courseId && lectureId) {
      fetchNotes();
    }
  }, [courseId, lectureId]);

  const fetchNotes = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/api/notes/${courseId}/${lectureId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveNote = async (isBookmark = false) => {
    const content = newNote.trim();
    if (!content) {
      toast.error('Note content cannot be empty');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to save notes');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/api/notes`, {
        courseId,
        lectureId,
        content,
        timestamp: Math.floor(currentTime),
        isBookmark,
        title: noteTitle.trim() || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(isBookmark ? 'Bookmark saved!' : 'Note saved!');
      setNewNote('');
      setNoteTitle('');
      fetchNotes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async (noteId) => {
    const content = editContent.trim();
    if (!content) {
      toast.error('Note content cannot be empty');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/api/notes/${noteId}`, {
        content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Note updated!');
      setEditingId(null);
      setEditContent('');
      fetchNotes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Note deleted!');
      fetchNotes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete note');
    }
  };

  const handleBookmarkAtCurrentTime = () => {
    setNoteTitle('Bookmark');
    setNewNote(`Bookmark at ${formatTime(currentTime)}`);
    handleSaveNote(true);
  };

  const filteredNotes = activeTab === 'bookmarks' 
    ? notes.filter(n => n.isBookmark)
    : notes;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Notes & Bookmarks</h3>
          <button
            onClick={handleBookmarkAtCurrentTime}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Bookmark ({formatTime(currentTime)})
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notes'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Notes ({notes.filter(n => !n.isBookmark).length})
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'bookmarks'
                ? 'bg-yellow-100 text-yellow-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Bookmarks ({notes.filter(n => n.isBookmark).length})
          </button>
        </div>
      </div>

      {/* Add New Note */}
      {activeTab === 'notes' && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note title (optional)..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-sm"
          />
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write your note here..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Current time: {formatTime(currentTime)}
            </span>
            <button
              onClick={() => handleSaveNote(false)}
              disabled={saving || !newNote.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="max-h-80 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              {activeTab === 'bookmarks' ? (
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
            </div>
            <p className="text-gray-500 text-sm">
              {activeTab === 'bookmarks' 
                ? 'No bookmarks yet. Click the bookmark button to save timestamps.'
                : 'No notes yet. Start taking notes while watching the lecture!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotes.map((note) => (
              <div key={note._id} className="p-4 hover:bg-gray-50 transition-colors">
                {editingId === note._id ? (
                  // Edit Mode
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateNote(note._id)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditContent('');
                        }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {note.title && (
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{note.title}</h4>
                        )}
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{note.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {note.timestamp > 0 && onSeekTo && (
                            <button
                              onClick={() => onSeekTo(note.timestamp)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTime(note.timestamp)}
                            </button>
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                          {note.isBookmark && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                              </svg>
                              Bookmark
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(note._id);
                            setEditContent(note.content);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LectureNotes;
