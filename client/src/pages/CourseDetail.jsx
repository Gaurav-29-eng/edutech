import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import axios from 'axios';
import VideoPlayer from '../components/VideoPlayer';
import AdminUpload from '../components/AdminUpload';

// Status Badge Component
function StatusBadge({ status }) {
  const styles = {
    approved: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    not_paid: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  
  const labels = {
    approved: '✓ Enrolled',
    pending: '⏳ Payment Pending',
    rejected: '✗ Payment Rejected',
    not_paid: 'Payment Required'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold border ${styles[status] || styles.not_paid}`}>
      {labels[status] || status}
    </span>
  );
}

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-8 sm:py-12">
      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedLecture, setSelectedLecture] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);

  useEffect(() => {
    fetchCourse();
    checkUserRole();
  }, [id]);

  const checkUserRole = () => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setIsAdmin(parsed.role === 'admin');
    }
  };

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`http://localhost:5003/api/courses/${id}`);
      setCourse(response.data.course);
      
      // Check payment status if logged in
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const paymentRes = await axios.get(`http://localhost:5003/api/payments/status/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPaymentStatus(paymentRes.data.status);
        } catch (err) {
          console.log('No payment found');
          setPaymentStatus('not_paid');
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (course.price === 0) {
      // Free course - enroll directly
      enrollFreeCourse();
    } else {
      // Paid course - show payment modal
      setShowPaymentModal(true);
    }
  };

  const enrollFreeCourse = async () => {
    setEnrolling(true);
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `http://localhost:5003/api/courses/${id}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPaymentStatus('approved');
      toast.success('Successfully enrolled! You now have access to all lectures.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }

    setUploadingPayment(true);
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('screenshot', screenshot);
    formData.append('courseId', id);

    try {
      await axios.post('http://localhost:5003/api/payments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setPaymentStatus('pending');
      toast.success('Payment submitted! Waiting for admin approval.');
      setShowPaymentModal(false);
      setScreenshot(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment submission failed');
    } finally {
      setUploadingPayment(false);
    }
  };

  const downloadNotes = (notesUrl, title) => {
    if (!notesUrl) {
      alert('No notes available for this lecture');
      return;
    }
    const link = document.createElement('a');
    link.href = notesUrl;
    link.download = `${title}-notes.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <p className="text-gray-600 text-sm sm:text-base">Course not found.</p>
      </div>
    );
  }

  const currentLecture = course.lectures[selectedLecture];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
      {/* Admin Upload Section */}
      {isAdmin && (
        <AdminUpload courseId={id} onUploadSuccess={(updatedCourse) => setCourse(updatedCourse)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          {/* Course Thumbnail */}
          <div className="h-48 sm:h-64 md:h-80 bg-gray-200 rounded-xl flex items-center justify-center mb-6 sm:mb-8 overflow-hidden">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-6xl sm:text-8xl">📚</div>
            )}
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{course.title}</h1>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6 text-sm sm:text-base">
            <span className="text-gray-600">
              Instructor: <strong>{course.instructor?.name || 'Unknown'}</strong>
            </span>
            <span className="text-gray-400 hidden sm:inline">|</span>
            <span className="text-gray-600">
              {course.lectures?.length || 0} lectures
            </span>
          </div>
          
          <div className="prose max-w-none mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{course.description}</p>
          </div>
          
          {/* Video Player Section - Only for approved payments */}
          {paymentStatus === 'approved' && currentLecture && (
            <div className="mb-6 sm:mb-8 video-container">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                Now Playing: {currentLecture.title}
              </h3>
              <VideoPlayer videoUrl={currentLecture.videoUrl} title={currentLecture.title} />
              
              {/* Download Notes Button */}
              {currentLecture.notesUrl && (
                <button
                  onClick={() => downloadNotes(currentLecture.notesUrl, currentLecture.title)}
                  className="mt-3 sm:mt-4 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 min-h-[48px] rounded-lg transition-colors w-full sm:w-auto justify-center"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Notes
                </button>
              )}
            </div>
          )}
          
          {/* Lectures List */}
          <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Course Content</h3>
            {course.lectures?.length === 0 ? (
              <p className="text-gray-500 text-sm sm:text-base">No lectures available yet.</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {course.lectures.map((lecture, index) => (
                  <div
                    key={index}
                    onClick={() => paymentStatus === 'approved' && setSelectedLecture(index)}
                    className={`bg-white rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 min-h-[48px] cursor-pointer transition-all ${
                      selectedLecture === index ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                    } ${paymentStatus !== 'approved' ? 'opacity-75' : ''}`}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-sm sm:text-base flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{lecture.title}</h4>
                      {lecture.duration > 0 && (
                        <span className="text-xs sm:text-sm text-gray-500">{lecture.duration} min</span>
                      )}
                    </div>
                    {paymentStatus === 'approved' && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                    )}
                    {paymentStatus !== 'approved' && (
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-24">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              ₹{course.price}
            </div>

            {/* Auto-generated QR Code - Show instantly */}
            {course.price > 0 && course.upiId && paymentStatus !== 'approved' && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                  Scan to Pay ₹{course.price}
                </p>
                <div className="flex justify-center mb-2 sm:mb-3">
                  <QRCodeSVG 
                    value={`upi://pay?pa=${encodeURIComponent(course.upiId)}&pn=EduTech&am=${course.price}&cu=INR`}
                    size={140}
                    className="sm:w-[180px]"
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  <strong>UPI ID:</strong> {course.upiId}
                </p>
                <a
                  href={`upi://pay?pa=${encodeURIComponent(course.upiId)}&pn=EduTech&am=${course.price}&cu=INR`}
                  className="block w-full bg-green-600 text-white py-2 sm:py-3 rounded-lg font-medium text-sm text-center hover:bg-green-700 transition-colors"
                >
                  📱 Pay Now
                </a>
              </div>
            )}
            
            {/* Status Badge */}
            <div className="mb-3 sm:mb-4">
              <StatusBadge status={paymentStatus || 'not_paid'} />
            </div>
            
            {paymentStatus === 'approved' ? (
              <div className="w-full bg-green-100 text-green-700 py-3 min-h-[48px] flex items-center justify-center rounded-lg font-semibold text-center text-sm sm:text-base">
                ✓ Access Granted
              </div>
            ) : paymentStatus === 'pending' ? (
              <div className="space-y-3">
                <div className="w-full bg-yellow-100 text-yellow-700 py-3 min-h-[48px] flex items-center justify-center rounded-lg font-semibold text-center text-sm sm:text-base">
                  ⏳ Payment Pending
                </div>
                <p className="text-xs sm:text-sm text-gray-500 text-center">
                  Admin will verify your payment soon
                </p>
              </div>
            ) : paymentStatus === 'rejected' ? (
              <div className="space-y-3">
                <div className="w-full bg-red-100 text-red-700 py-3 min-h-[48px] flex items-center justify-center rounded-lg font-semibold text-center text-sm sm:text-base">
                  ✗ Payment Rejected
                </div>
                <button
                  onClick={handleEnroll}
                  className="w-full bg-blue-600 text-white py-3 min-h-[48px] rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base flex items-center justify-center"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full bg-blue-600 text-white py-3 min-h-[48px] rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {enrolling ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  course.price === 0 ? 'Enroll Free' : 'Enroll Now'
                )}
              </button>
            )}
            
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">This course includes:</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li>✓ {course.lectures?.length || 0} lectures</li>
                <li>✓ Lifetime access</li>
                <li>✓ Certificate of completion</li>
                <li>✓ Mobile and TV access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Complete Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Price */}
              <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500">Course Price</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">₹{course.price}</p>
              </div>

              {/* UPI ID Display */}
              {course.upiId && (
                <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-green-800">
                    <strong>Pay to:</strong> {course.upiId}
                  </p>
                </div>
              )}

              {/* QR Code */}
              {course.upiLink ? (
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Scan QR Code to Pay</p>
                  <div className="flex justify-center">
                    <QRCodeSVG 
                      value={course.upiLink} 
                      size={160}
                      className="sm:w-[192px]"
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 sm:p-4 bg-yellow-50 text-yellow-700 rounded-lg text-center text-sm">
                  <p>UPI payment not configured. Please contact admin.</p>
                </div>
              )}

              {/* Pay Now Button */}
              {course.upiLink && (
                <a
                  href={course.upiLink}
                  className="block w-full bg-green-600 text-white py-4 min-h-[48px] rounded-xl font-semibold text-center hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  📱 Pay Now
                </a>
              )}

              {/* Instructions */}
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-800">
                  <strong>Instructions:</strong>
                </p>
                <ol className="text-xs sm:text-sm text-blue-700 list-decimal list-inside mt-2 space-y-1">
                  <li>Scan QR code or click "Pay Now"</li>
                  <li>Pay exactly ₹{course.price} using any UPI app</li>
                  <li>Take a screenshot of payment success</li>
                  <li>Upload the screenshot below</li>
                </ol>
              </div>

              {/* Screenshot Upload */}
              <form onSubmit={submitPayment} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Upload Payment Screenshot *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files[0])}
                    required
                    className="w-full px-3 py-3 min-h-[48px] text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {screenshot && (
                    <p className="mt-2 text-xs sm:text-sm text-gray-500">Selected: {screenshot.name}</p>
                  )}
                </div>

                {message && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploadingPayment || !screenshot}
                  className="w-full bg-blue-600 text-white py-4 min-h-[48px] rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 text-sm sm:text-base flex items-center justify-center"
                >
                  {uploadingPayment ? 'Submitting...' : 'Submit Payment Proof'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetail;
