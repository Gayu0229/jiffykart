import React, { useState } from 'react';
import { X, MessageSquareWarning, Send, CheckCircle, Loader2 } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface ComplaintModalProps {
    onClose: () => void;
    initialOrderId?: string;
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({ onClose, initialOrderId }) => {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [formData, setFormData] = useState({
        issueType: '',
        orderId: initialOrderId || '',
        description: '',
        contact: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await ApiService.createTicket({
                subject: `Complaint: ${formData.issueType} (Order: ${formData.orderId})`,
                category: formData.issueType.toUpperCase(),
                description: formData.description,
                orderId: formData.orderId ? Number(formData.orderId.replace(/\D/g, '')) : undefined,
                priority: 'MEDIUM'
            });

            setTicketId(result.ticketId);
            setStep('success');
        } catch (error) {
            console.error("Failed to submit complaint", error);
            alert("Failed to submit complaint. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
                <div className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 text-center shadow-2xl animate-slide-up">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Complaint Registered</h3>
                    <p className="text-gray-500 mb-8">
                        Ticket #{ticketId} has been created.<br />
                        Our support team will contact you within 24 hours.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full relative z-10 shadow-2xl animate-slide-up border border-white/20">

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                            <MessageSquareWarning size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Raise a Complaint</h3>
                            <p className="text-xs text-gray-500">We are here to resolve your issues</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Issue Type</label>
                        <select
                            required
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:outline-none transition font-medium text-gray-700"
                            value={formData.issueType}
                            onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                        >
                            <option value="" disabled>Select Issue Type</option>
                            <option value="delivery">Late Delivery / Driver Issue</option>
                            <option value="product">Product Damaged / Missing Item</option>
                            <option value="payment">Payment / Refund Issue</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Order ID</label>
                        <input
                            type="text"
                            readOnly={!!initialOrderId}
                            placeholder="e.g. ORD-2023-001"
                            className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:outline-none transition font-medium ${initialOrderId ? 'opacity-70 cursor-not-allowed' : ''}`}
                            value={formData.orderId}
                            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Description</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Describe your issue in detail..."
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:outline-none transition font-medium"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-red-500 text-white font-bold py-4 rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <>Submitting... <Loader2 className="animate-spin" size={18} /></>
                            ) : (
                                <>Submit Complaint <Send size={18} /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};