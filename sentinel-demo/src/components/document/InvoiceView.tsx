"use client";

import type { Invoice, LineItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { HighlightOverlay } from "./HighlightOverlay";

interface InvoiceViewProps {
  invoice: Invoice;
  highlightedItemId?: number | null;
  onItemClick?: (item: LineItem) => void;
}

export function InvoiceView({ invoice, highlightedItemId, onItemClick }: InvoiceViewProps) {
  return (
    <div className="paper-texture rounded-lg shadow-md border border-slate/10 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate/20">
        <div>
          <h2 className="text-xl font-bold text-navy">SERVICE CHARGE INVOICE</h2>
          <p className="text-sm text-slate mt-1">{invoice.landlord}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm text-navy font-semibold">{invoice.id}</p>
          <p className="text-sm text-slate">{invoice.period}</p>
        </div>
      </div>

      {/* Property Info */}
      <div className="mb-6 pb-4 border-b border-slate/20">
        <p className="text-xs uppercase tracking-wide text-slate mb-1">Property</p>
        <p className="text-sm text-navy">{invoice.property}</p>
      </div>

      {/* Line Items Table */}
      <div className="mb-6">
        <table className="w-full">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate border-b border-slate/20">
              <th className="text-left pb-2 w-8">#</th>
              <th className="text-left pb-2">Description</th>
              <th className="text-right pb-2 w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "relative border-b border-slate/10 last:border-0",
                  onItemClick && "cursor-pointer hover:bg-slate/5 transition-colors",
                  !item.valid && "text-danger"
                )}
                onClick={() => onItemClick?.(item)}
              >
                <td className="py-3 text-sm font-mono text-slate">{item.id}</td>
                <td className="py-3 text-sm">{item.description}</td>
                <td className="py-3 text-sm font-mono text-right">
                  £{item.amount.toLocaleString()}
                </td>
                {/* Highlight overlay for flagged item */}
                {highlightedItemId === item.id && (
                  <td className="absolute inset-0 p-0">
                    <HighlightOverlay isActive={true} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-4 border-t-2 border-navy">
        <span className="text-sm font-semibold text-navy uppercase tracking-wide">Total Due</span>
        <span className="text-xl font-mono font-bold text-navy">
          £{invoice.totalAmount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
