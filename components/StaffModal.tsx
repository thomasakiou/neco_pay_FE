import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { CreateStaffDTO, Staff } from '../types/staff';

interface StaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateStaffDTO) => Promise<void>;
    initialData?: Staff | null;
    title: string;
}

export default function StaffModal({ isOpen, onClose, onSubmit, initialData, title }: StaffModalProps) {
    const [formData, setFormData] = useState<Partial<CreateStaffDTO>>({
        active: true, // Default active
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const { id, created_at, ...rest } = initialData;
                setFormData(rest);
            } else {
                // Reset for new entry
                setFormData({
                    active: true,
                    staff_id: '',
                    name1: '', // Using name1 as the primary name field
                    surname: '', // Will be derived
                    firstname: '' // Will be derived
                });
            }
            setError(null);
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation now checks for name1 instead of surname/firstname directly from user input
        if (!formData.staff_id || !formData.name1) {
            setError("Staff ID and Full Name are required.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Derive surname and firstname from name1 for API compatibility
            const fullNameParts = formData.name1.trim().split(' ');
            const derivedSurname = fullNameParts[0] || 'Unknown';
            const derivedFirstname = fullNameParts.slice(1).join(' ') || 'Unknown';

            const submissionData: CreateStaffDTO = {
                ...formData as CreateStaffDTO,
                surname: derivedSurname,
                firstname: derivedFirstname,
                name1: formData.name1 // Ensure name1 is sent
            };

            await onSubmit(submissionData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save staff');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form id="staff-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Required Fields */}
                        <div className="sm:col-span-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Core Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Staff ID (Per No) *</label>
                                    <input
                                        name="staff_id"
                                        value={formData.staff_id || ''}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                        placeholder="e.g. 12345"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Full Name *</label>
                                    <input
                                        name="name1"
                                        value={formData.name1 || ''}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                        placeholder="Surname Firstname"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Other Fields */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Department</label>
                            <input
                                name="department"
                                value={formData.department || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Location</label>
                            <input
                                name="location"
                                value={formData.location || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">State</label>
                            <input
                                name="state"
                                value={formData.state || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Level</label>
                            <input
                                name="level"
                                value={formData.level || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Step</label>
                            <input
                                name="step"
                                value={formData.step || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-2">Bank Details</h3>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Bank Name</label>
                            <input
                                name="bank_name"
                                value={formData.bank_name || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Account No</label>
                            <input
                                name="account_no"
                                value={formData.account_no || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Bank Code</label>
                            <input
                                name="bank_code"
                                value={formData.bank_code || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Sort Code</label>
                            <input
                                name="sortcode"
                                value={formData.sortcode || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>

                        <div className="sm:col-span-2 pt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={formData.active || false}
                                    onChange={(e) => setFormData(p => ({ ...p, active: e.target.checked }))}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Active Status</span>
                            </label>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="staff-form"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Saving...' : 'Save Staff'}
                    </button>
                </div>
            </div>
        </div>
    );
}
