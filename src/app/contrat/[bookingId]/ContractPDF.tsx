import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { prettyDisplayDate } from "@/lib/date";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.5,
    color: "#334155", // slate-700
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 15,
  },
  companyCol: {
    flexDirection: "column",
    gap: 4,
  },
  logoContainer: {
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2d4a36", // brand-primary
  },
  companyDetail: {
    fontSize: 7.5,
    color: "#64748b",
  },
  devisCol: {
    alignItems: "flex-end",
    gap: 3,
  },
  devisTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    letterSpacing: 1,
  },
  devisNumber: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#475569",
  },
  devisDetail: {
    fontSize: 7.5,
    color: "#64748b",
  },
  partiesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 25,
  },
  partyCol: {
    flex: 1,
  },
  partyColClient: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 10,
  },
  partyTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 3,
  },
  partyDetail: {
    fontSize: 8,
    color: "#475569",
    marginBottom: 1.5,
  },
  italic: {
    fontStyle: "italic",
    color: "#64748b",
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 3,
  },
  table: {
    flexDirection: "column",
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCol1: {
    flex: 3,
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#475569",
  },
  tableHeaderCol2: {
    width: 40,
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#475569",
    textAlign: "center",
  },
  tableHeaderCol3: {
    width: 70,
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#475569",
    textAlign: "right",
  },
  tableHeaderCol4: {
    width: 40,
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#475569",
    textAlign: "center",
  },
  tableHeaderCol5: {
    width: 70,
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#475569",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "center",
  },
  tableCol1: {
    flex: 3,
    fontSize: 8.5,
    color: "#1e293b",
    fontWeight: "bold",
  },
  tableCol2: {
    width: 40,
    fontSize: 8.5,
    color: "#334155",
    textAlign: "center",
  },
  tableCol3: {
    width: 70,
    fontSize: 8.5,
    color: "#334155",
    textAlign: "right",
  },
  tableCol4: {
    width: 40,
    fontSize: 8.5,
    color: "#334155",
    textAlign: "center",
  },
  tableCol5: {
    width: 70,
    fontSize: 8.5,
    color: "#1e293b",
    fontWeight: "bold",
    textAlign: "right",
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    marginBottom: 20,
  },
  summaryTable: {
    width: 220,
    flexDirection: "column",
    gap: 4,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#475569",
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
  },
  summaryTotalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2d4a36", // brand-primary
  },
  summaryDepositValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#b45309", // amber-700
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginVertical: 3,
  },
  legalSection: {
    marginBottom: 20,
  },
  legalText: {
    fontSize: 6.2,
    color: "#475569",
    marginBottom: 5,
    textAlign: "justify",
    lineHeight: 1.4,
  },
  signatureContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 15,
    marginTop: 10,
  },
  signatureSigned: {
    backgroundColor: "#ecfdf5", // emerald-50
    borderWidth: 1,
    borderColor: "#a7f3d0", // emerald-200
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    gap: 10,
  },
  signatureCheck: {
    width: 20,
    height: 20,
    backgroundColor: "#d1fae5", // emerald-100
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  signatureContent: {
    flexDirection: "column",
    gap: 2,
  },
  signatureTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#065f46", // emerald-800
    marginBottom: 2,
  },
  signatureText: {
    fontSize: 8,
    color: "#065f46",
  },
  signatureMeta: {
    fontSize: 7,
    color: "#047857",
    opacity: 0.8,
  },
  signatureUnsigned: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  signatureUnsignedText: {
    fontSize: 8,
    color: "#94a3b8",
    fontStyle: "italic",
  },
});

interface ContractPDFProps {
  booking: any;
  settings?: any;
}

