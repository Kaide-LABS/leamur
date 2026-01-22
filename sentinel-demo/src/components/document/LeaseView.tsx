"use client";

import type { LeaseClause } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LeaseViewProps {
  clause: LeaseClause;
  highlightParagraph?: boolean;
}

export function LeaseView({ clause, highlightParagraph = false }: LeaseViewProps) {
  // Split the clause text into paragraphs for individual rendering
  const paragraphs = clause.text.split("\n\n");

  return (
    <div className="paper-texture rounded-lg shadow-md border border-slate/10 p-6">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate/20">
        <p className="text-xs uppercase tracking-wide text-slate mb-1">Lease Excerpt</p>
        <h2 className="text-lg font-bold text-navy font-serif">
          Clause {clause.clauseNumber}: {clause.title}
        </h2>
      </div>

      {/* Clause Text */}
      <div className="space-y-4 font-serif text-sm leading-relaxed text-navy">
        {paragraphs.map((paragraph, index) => {
          const isRelevant = highlightParagraph && paragraph.includes(clause.relevantParagraph);

          return (
            <p
              key={index}
              className={cn(
                "transition-all duration-300",
                isRelevant && "bg-danger/10 border-l-4 border-danger pl-3 py-1 -ml-3"
              )}
            >
              {paragraph}
            </p>
          );
        })}
      </div>

      {/* Reference Footer */}
      {highlightParagraph && (
        <div className="mt-6 pt-4 border-t border-slate/20">
          <p className="text-xs text-slate">
            <span className="font-semibold text-danger">Relevant exclusion:</span>{" "}
            {clause.relevantParagraph}
          </p>
        </div>
      )}
    </div>
  );
}
