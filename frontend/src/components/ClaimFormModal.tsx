import React, { useState } from 'react';
import axios from 'axios';
import { X, FilePlus, AlertTriangle, Loader2 } from 'lucide-react';

interface ClaimFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClaimFormModal: React.FC<ClaimFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [claimType, setClaimType] = useState<'IFR' | 'CR' | 'CFR'>('IFR');
  const [districtId, setDistrictId] = useState<string>('DIST_OD_KANDHAMAL');
  const [tehsilId, setTehsilId] = useState<string>('TEH_BALLIGUDA');
  const [villageId, setVillageId] = useState<string>('VIL_DARINGBADI');
  const [areaHectares, setAreaHectares] = useState<string>('2.5');
  const [coordinatesText, setCoordinatesText] = useState<string>(
    '[[83.91, 20.09], [83.94, 20.08], [83.96, 20.12], [83.92, 20.13], [83.91, 20.09]]'
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let parsedCoords: number[][];
      try {
        parsedCoords = JSON.parse(coordinatesText);
      } catch {
        setError('Invalid GeoJSON coordinates format. Must be valid JSON array of points.');
        setLoading(false);
        return;
      }

      const payload = {
        claimType,
        districtId,
        tehsilId,
        villageId,
        areaHectares: parseFloat(areaHectares),
        geometry: {
          type: 'Polygon',
          coordinates: [parsedCoords],
        },
      };

      const res = await axios.post('/api/claims', payload);
      if (res.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.data.error || 'Failed to file claim');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error submitting claim payload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-darkcard border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-forest-400" />
            <h3 className="font-bold text-white text-base">File New FRA Claim</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Claim Type</label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-forest-500 font-mono font-bold"
              >
                <option value="IFR">IFR (Individual Forest Rights)</option>
                <option value="CR">CR (Community Rights)</option>
                <option value="CFR">CFR (Community Forest Resource)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Claim Area (Hectares)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={areaHectares}
                onChange={(e) => setAreaHectares(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-forest-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">District</label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-[11px] text-white focus:outline-none"
              >
                <option value="DIST_OD_KANDHAMAL">Kandhamal</option>
                <option value="DIST_OD_MAYURBHANJ">Mayurbhanj</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tehsil</label>
              <input
                type="text"
                value={tehsilId}
                onChange={(e) => setTehsilId(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-[11px] text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Village</label>
              <input
                type="text"
                value={villageId}
                onChange={(e) => setVillageId(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-[11px] text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Polygon Coordinates [lng, lat] Array
            </label>
            <textarea
              rows={3}
              value={coordinatesText}
              onChange={(e) => setCoordinatesText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-forest-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Must be a closed loop array of at least 5 coordinate points.</p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-forest-600 hover:bg-forest-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-forest-900/30 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Registering Claim...
                </>
              ) : (
                'Save Claim Draft'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