const DEFAULT_TERMS = `1. Durée de location : La durée de location est fixée à 3 jours calendaires à compter de la date de retrait ou de livraison du matériel.
2. Propriété du matériel : Le matériel loué (vaisselle, décoration, mobilier, accessoires, etc.) demeure la propriété du loueur.
3. Utilisation et soin : Le locataire s'engage à utiliser le matériel avec soin et à le restituer à la date convenue.
4. Restitution de la vaisselle : La vaisselle n'a pas besoin d'être lavée, mais doit être débarrassée de tous déchets et restes alimentaires avant restitution.
5. Éléments de décoration : Les éléments de décoration doivent être rendus en bon état, sans dégradation ni dommage apparent.
6. Modalités financières et caution : Un acompte de 30 % du montant total de la location est exigé à la signature du contrat afin de valider la réservation. Le solde de la location devra être réglé intégralement au moment du retrait ou de la livraison du matériel. Une caution sous forme de chèque sera demandée lors du retrait.
7. Dégradations, casse ou perte : Tout dégât apparent, casse, perte ou élément manquant sera déduit de la caution, selon le coût de remplacement du matériel concerné.
8. Responsabilité : Le locataire est responsable du matériel pendant toute la durée de la location, de sa remise jusqu'à sa restitution.
9. Retard de restitution : Tout retard de restitution entraînera la facturation d'une période de location supplémentaire de 3 jours calendaires, non fractionnable.
10. Acceptation du règlement : Toute réservation ou signature du contrat vaut acceptation du présent règlement.`;

