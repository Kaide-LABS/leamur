"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, FileText, X, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiDropZoneProps {
  onFilesChange: (files: File[]) => void;
  onAnalyze: () => void;
  disabled?: boolean;
  maxFiles?: number;
  minFiles?: number;
}

export function MultiDropZone({
  onFilesChange,
  onAnalyze,
  disabled = false,
  maxFiles = 20,
  minFiles = 2,
}: MultiDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles = Array.from(files).filter((file) => {
        // Accept both PDF and TXT for demo purposes
        const validTypes = ["application/pdf", "text/plain"];
        const validExtensions = [".pdf", ".txt"];
        const hasValidType = validTypes.includes(file.type);
        const hasValidExtension = validExtensions.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );
        return hasValidType || hasValidExtension;
      });

      if (newFiles.length === 0) {
        setError("Only PDF files are supported");
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Combine with existing files, limit to maxFiles
      const combined = [...selectedFiles, ...newFiles].slice(0, maxFiles);
      setSelectedFiles(combined);
      onFilesChange(combined);
      setError(null);
    },
    [selectedFiles, maxFiles, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      processFiles(e.dataTransfer.files);
    },
    [disabled, processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      // Reset input so same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [processFiles]
  );

  const handleRemoveFile = useCallback(
    (filename: string) => {
      const updated = selectedFiles.filter((f) => f.name !== filename);
      setSelectedFiles(updated);
      onFilesChange(updated);
    },
    [selectedFiles, onFilesChange]
  );

  const handleClick = useCallback(() => {
    if (!disabled && selectedFiles.length < maxFiles) {
      inputRef.current?.click();
    }
  }, [disabled, selectedFiles.length, maxFiles]);

  const isReady = selectedFiles.length >= minFiles;
  const isFull = selectedFiles.length >= maxFiles;

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate">
          {selectedFiles.length} lease{selectedFiles.length !== 1 ? 's' : ''} selected
          {!isReady && ` (min ${minFiles})`}
        </span>
        {isReady && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1 text-success font-medium"
          >
            <Check className="h-4 w-4" />
            Ready to analyze
          </motion.span>
        )}
      </div>

      {/* Drop Zone Area */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6",
          "transition-all duration-150",
          disabled && "opacity-50 cursor-not-allowed",
          selectedFiles.length < maxFiles && !disabled && "cursor-pointer",
          isDragOver
            ? "border-accent bg-accent/5"
            : "border-slate/30 hover:border-slate/50 hover:bg-slate/5",
          isReady && "border-success/50 bg-success/5",
          error && "border-error/50 bg-error/5"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          multiple
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {/* File List */}
        {selectedFiles.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {selectedFiles.map((file) => (
                <motion.div
                  key={file.name}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate/10 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-navy">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(file.name);
                    }}
                    className="p-1 rounded-full hover:bg-slate/10 transition-colors"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4 text-slate" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add more files prompt */}
            {!isFull && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 py-4 text-slate text-sm"
              >
                <Upload className="h-4 w-4" />
                <span>
                  {isReady
                    ? "Add more leases or click Analyze"
                    : `Add ${minFiles - selectedFiles.length} more lease${minFiles - selectedFiles.length === 1 ? '' : 's'} to continue`}
                </span>
              </motion.div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Upload
              className={cn(
                "h-10 w-10 transition-colors",
                isDragOver ? "text-accent" : "text-slate/50",
                error && "text-error"
              )}
            />
            <div className="text-center">
              {error ? (
                <div className="flex items-center gap-2 text-error">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-navy">
                    Drop lease PDFs here (2-{maxFiles} files)
                  </p>
                  <p className="text-xs text-slate mt-1">or click to browse</p>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Analyze Button */}
      <motion.button
        onClick={onAnalyze}
        disabled={disabled || !isReady}
        className={cn(
          "w-full py-3 px-6 rounded-lg font-semibold text-sm",
          "transition-colors duration-150",
          isReady && !disabled
            ? "bg-accent text-white hover:bg-accent-hover"
            : "bg-slate/20 text-slate/50 cursor-not-allowed"
        )}
        whileHover={isReady && !disabled ? { scale: 1.02 } : {}}
        whileTap={isReady && !disabled ? { scale: 0.98 } : {}}
      >
        {isReady
          ? `Analyze ${selectedFiles.length} Lease${selectedFiles.length !== 1 ? 's' : ''}`
          : `Select at least ${minFiles} leases to analyze`}
      </motion.button>
    </div>
  );
}
