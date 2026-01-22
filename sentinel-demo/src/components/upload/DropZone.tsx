"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFileSelect: (file: File | null) => void;
  onAnalyze: () => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelect, onAnalyze, disabled = false }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type === "application/pdf") {
        setError(null);
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        setError("Only PDF files are supported");
        setTimeout(() => setError(null), 3000);
      }
    }
  }, [disabled, onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    if (!disabled && !selectedFile) {
      inputRef.current?.click();
    }
  }, [disabled, selectedFile]);

  return (
    <div className="space-y-4">
      {/* Drop Zone Area */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8",
          "flex flex-col items-center justify-center gap-3",
          "transition-all duration-150 cursor-pointer",
          "min-h-[180px]",
          disabled && "opacity-50 cursor-not-allowed",
          isDragOver
            ? "border-accent bg-accent/5"
            : "border-slate/30 hover:border-slate/50 hover:bg-slate/5",
          selectedFile && "border-success/50 bg-success/5 cursor-default",
          error && "border-error/50 bg-error/5"
        )}
        whileHover={!disabled && !selectedFile ? { scale: 1.01 } : {}}
        whileTap={!disabled && !selectedFile ? { scale: 0.99 } : {}}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {selectedFile ? (
          <>
            <FileText className="h-10 w-10 text-success" />
            <div className="text-center">
              <p className="text-sm font-medium text-navy">{selectedFile.name}</p>
              <p className="text-xs text-slate mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearFile();
              }}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate/10 transition-colors"
              disabled={disabled}
            >
              <X className="h-4 w-4 text-slate" />
            </button>
          </>
        ) : (
          <>
            <Upload
              className={cn(
                "h-10 w-10 transition-colors",
                isDragOver ? "text-accent" : "text-slate/50",
                error && "text-error"
              )}
            />
            <div className="text-center">
              {error ? (
                <p className="text-sm font-medium text-error">{error}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-navy">
                    Drop Invoice PDF here
                  </p>
                  <p className="text-xs text-slate mt-1">
                    or click to browse
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Analyze Button */}
      <motion.button
        onClick={onAnalyze}
        disabled={disabled || !selectedFile}
        className={cn(
          "w-full py-3 px-6 rounded-lg font-semibold text-sm",
          "transition-colors duration-150",
          selectedFile && !disabled
            ? "bg-blue-700 text-white hover:bg-blue-800"
            : "bg-slate/20 text-slate/50 cursor-not-allowed"
        )}
        whileHover={selectedFile && !disabled ? { scale: 1.02 } : {}}
        whileTap={selectedFile && !disabled ? { scale: 0.98 } : {}}
      >
        Analyze Invoice
      </motion.button>
    </div>
  );
}
