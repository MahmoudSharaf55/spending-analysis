import React, { useState } from 'react';
import { Upload, FileText, RotateCcw, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface UploadSectionProps {
  loading: boolean;
  error: string | null;
  hasReport: boolean;
  onAnalyzeFile: (file: File) => void;
  onReset: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  loading,
  error,
  hasReport,
  onAnalyzeFile,
  onReset
}) => {
  const { t } = useLanguage();
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAnalyzeClick = () => {
    if (selectedFile) {
      onAnalyzeFile(selectedFile);
    }
  };

  const handleResetClick = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('statement-file-input') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = '';
    }
    onReset();
  };

  const canReset = !!selectedFile || hasReport || !!error;

  return (
    <section className="card upload-card">
      <div className="card-header-clean">
        <h2 className="card-title-text">{t.uploadTitle}</h2>
        <span className="badge badge-info">{t.pdfCsvSupported}</span>
      </div>

      <div className="upload-grid">
        {/* Dropzone */}
        <div
          className={`dropzone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('statement-file-input')?.click()}
        >
          <input
            id="statement-file-input"
            type="file"
            accept=".pdf,.csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div className="dropzone-icon">
            <Upload size={28} />
          </div>
          <p className="dropzone-title">
            <strong>{t.dragDrop}</strong>, {t.orBrowse}
          </p>
          <p className="dropzone-subtitle">{t.uploadLimit}</p>
        </div>

        {/* Action Panel */}
        <div className="upload-actions-panel">
          <div className="selected-file-info">
            {selectedFile ? (
              <div className="file-pill">
                <FileText size={18} className="file-icon" />
                <div className="file-meta">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
            ) : (
              <p className="no-file-text">{t.noFileSelected}</p>
            )}
          </div>

          <button
            className="btn btn-primary btn-block"
            disabled={!selectedFile || loading}
            onClick={handleAnalyzeClick}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="spin-icon" />
                <span>{t.analyzing}</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>{t.analyzeFile}</span>
              </>
            )}
          </button>

          <button
            className="btn btn-secondary btn-block"
            disabled={loading || !canReset}
            onClick={handleResetClick}
          >
            <RotateCcw size={16} />
            <span>{t.reset}</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-box">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
};
