import React, { useState } from 'react';
import axios from 'axios';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EvidenceUploadModalProps {
  claimId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  claimId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { tokens, refreshTokenNow } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('Gram Sabha Resolution');
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      // 5MB Client Pre-Validation
      if (selected.size > 5 * 1024 * 1024) {
        setError('File size exceeds maximum 5MB limit.');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
      // Pre-flight check: ensure active tokens or refresh if expired
      let activeAccessToken = tokens?.accessToken;
      const savedTokens = localStorage.getItem('vansetu_tokens');
      if (savedTokens) {
        activeAccessToken = JSON.parse(savedTokens).accessToken;
      }

      const res = await axios.post(`/api/claims/${claimId}/evidence`, formData, {
        headers: activeAccessToken ? { Authorization: `Bearer ${activeAccessToken}` } : undefined,
      });

      if (res.data.success) {
        setSuccessMsg('Evidence document uploaded and verified successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(res.data.error || 'Upload failed');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Attempt pre-flight token refresh once more
        const refreshedToken = await refreshTokenNow();
        if (refreshedToken) {
          try {
            const retryRes = await axios.post(`/api/claims/${claimId}/evidence`, formData, {
              headers: { Authorization: `Bearer ${refreshedToken}` },
            });
            if (retryRes.data.success) {
              setSuccessMsg('Evidence document uploaded and verified successfully!');
              setTimeout(() => {
                onSuccess();
                onClose();
              }, 1200);
              return;
            }
          } catch (retryErr: any) {
            setError(retryErr.response?.data?.error || 'Session expired. Please log in again.');
            return;
          }
        }
        setError('Session expired. Please log in again to upload evidence.');
      } else {
        setError(err.response?.data?.error || 'Error uploading evidence document');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-darkcard border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-forest-400" />
            <h3 className="font-bold text-white text-base">Upload Verified Evidence</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleUpload} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Document Category</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-forest-500"
            >
              <option value="Gram Sabha Resolution">Gram Sabha Resolution</option>
              <option value="Boundary Verification Map">Boundary Verification Map</option>
              <option value="Ancestral Occupancy Proof">Ancestral Occupancy Proof</option>
              <option value="Field Inspection Photo">Field Inspection Photo</option>
              <option value="Other Evidence Document">Other Evidence Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select File (PDF, JPEG, PNG - Max 5MB)</label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-forest-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-900/50">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              {file ? (
                <div>
                  <p className="text-xs font-medium text-forest-300">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-300 font-medium">Click or drag file to upload</p>
                  <p className="text-[10px] text-slate-500">Supports PDF, JPEG, PNG (5MB Max)</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-5 py-2 bg-forest-600 hover:bg-forest-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-forest-900/30 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading & Verifying...
                </>
              ) : (
                'Upload Evidence'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
