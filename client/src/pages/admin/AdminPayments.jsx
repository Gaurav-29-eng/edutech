import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login as admin to view payments');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const url = filter ? `${API}/api/payments?status=${filter}` : `${API}/api/payments`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to approve payments');
      return;
    }

    setProcessingId(paymentId);
    try {
      await axios.put(`${API}/api/payments/${paymentId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payment approved! Student now has access.');
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve payment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to reject payments');
      return;
    }

    setProcessingId(paymentId);
    try {
      await axios.put(`${API}/api/payments/${paymentId}/reject`, 
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Payment rejected');
      setSelectedPayment(null);
      setRejectionReason('');
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject payment');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            {payments.length} {filter || 'total'} request{payments.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Filter Tabs - Mobile: horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status === 'all' ? '' : status)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm capitalize whitespace-nowrap transition-colors ${
                (status === 'all' && !filter) || filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
              {status !== 'all' && (
                <span className="ml-1.5 text-xs opacity-75">
                  ({payments.filter(p => p.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>
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
                onClick={fetchPayments}
                className="text-red-600 text-sm font-medium mt-2 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500">
            {filter ? `No ${filter} payments found.` : 'No payment requests found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const isProcessing = processingId === payment._id;
            
            return (
              <div key={payment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-5">
                  {/* Status and Date */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(payment.status)}`}>
                      {payment.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Course Info */}
                  <h3 className="font-semibold text-gray-900 mb-2">{payment.course?.title || 'Unknown Course'}</h3>
                  
                  {/* Student Info */}
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="truncate">{payment.user?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{payment.user?.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">₹{payment.amount || 0}</span>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {payment.status === 'rejected' && payment.rejectionReason && (
                    <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm">
                      <span className="text-red-700 font-medium">Reason: </span>
                      <span className="text-red-600">{payment.rejectionReason}</span>
                    </div>
                  )}

                  {/* Screenshot and Actions */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Screenshot */}
                    <a 
                      href={payment.screenshotUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full sm:w-32 h-40 sm:h-24 bg-gray-100 rounded-lg overflow-hidden hover:opacity-90 flex-shrink-0"
                    >
                      <img 
                        src={payment.screenshotUrl} 
                        alt="Payment Screenshot" 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </a>

                    {/* Action Buttons */}
                    <div className="flex-1">
                      {payment.status === 'pending' ? (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleApprove(payment._id)}
                            disabled={isProcessing}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {isProcessing ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve Payment
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            disabled={isProcessing}
                            className="w-full bg-red-50 text-red-600 border border-red-200 py-3 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className={`p-4 rounded-lg ${
                          payment.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <div className={`flex items-center font-medium ${
                            payment.status === 'approved' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {payment.status === 'approved' ? (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Approved
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Rejected
                              </>
                            )}
                          </div>
                          {payment.reviewedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(payment.reviewedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reject Payment
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting payment from <strong>{selectedPayment.user?.name}</strong> for <strong>{selectedPayment.course?.title}</strong>.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              rows={3}
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedPayment(null);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedPayment._id)}
                disabled={!rejectionReason.trim() || processingId === selectedPayment._id}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processingId === selectedPayment._id ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Reject Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayments;