export default function ContractPDF({ booking, settings }: ContractPDFProps) {
  const isAlreadySigned = !!booking.contractSignedAt;
  const signatureDate = isAlreadySigned ? new Date(booking.contractSignedAt) : null;

  // Calculate rental duration
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const rentalDays = Math.max(
    1,
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) /
      (1000 * 60 * 60 * 24)
    ) + 1
  );

  // Calculate items sum to separate delivery fee if delivery is active
  const itemsSubtotal = booking.items.reduce(
    (sum: number, item: any) => sum + Math.ceil(item.price) * item.quantity * rentalDays,
    0
  );
  const deliveryFee = Math.max(0, booking.totalPrice - itemsSubtotal);

  return (
    <Document title={`Contrat de location - Réf ${booking._id}`}>
      <Page size="A4" style={styles.page}>
        {/* Devis Header */}
        <View style={styles.headerContainer}>
          <View style={styles.companyCol}>
            <View style={styles.logoContainer}>
              <Text style={styles.companyName}>LSmaloc</Text>
            </View>
            <Text style={styles.companyDetail}>Location de matériel événementiel</Text>
            <Text style={styles.companyDetail}>Contact : sabinely81700@gmail.com</Text>
            <Text style={styles.companyDetail}>Site web : lsmaloc.vercel.app</Text>
          </View>

          <View style={styles.devisCol}>
            <Text style={styles.devisTitle}>CONTRAT DE LOCATION</Text>
            <Text style={styles.devisNumber}>N° CTR-{booking._id.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.devisDetail}>
              Date d'émission : {new Date(booking._creationTime || Date.now()).toLocaleDateString("fr-FR")}
            </Text>
            <Text style={styles.devisDetail}>Réf réservation : {booking._id}</Text>
          </View>
        </View>

        {/* Parties Grid */}
        <View style={styles.partiesGrid}>
          <View style={styles.partyCol}>
            {/* Informations du propriétaire déjà présentes dans l'en-tête */}
          </View>

          <View style={styles.partyColClient}>
            <Text style={styles.partyTitle}>Client (Locataire)</Text>
            <Text style={styles.partyName}>
              {booking.firstName} {booking.lastName}
            </Text>
            <Text style={styles.partyDetail}>Tél : {booking.phone}</Text>
            <Text style={styles.partyDetail}>Email : {booking.email}</Text>
            {booking.delivery && booking.deliveryAddress && (
              <Text style={[styles.partyDetail, styles.italic]}>
                Adresse livraison : {booking.deliveryAddress}
              </Text>
            )}
            <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#e2e8f0" }}>
              <Text style={{ fontSize: 7, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase" }}>
                Période de Location
              </Text>
              <Text style={{ fontSize: 8.5, fontWeight: "bold", color: "#2d4a36", marginTop: 2 }}>
                {prettyDisplayDate(booking.startDate, booking.endDate)} ({rentalDays} j)
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Détail des prestations de location</Text>

          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCol1}>Désignation</Text>
              <Text style={styles.tableHeaderCol2}>Qté</Text>
              <Text style={styles.tableHeaderCol3}>Tarif / Jour</Text>
              <Text style={styles.tableHeaderCol4}>Durée</Text>
              <Text style={styles.tableHeaderCol5}>Total Net</Text>
            </View>

            {/* Rented Items Rows */}
            {booking.items.map((item: any, idx: number) => {
              const rowTotal = Math.ceil(item.price) * item.quantity * rentalDays;
              return (
                <View key={idx} style={styles.tableRow} wrap={false}>
                  <Text style={styles.tableCol1}>{item.title}</Text>
                  <Text style={styles.tableCol2}>{item.quantity}</Text>
                  <Text style={styles.tableCol3}>{Math.ceil(item.price)} €</Text>
                  <Text style={styles.tableCol4}>{rentalDays} j</Text>
                  <Text style={styles.tableCol5}>{rowTotal} €</Text>
                </View>
              );
            })}

            {/* Delivery Fee Row (if applicable) */}
            {booking.delivery && deliveryFee > 0 && (
              <View style={styles.tableRow} wrap={false}>
                <Text style={styles.tableCol1}>Livraison et reprise du matériel à domicile</Text>
                <Text style={styles.tableCol2}>1</Text>
                <Text style={styles.tableCol3}>{deliveryFee} €</Text>
                <Text style={styles.tableCol4}>-</Text>
                <Text style={styles.tableCol5}>{deliveryFee} €</Text>
              </View>
            )}
          </View>

          {/* Financial Totals */}
          <View style={styles.financialRow} wrap={false}>
            <View style={styles.summaryTable}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Matériel Net :</Text>
                <Text style={styles.summaryValue}>{itemsSubtotal} €</Text>
              </View>
              {booking.delivery && deliveryFee > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Logistique :</Text>
                  <Text style={styles.summaryValue}>{deliveryFee} €</Text>
                </View>
              )}
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Location :</Text>
                <Text style={styles.summaryTotalValue}>{booking.totalPrice} €</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Caution de garantie (non débitée) :</Text>
                <Text style={styles.summaryDepositValue}>{booking.totalDeposit} €</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* PAGE 2: Conditions Générales & Signatures */}
      <Page size="A4" style={styles.page}>
        {/* Simple Page 2 Header */}
        <View style={[styles.headerContainer, { marginBottom: 15, paddingBottom: 10 }]}>
          <View style={styles.logoContainer}>
            <Text style={styles.companyName}>LSmaloc</Text>
          </View>
          <View style={styles.devisCol}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#1e293b" }}>CONTRAT DE LOCATION</Text>
            <Text style={styles.devisDetail}>Réf réservation : {booking._id}</Text>
          </View>
        </View>

        {/* Conditions & Rules */}
        <View style={styles.legalSection}>
          <Text style={styles.sectionTitle}>Conditions générales et règles de location</Text>
          {(settings?.terms || DEFAULT_TERMS)
            .split("\n")
            .map((line: string) => line.trim())
            .filter(Boolean)
            .map((line: string, idx: number) => {
              const colonIndex = line.indexOf(":");
              if (colonIndex !== -1) {
                const boldPart = line.substring(0, colonIndex + 1);
                const normalPart = line.substring(colonIndex + 1);
                return (
                  <Text key={idx} style={styles.legalText}>
                    <Text style={{ fontWeight: "bold" }}>{boldPart}</Text>
                    {normalPart}
                  </Text>
                );
              }
              return (
                <Text key={idx} style={styles.legalText}>
                  {line}
                </Text>
              );
            })}
        </View>

        {/* Signature Block */}
        <View style={styles.signatureContainer} wrap={false}>
          {isAlreadySigned && signatureDate ? (
            <View style={styles.signatureSigned}>
              <View style={styles.signatureCheck}>
                <Text style={{ color: "#059669", fontWeight: "bold", fontSize: 11 }}>✓</Text>
              </View>
              <View style={styles.signatureContent}>
                <Text style={styles.signatureTitle}>Contrat valablement signé et accepté</Text>
                <Text style={styles.signatureText}>
                  Signataire : {booking.contractSignedName}
                </Text>
                <Text style={styles.signatureMeta}>
                  Signé le {signatureDate.toLocaleDateString("fr-FR")} à {signatureDate.toLocaleTimeString("fr-FR")}
                </Text>
                <Text style={styles.signatureMeta}>
                  Adresse IP : {booking.contractSignedIp} (Horodatage électronique faisant foi)
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.signatureUnsigned}>
              <Text style={styles.signatureUnsignedText}>
                Contrat en attente de signature électronique par le client.
              </Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
