"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Check, Mail, FileText } from "lucide-react";
import type { Invoice, LineItem, LeaseClause } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  flaggedItem: LineItem;
  clause: LeaseClause;
}

function generateEmailDraft(
  invoice: Invoice,
  flaggedItem: LineItem,
  clause: LeaseClause
): string {
  return `Dear ${invoice.landlord},

Re: Service Charge Dispute - ${invoice.id}
Property: ${invoice.property}
Period: ${invoice.period}

I am writing to formally dispute the following charge included in the above-referenced service charge invoice:

DISPUTED ITEM:
- Description: ${flaggedItem.description}
- Amount: £${flaggedItem.amount.toLocaleString()}
- Line Item #: ${flaggedItem.id}

GROUNDS FOR DISPUTE:
Pursuant to Clause ${clause.clauseNumber} (${clause.title}) of the lease agreement, the Tenant is expressly excluded from contributing towards certain costs. Specifically, paragraph (iii) states:

"${clause.relevantParagraph}"

The charge for "${flaggedItem.description}" falls squarely within this exclusion provision, as it relates to cleaning of the exterior facade of the Building.

REQUESTED ACTION:
We respectfully request that this charge be removed from the current service charge demand and that a revised invoice reflecting the corrected amount of £${(invoice.totalAmount - flaggedItem.amount).toLocaleString()} be issued at your earliest convenience.

We trust this matter can be resolved amicably and look forward to your prompt response within 14 days of this letter.

Yours faithfully,

[Tenant Name]
[Position]
[Company Name]`;
}

export function DisputeModal({
  isOpen,
  onClose,
  invoice,
  flaggedItem,
  clause,
}: DisputeModalProps) {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const emailDraft = generateEmailDraft(invoice, flaggedItem, clause);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Focus the close button when modal opens
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap - keep focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispute-modal-title"
            aria-describedby="dispute-modal-description"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="bg-surface rounded-xl shadow-2xl border border-slate/20 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-slate/10 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Mail className="h-5 w-5 text-accent" aria-hidden="true" />
                    </div>
                    <div>
                      <h2
                        id="dispute-modal-title"
                        className="text-lg font-semibold text-navy"
                      >
                        Dispute Letter Draft
                      </h2>
                      <p
                        id="dispute-modal-description"
                        className="text-sm text-slate mt-0.5"
                      >
                        Professional letter citing Clause {clause.clauseNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="p-3 -m-1 rounded-lg hover:bg-slate/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <X className="h-5 w-5 text-slate" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Content - tabindex for keyboard scrolling */}
              <div className="p-6 overflow-y-auto flex-1" tabIndex={0}>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-error/5 border border-error/20">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-error" aria-hidden="true" />
                      <span className="text-xs font-medium text-slate">
                        Disputed Charge
                      </span>
                    </div>
                    <p className="text-sm font-medium text-navy">
                      {flaggedItem.description}
                    </p>
                    <p className="text-lg font-bold text-red-700 mt-1">
                      £{flaggedItem.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      <span className="text-xs font-medium text-slate">
                        Revised Amount
                      </span>
                    </div>
                    <p className="text-sm font-medium text-navy">
                      After Dispute Resolution
                    </p>
                    <p className="text-lg font-bold text-emerald-700 mt-1">
                      £{(invoice.totalAmount - flaggedItem.amount).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Email Preview */}
                <div className="relative">
                  <div className="absolute -top-3 left-4 px-2 bg-surface text-xs font-medium text-slate">
                    Email Draft
                  </div>
                  <div className="p-4 rounded-lg border border-slate/20 bg-white">
                    <pre className="text-sm text-navy whitespace-pre-wrap font-sans leading-relaxed">
                      {emailDraft}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate">
                    AI-generated draft. Review before sending.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-slate hover:text-navy transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white",
                        copied
                          ? "bg-emerald-700 text-white"
                          : "bg-accent text-white hover:bg-accent-hover"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" aria-hidden="true" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" aria-hidden="true" />
                          Copy to Clipboard
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
