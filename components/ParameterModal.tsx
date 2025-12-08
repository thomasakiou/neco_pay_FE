import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Parameter, CreateParameterDTO } from '../types/parameter';

interface ParameterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateParameterDTO) => Promise<void>;
    initialData?: Parameter | null;
    title: string;
}

export default function ParameterModal({ isOpen, onClose, onSubmit, initialData, title }: ParameterModalProps) {
    const [formData, setFormData] = useState<CreateParameterDTO>({
        contiss: '',
        pernight: 0,
        local: 0,
        kilometer: 0,
        active: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                contiss: initialData.contiss || '',
                pernight: initialData.pernight || 0,
                local: initialData.local || 0,
                kilometer: initialData.kilometer || 0,
                active: initialData.active ?? true,
            });
        } else {
            setFormData({
                contiss: '',
                pernight: 0,
                local: 0,
                kilometer: 0,
                active: true,
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="parameterForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contiss</label>
                            <input
                                type="text"
                                required
                                value={formData.contiss || ''}
                                onChange={(e) => setFormData({ ...formData, contiss: e.target.value })}
                                className="w-full h-11 px-4 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all text-sm"
                                placeholder="Enter Contiss"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Per Night</label>
                                <input
                                    type="number"
                                    value={formData.pernight || ''}
                                    onChange={(e) => setFormData({ ...formData, pernight: Number(e.target.value) })}
                                    className="w-full h-11 px-4 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all text-sm"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                                <input
                                    type="number"
                                    value={formData.local || ''}
                                    onChange={(e) => setFormData({ ...formData, local: Number(e.target.value) })}
                                    className="w-full h-11 px-4 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all text-sm"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kilometer</label>
                            <input
                                type="number"
                                value={formData.kilometer || ''}
                                onChange={(e) => setFormData({ ...formData, kilometer: Number(e.target.value) })}
                                className="w-full h-11 px-4 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all text-sm"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="active"
                                checked={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <label htmlFor="active" className="text-sm font-medium text-gray-700 select-none cursor-pointer">Active Status</label>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-white hover:border-gray-300 border border-transparent rounded-lg transition-all">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="parameterForm"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-70 flex items-center gap-2 transition-all"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'Saving...' : 'Save Parameter'}
                    </button>
                </div>
            </div>
        </div>
    );
}
