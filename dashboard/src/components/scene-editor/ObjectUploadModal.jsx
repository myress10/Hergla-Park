import { useState, useRef } from 'react';
import { Upload, X, Loader2, Package, Image as ImageIcon } from 'lucide-react';
import Modal from '../Modal';
import { uploadObject3D } from '../../api/objects3dApi';
import toast from 'react-hot-toast';

const CATEGORIES = ['Mobilier', 'Déco', 'Signalétique', 'Véhicule', 'Structure', 'Végétation', 'Autre'];

/**
 * Modal for uploading a new .glb 3D object to the catalog.
 *
 * @param {boolean}  isOpen   - whether the modal is visible
 * @param {function} onClose  - callback to close the modal
 * @param {function} onUploaded - callback with newly created Object3D
 */
export default function ObjectUploadModal({ isOpen, onClose, onUploaded }) {
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('');
  const [glbFile, setGlbFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const glbInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  const handleGlbChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setGlbFile(file);
  };

  const handleThumbChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbFile(file);
      setThumbPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!glbFile || !nom || !categorie) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('nom', nom);
      formData.append('categorie', categorie);
      formData.append('model', glbFile);
      if (thumbFile) formData.append('thumbnail', thumbFile);

      const res = await uploadObject3D(formData);
      toast.success('Objet importé avec succès');
      if (onUploaded) onUploaded(res.data.data || res.data);
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'importation");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setNom('');
    setCategorie('');
    setGlbFile(null);
    setThumbFile(null);
    setThumbPreview(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importer un objet 3D">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom de l'objet</label>
          <input
            id="upload-object-nom"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            placeholder="Ex: Chaise de karting"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Catégorie</label>
          <select
            id="upload-object-categorie"
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">— Sélectionner —</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* GLB file */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Fichier 3D (.glb)</label>
          <button
            type="button"
            onClick={() => glbInputRef.current?.click()}
            className={`w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl text-sm transition-colors
              ${glbFile ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            <Package size={18} className={glbFile ? 'text-indigo-500' : 'text-slate-400'} />
            <span className="truncate">{glbFile ? glbFile.name : 'Choisir un fichier .glb'}</span>
            {glbFile && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setGlbFile(null); if (glbInputRef.current) glbInputRef.current.value = ''; }}
                className="ms-auto text-slate-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            )}
          </button>
          <input
            ref={glbInputRef}
            id="upload-object-glb"
            type="file"
            accept=".glb,.gltf"
            onChange={handleGlbChange}
            className="hidden"
          />
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Vignette (optionnel)</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => thumbInputRef.current?.click()}
              className={`flex-1 flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl text-sm transition-colors
                ${thumbFile ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
              <ImageIcon size={18} className={thumbFile ? 'text-indigo-500' : 'text-slate-400'} />
              <span className="truncate">{thumbFile ? thumbFile.name : 'Choisir une image'}</span>
            </button>
            {thumbPreview && (
              <img src={thumbPreview} alt="preview" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
            )}
          </div>
          <input
            ref={thumbInputRef}
            id="upload-object-thumbnail"
            type="file"
            accept="image/*"
            onChange={handleThumbChange}
            className="hidden"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={uploading || !glbFile || !nom || !categorie}
            id="upload-object-submit"
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Importation...' : 'Importer'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200"
          >
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  );
}
