"use client";

import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import ContractPDF from "./ContractPDF";
import { Printer, FileText } from "lucide-react";
import { prettyDisplayDate } from "@/lib/date";

interface ContractPDFSectionProps {
  booking: any;
  logoUrl: string;
}

export default function ContractPDFSection({ booking, logoUrl }: ContractPDFSectionProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top download button */}
      <div className="flex justify-end print:hidden">
        <PDFDownloadLink
          document={<ContractPDF booking={booking} logoUrl={logoUrl} />}
          fileName={`contrat_location_${booking._id}.pdf`}
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
        >
          {({ loading }) => (
            <>
              <Printer className="w-3.5 h-3.5" />
              <span>{loading ? "Génération..." : "Télécharger PDF"}</span>
            </>
          )}
        </PDFDownloadLink>
      </div>

      {/* The PDF Document Container */}
      <div className="overflow-hidden rounded-xl border border-slate-200/60 shadow-2xs">
        <PDFViewer className="w-full h-[600px] sm:h-[650px] border-none" showToolbar={true}>
          <ContractPDF booking={booking} logoUrl={logoUrl} />
        </PDFViewer>
      </div>
    </div>
  );
}
