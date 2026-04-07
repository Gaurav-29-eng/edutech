import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    const token = localStorage.getItem('token');
    try {
      const url = filter ? `http://localhost:5003/api/payments?status=${filter}` : 'http://localhost:5003/api/payments';
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5003/api/payments/${paymentId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payment approved! Student now has access.');
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve payment');
    }
  };

  const handleReject = async (paymentId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5003/api/payments/${paymentId}/reject`, 
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Payment rejected');
      setSelectedPayment(null);
      setRejectionReason('');
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject payment');
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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payment Requests</h1>
        
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status === 'all' ? '' : status)}
              className={`px-4 py-2 rounded-lg font-medium capitalize ${
                (status === 'all' && !filter) || filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">No payment requests found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(payment.status)}`}>
                      {payment.status}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {new Date(payment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900">{payment.course?.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span><strong>Student:</strong> {payment.user?.name} ({payment.user?.email})</span>
                    <span><strong>Amount:</strong> ₹{payment.amount}</span>
                  </div>

                  {payment.status === 'rejected' && payment.rejectionReason && (
                    <div className="mt-2 text-sm text-red-600">
                      <strong>Reason:</strong> {payment.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Screenshot Thumbnail */}
                  <a 
                    href={payment.screenshotUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-24 h-24 bg-gray-100 rounded-lg overflow-hidden hover:opacity-90"
                  >
                    <img 
                      src={payment.screenshotUrl} 
                      alt="Payment Screenshot" 
                      className="w-full h-full object-cover"
                    />
                  </a>

                  {/* Action Buttons - Large */}
                  {payment.status === 'pending' && (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleApprove(payment._id)}
                        className="bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="bg-red-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-red-700 transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}

                  {payment.status === 'approved' && (
                    <div className="text-green-600 text-sm font-medium">
                      ✓ Approved<br />
                      <span className="text-gray-500">
                        {new Date(payment.reviewedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {payment.status === 'rejected' && (
                    <div className="text-red-600 text-sm font-medium">
                      ✗ Rejected<br />
                      <span className="text-gray-500">
                        {new Date(payment.reviewedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Payment
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this payment from {selectedPayment.user?.name}.
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
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedPayment._id)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayments;
