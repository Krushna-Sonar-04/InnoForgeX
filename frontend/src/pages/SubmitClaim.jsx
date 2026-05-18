import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitClaimApi } from '../api/api';

export default function SubmitClaim() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        patientId: '',
        patientName: '',
        providerId: '',
        providerName: '',
        procedureCode: '',
        diagnosisCode: '',
        claimAmount: '',
        serviceDate: '',
        description: '',
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [fraudResult, setFraudResult] = useState(null);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.patientId.trim()) newErrors.patientId = 'Patient ID is required';
        if (!formData.patientName.trim()) newErrors.patientName = 'Patient name is required';
        if (!formData.providerId.trim()) newErrors.providerId = 'Provider ID is required';
        if (!formData.providerName.trim()) newErrors.providerName = 'Provider name is required';
        if (!formData.procedureCode.trim()) newErrors.procedureCode = 'Procedure code is required';
        if (!formData.diagnosisCode.trim()) newErrors.diagnosisCode = 'Diagnosis code is required';
        if (!formData.claimAmount) newErrors.claimAmount = 'Claim amount is required';
        else if (isNaN(formData.claimAmount) || parseFloat(formData.claimAmount) <= 0)
            newErrors.claimAmount = 'Amount must be a positive number';
        if (!formData.serviceDate) newErrors.serviceDate = 'Service date is required';
        else if (new Date(formData.serviceDate) > new Date())
            newErrors.serviceDate = 'Service date cannot be in the future';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (fraudResult) setFraudResult(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        setFraudResult(null);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock fraud detection result
            const mockScore = Math.floor(Math.random() * 100);
            setFraudResult({
                score: mockScore,
                riskLevel: mockScore >= 70 ? 'high' : mockScore >= 40 ? 'medium' : 'low',
                reasoning: mockScore >= 70 
                    ? 'High anomaly detected: Claim amount significantly exceeds regional average for this procedure.'
                    : mockScore >= 40
                    ? 'Moderate risk: Some billing patterns require additional review.'
                    : 'Low risk: Claim appears consistent with standard billing practices.',
            });
        } catch (err) {
            console.error('Submission error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            patientId: '',
            patientName: '',
            providerId: '',
            providerName: '',
            procedureCode: '',
            diagnosisCode: '',
            claimAmount: '',
            serviceDate: '',
            description: '',
        });
        setErrors({});
        setFraudResult(null);
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-5 page-transition">
            {/* Header */}
            <div className="flex justify-between items-center animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Submit New Claim</h1>
                    <p className="text-gray-500 mt-1">Enter claim details for AI-powered fraud detection</p>
                </div>
                <button 
                    onClick={() => navigate('/claims')}
                    className="px-5 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 text-gray-700 font-medium hover-lift flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Claims
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-[28px] p-7 shadow-sm border border-gray-100 space-y-6 hover-lift animate-slide-in-left">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center transition-all hover:bg-gray-200 hover:scale-110">
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Claim Information</h2>
                        </div>

                        {/* Patient Information */}
                        <div className="space-y-4 animate-fade-in animate-delay-100">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Patient ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="patientId"
                                        value={formData.patientId}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all ${
                                            errors.patientId ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                        placeholder="P-12345"
                                    />
                                    {errors.patientId && <p className="text-red-500 text-xs mt-1">{errors.patientId}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Patient Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="patientName"
                                        value={formData.patientName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all ${
                                            errors.patientName ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                        placeholder="John Doe"
                                    />
                                    {errors.patientName && <p className="text-red-500 text-xs mt-1">{errors.patientName}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Provider Information */}
                        <div className="space-y-4 animate-fade-in animate-delay-200">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Provider ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="providerId"
                                        value={formData.providerId}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all ${
                                            errors.providerId ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                        placeholder="PROV-9876"
                                    />
                                    {errors.providerId && <p className="text-red-500 text-xs mt-1">{errors.providerId}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Provider Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="providerName"
                                        value={formData.providerName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all ${
                                            errors.providerName ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                        placeholder="City Hospital"
                                    />
                                    {errors.providerName && <p className="text-red-500 text-xs mt-1">{errors.providerName}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Medical Codes */}
                        <div className="space-y-4 animate-fade-in animate-delay-300">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medical Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Procedure Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="procedureCode"
                                        value={formData.procedureCode}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all ${
                                            errors.procedureCode ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                        placeholder="99213"
                                    />
                                    {errors.procedureCode && <p className="text-red-500 text-xs mt-1">{errors.procedureCode}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Diagnosis Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="diagnosisCode"
                                        value={formData.diagnosisCode}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all ${
                                            errors.diagnosisCode ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                        placeholder="M54.5"
                                    />
                                    {errors.diagnosisCode && <p className="text-red-500 text-xs mt-1">{errors.diagnosisCode}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Claim Details */}
                        <div className="space-y-4 animate-fade-in animate-delay-400">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Claim Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Claim Amount ($) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="claimAmount"
                                        value={formData.claimAmount}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all ${
                                            errors.claimAmount ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                        placeholder="0.00"
                                    />
                                    {errors.claimAmount && <p className="text-red-500 text-xs mt-1">{errors.claimAmount}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Service Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="serviceDate"
                                        value={formData.serviceDate}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all ${
                                            errors.serviceDate ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                    />
                                    {errors.serviceDate && <p className="text-red-500 text-xs mt-1">{errors.serviceDate}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="animate-fade-in animate-delay-500">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Notes (Optional)
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all resize-none"
                                placeholder="Additional information about the claim..."
                            />
                            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analyzing...
                                    </span>
                                ) : (
                                    'Submit Claim'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={submitting}
                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all disabled:opacity-50"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>

                {/* Fraud Detection Result */}
                <div className="lg:col-span-1">
                    {submitting ? (
                        <div className="bg-white rounded-[28px] p-7 shadow-sm border border-gray-100 flex flex-col items-center justify-center h-full min-h-[400px] animate-scale-in">
                            <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-600 text-center font-medium">Analyzing claim with AI...</p>
                            <p className="text-gray-400 text-sm text-center mt-2">This may take a few seconds</p>
                        </div>
                    ) : fraudResult ? (
                        <div className="bg-white rounded-[28px] p-7 shadow-sm border border-gray-100 space-y-6 hover-lift animate-slide-in-right">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Fraud Analysis</h2>
                            </div>
                            
                            {/* Risk Score Circle */}
                            <div className="flex flex-col items-center py-6 animate-bounce-in">
                                <div className="relative w-36 h-36">
                                    <svg className="transform -rotate-90 w-36 h-36">
                                        <circle cx="72" cy="72" r="64" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                                        <circle 
                                            cx="72" 
                                            cy="72" 
                                            r="64" 
                                            stroke={fraudResult.score >= 70 ? '#ef4444' : fraudResult.score >= 40 ? '#f59e0b' : '#10b981'}
                                            strokeWidth="10" 
                                            fill="none"
                                            strokeDasharray={`${(fraudResult.score / 100) * 402} 402`}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold text-gray-900">{fraudResult.score}</span>
                                        <span className="text-xs text-gray-500 font-medium">Risk Score</span>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                                        fraudResult.riskLevel === 'high' ? 'bg-red-50 text-red-700' :
                                        fraudResult.riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                                        'bg-green-50 text-green-700'
                                    }`}>
                                        {fraudResult.riskLevel === 'high' ? 'High Risk' :
                                         fraudResult.riskLevel === 'medium' ? 'Medium Risk' : 'Low Risk'}
                                    </span>
                                </div>
                            </div>

                            {/* AI Reasoning */}
                            <div className="border-t border-gray-100 pt-6 animate-fade-in animate-delay-300">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">AI Analysis</h3>
                                <p className="text-gray-700 text-sm leading-relaxed">{fraudResult.reasoning}</p>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 animate-fade-in animate-delay-400">
                                <button 
                                    onClick={() => navigate('/claims')}
                                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all transform hover:scale-[1.02]"
                                >
                                    View All Claims
                                </button>
                                <button 
                                    onClick={handleReset}
                                    className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
                                >
                                    Submit Another
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-[28px] p-7 border border-gray-200 h-full min-h-[400px] flex flex-col items-center justify-center text-center hover-lift animate-slide-in-right">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Fraud Detection</h3>
                            <p className="text-sm text-gray-600 max-w-xs">
                                Fill out the form and submit to get instant AI-powered fraud risk analysis
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
