"use client";

import { memo } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import ContractPDF from "./ContractPDF";

interface ContractPDFSectionProps {
  booking: any;
}

const ContractPDFSection = memo(function ContractPDFSection({ booking }: ContractPDFSectionProps) {
  const hasSavedPdf = !!booking.contractFileUrl;

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* The PDF Document Container */}
      <div className="overflow-hidden rounded-xl border border-slate-200/60 shadow-2xs">
        {hasSavedPdf ? (
          <iframe
            src={booking.contractFileUrl}
            className="w-full h-[600px] sm:h-[650px] border-none bg-slate-50"
            title={`Contrat de location PDF N° ${booking._id}`}
          />
        ) : (
          <PDFViewer className="w-full h-[600px] sm:h-[650px] border-none" showToolbar={true}>
            <ContractPDF booking={booking} />
          </PDFViewer>
        )}
      </div>
    </div>
  );
});

export default ContractPDFSection;
