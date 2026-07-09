
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Package,
  User,
  Store,
  Truck,
  CreditCard,
  Clock,
  MapPin,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { OrderDetail as OrderDetailType } from '../../types';
import { api } from '../../services/api';

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ orderId, onBack }) => {
  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const data = await api.getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      setError("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (order?.status?.toUpperCase() === 'CANCELLED' || order?.status?.toUpperCase() === 'DELIVERED') {
      alert("This order is already in a terminal state.");
      return;
    }
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await api.updateOrderStatus(orderId, 'CANCELLED');
        fetchOrderDetails();
      } catch (error) {
        alert("Failed to cancel order.");
      }
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    if (window.confirm(`Issue refund of ₹${order.totalAmount}? This action cannot be undone.`)) {
      try {
        // In a real app, this would call a refund API. For now, we update local status.
        await new Promise(resolve => setTimeout(resolve, 800));
        setOrder(prev => prev ? { ...prev, paymentStatus: 'Refunded' } : null);
        alert('Refund processed successfully.');
      } catch (error) {
        alert("Failed to process refund.");
      }
    }
  };

  const handleUpdateStatus = async () => {
    if (order?.status?.toUpperCase() === 'CANCELLED' || order?.status?.toUpperCase() === 'DELIVERED') {
      alert("This order is in a terminal state and cannot be modified.");
      return;
    }
    const newStatus = window.prompt('Enter new status (PROCESSING, PACKED_READY, SHIPPED, DELIVERED):', 'SHIPPED');
    if (newStatus && ['PROCESSING', 'PACKED_READY', 'SHIPPED', 'DELIVERED'].includes(newStatus.toUpperCase())) {
      try {
        await api.updateOrderStatus(orderId, newStatus.toUpperCase() as any);
        fetchOrderDetails();
      } catch (error) {
        alert("Failed to update status.");
      }
    } else if (newStatus) {
      alert('Invalid status entered.');
    }
  };

  const handleAssignPartner = () => {
    alert('Opening Delivery Partner Assignment Modal...');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
        <p className="text-red-600 mb-4">{error || "Order not found."}</p>
        <button onClick={onBack} className="text-primary hover:underline flex items-center justify-center mx-auto">
          <ArrowLeft size={16} className="mr-1" /> Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Orders
        </button>
        <div className="flex gap-3">
          {order.status?.toUpperCase() !== 'CANCELLED' && order.status?.toUpperCase() !== 'RETURNED' && order.status?.toUpperCase() !== 'DELIVERED' && (
            <button
              onClick={handleCancelOrder}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Cancel Order
            </button>
          )}
          {order.paymentStatus === 'Paid' && (
            <button
              onClick={handleRefund}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Issue Refund
            </button>
          )}
          <button
            onClick={handleUpdateStatus}
            disabled={order.status?.toUpperCase() === 'CANCELLED' || order.status?.toUpperCase() === 'DELIVERED'}
            className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors shadow-sm ${order.status?.toUpperCase() === 'CANCELLED' || order.status?.toUpperCase() === 'DELIVERED' ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-primary hover:bg-indigo-700'}`}
          >
            Update Status
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Main Content */}
        <div className="flex-1 space-y-6">

          {/* Order Items */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Order #{order.id}</h2>
                <p className="text-sm text-gray-500">Placed on {order.orderDate}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                  'bg-blue-50 text-blue-700'
                }`}>
                {order.status}
              </span>
            </div>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start">
                  <img src={item.image || 'https://via.placeholder.com/64'} alt={item.name} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-bold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item.variant}</p>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      ₹{item.price.toFixed(2)} x {item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span> <span>₹{order.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax (GST)</span> <span>₹{order.tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Delivery Fee</span> <span>₹{order.deliveryFee.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-900 font-bold text-base pt-2 border-t border-gray-100 mt-2">
                <span>Total Amount</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Tracking & Logs Timeline */}
          {order.logs && order.logs.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Timeline</h3>
              <div className="relative pl-4 border-l-2 border-gray-100 space-y-8 my-2">
                {order.logs.map((log, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-sm"></div>
                    <div className="text-sm font-bold text-gray-900">{log.status}</div>
                    <div className="text-xs text-gray-500 mb-1">{log.timestamp}</div>
                    <p className="text-sm text-gray-600">{log.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar Info */}
        <div className="w-full lg:w-80 space-y-6">

          {/* Customer Details */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center">
              <User size={14} className="mr-2" /> Customer Details
            </h3>
            <div className="space-y-3">
              <div className="font-medium text-gray-900">{order.customerName}</div>
              <div className="text-sm text-gray-600">{order.customerEmail}</div>
              <div className="text-sm text-gray-600">{order.customerPhone}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">SHIPPING ADDRESS</h4>
              <p className="text-sm text-gray-600 leading-relaxed flex items-start">
                <MapPin size={14} className="mr-2 mt-1 shrink-0 text-gray-400" />
                {order.shippingAddress}
              </p>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center">
              <Store size={14} className="mr-2" /> Vendor Details
            </h3>
            <div className="font-medium text-gray-900">{order.vendorName}</div>
            <div className="text-sm text-gray-500">ID: {order.vendorId}</div>
          </div>

          {/* Payment Info */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center">
              <CreditCard size={14} className="mr-2" /> Payment Info
            </h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Mode</span>
              <span className="text-sm font-medium text-gray-900">{order.paymentMode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                order.paymentStatus === 'Refunded' ? 'bg-purple-100 text-purple-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Delivery Partner */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center">
              <Truck size={14} className="mr-2" /> Delivery
            </h3>
            <div className="text-sm text-gray-900 font-medium">{order.deliveryPartner || 'Not Assigned'}</div>
            {order.trackingId && (
              <div className="mt-2 text-xs text-gray-500">
                Tracking ID: <span className="font-mono text-gray-700">{order.trackingId}</span>
              </div>
            )}
            <button
              onClick={handleAssignPartner}
              className="mt-3 w-full py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              {order.deliveryPartner ? 'Change Partner' : 'Assign Partner'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

