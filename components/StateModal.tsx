import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { StateCreate, State } from '../types/state';

interface StateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StateCreate) => Promise<void>;
    initialData?: State | null;
    title: string;
}

export default function StateModal({ isOpen, onClose, onSubmit, initialData, title }: StateModalProps) {
    const [formData, setFormData] = useState<Partial<StateCreate> & { active?: boolean }>({
        active: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const { id, ...rest } = initialData;
                setFormData(rest);
            } else {
                setFormData({
                    active: true,
                    code: '',
                    state: '',
                    capital: ''
                });
            }
            setError(null);
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            // Ensure required fields are present
            if (!formData.code || !formData.state || !formData.capital) {
                setError('All fields are required');
                return;
            }
            await onSubmit(formData as StateCreate);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save state');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form id="state-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
                            <input
                                name="code"
                                value={formData.code || ''}
                                onChange={handleChange}
                                placeholder="e.g., OG"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State Name</label>
                            <input
                                name="state"
                                value={formData.state || ''}
                                onChange={handleChange}
                                placeholder="e.g., Ogun"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capital</label>
                            <input
                                name="capital"
                                value={formData.capital || ''}
                                onChange={handleChange}
                                placeholder="e.g., Abeokuta"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Only show Active toggle if editing (usually) or if creating allows setting active. 
                            The API schema for StateCreate doesn't explicitly have 'active' but StateResponse does. 
                            Looking at BankModal, it sends 'active' in CreateBankDTO. 
                            Looking at state.ts types, StateCreate does NOT have active. 
                            I should check if the API accepts active on creation or if it defaults to true.
                            openapi.json says StateCreate has only code, state, capital.
                            So I will remove the Active toggle from the form data submission or handle it if the backend ignores it.
                            Wait, the StateResponse has active. Let's assume it defaults to true on create. 
                            However, for Update, we might want to toggle it.
                            Check types/state.ts: StateUpdate extends StateCreate.
                            So neither has active in the type definition I created.
                            I should verify if I need to add active to StateUpdate.
                            openapi.json:
                            StateCreate: code, state, capital.
                            StateResponse: id, code, state, capital, active.
                            It seems I cannot update active status via the defined Update endpoint based on openapi.json?!
                            Let's double check openapi.json for PUT /states/{id}.
                            It uses StateCreate schema for request body!
                            So I cannot update active status through the API unless the schema is wrong or I missed something.
                            Wait, let me check openapi.json again.
                            "/states/{id}": put -> requestBody schema: StateCreate.
                            StateCreate properties: code, state, capital.
                            So 'active' is indeed missing from the update payload schema.
                            This might be an API limitation. I will omit the Active toggle for now or assume it's not editable.
                            However, the types I generated in step 37:
                            export interface StateUpdate extends StateCreate {}
                            Correct.
                            I will just render the form without Active toggle for now to be safe, or just keep it in internal state but not submit it if it's not in the type.
                            Actually, looking at the code I just wrote for StateModal:
                            I added active to formData but TS will complain if I pass it to onSubmit which expects StateCreate.
                            I will remove `active` from the form UI for now since the API doesn't seem to support writing it.
                        */}
                    </form>
                </div>

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
                        form="state-form"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Saving...' : 'Save State'}
                    </button>
                </div>
            </div>
        </div>
    );
}
