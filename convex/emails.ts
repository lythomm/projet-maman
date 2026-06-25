import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";

const RESEND_API_URL = "https://api.resend.com/emails";
const ADMIN_EMAIL = "sabinely81700@gmail.com";

const MONTH_NAMES = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

function formatDateRange(startStr: string, endStr: string): string {
  const [startY, startM, startD] = startStr.split("-").map(Number);
  const [endY, endM, endD] = endStr.split("-").map(Number);

  const startMonthName = MONTH_NAMES[startM - 1];
  const endMonthName = MONTH_NAMES[endM - 1];

  if (startY === endY) {
    if (startM === endM) {
      if (startD === endD) {
        return `${startD} ${startMonthName} ${startY}`;
      }
      return `${startD} au ${endD} ${startMonthName} ${startY}`;
    }
    return `${startD} ${startMonthName} au ${endD} ${endMonthName} ${startY}`;
  }
  return `${startD} ${startMonthName} ${startY} au ${endD} ${endMonthName} ${endY}`;
}

interface SendEmailParams {
  apiKey: string;
  from: string;
  subject: string;
  html: string;
}

async function sendEmailToAdmin({ apiKey, from, subject, html }: SendEmailParams) {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: ADMIN_EMAIL,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to send admin notification email:`, errorText);
    throw new Error(`Resend API Error: ${errorText}`);
  }

  const data = await response.json();
  console.log(`Notification email sent to admin (${ADMIN_EMAIL}). Message ID: ${data.id}`);
  return data;
}

export const sendNewBookingEmails = internalAction({
  args: {
    bookingId: v.id("bookings"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    totalPrice: v.number(),
    totalDeposit: v.number(),
    delivery: v.boolean(),
    deliveryAddress: v.optional(v.string()),
    siteUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY environment variable is not set. Email sending skipped.");
      return;
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const clientName = `${args.firstName} ${args.lastName}`;
    const contractLink = args.siteUrl 
      ? `${args.siteUrl}/contrat/${args.bookingId}`
      : `http://localhost:3000/contrat/${args.bookingId}`;

    const formattedDates = formatDateRange(args.startDate, args.endDate);

    const adminSubject = `🆕 Nouvelle demande de location - ${formattedDates}`;
    const adminHtml = `
      <h2>Nouvelle demande de location reçue !</h2>
      <p><strong>Client :</strong> ${clientName}</p>
      <p><strong>Email client :</strong> ${args.email}</p>
      <p><strong>Téléphone client :</strong> ${args.phone}</p>
      <p><strong>Période :</strong> du ${formattedDates}</p>
      <p><strong>Montant Total :</strong> ${args.totalPrice}€</p>
      <p><strong>Caution :</strong> ${args.totalDeposit}€</p>
      <p><strong>Livraison :</strong> ${args.delivery ? `Oui (${args.deliveryAddress})` : "Non"}</p>
      <p><strong>Lien du contrat :</strong> <a href="${contractLink}">${contractLink}</a></p>
      <hr />
      <p>Connectez-vous à votre espace administration pour gérer cette réservation.</p>
    `;

    try {
      await sendEmailToAdmin({
        apiKey,
        from: fromEmail,
        subject: adminSubject,
        html: adminHtml,
      });
    } catch (error) {
      console.error("Error sending new booking admin email:", error);
    }
  },
});

export const sendContractSignedEmail = internalAction({
  args: {
    bookingId: v.id("bookings"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    ip: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY environment variable is not set. Email sending skipped.");
      return;
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const clientName = `${args.firstName} ${args.lastName}`;

    const adminSubject = `[LSmaloc] ✍️ Contrat signé par ${clientName}`;
    const adminHtml = `
      <h2>Le contrat de location a été signé !</h2>
      <p><strong>Client :</strong> ${clientName} (${args.email})</p>
      <p><strong>Adresse IP du signataire :</strong> ${args.ip}</p>
      <p><strong>ID Réservation :</strong> ${args.bookingId}</p>
      <hr />
      <p>Vous pouvez maintenant accéder à l'interface d'administration pour finaliser la commande.</p>
    `;

    try {
      await sendEmailToAdmin({
        apiKey,
        from: fromEmail,
        subject: adminSubject,
        html: adminHtml,
      });
    } catch (error) {
      console.error("Error sending contract signed admin email:", error);
    }
  },
});

export const sendContactMessage = action({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY environment variable is not set. Email sending skipped.");
      return;
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const adminSubject = `[LSmaloc] ✉️ Nouveau message de contact - ${args.name}`;
    const adminHtml = `
      <h2>Nouveau message de contact reçu depuis le site !</h2>
      <p><strong>Nom :</strong> ${args.name}</p>
      <p><strong>Email client :</strong> ${args.email}</p>
      <p><strong>Message :</strong></p>
      <div style="background-color: #f8fafc; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: sans-serif; white-space: pre-wrap; font-size: 14px; color: #334155; line-height: 1.5;">
        ${args.message}
      </div>
    `;

    try {
      await sendEmailToAdmin({
        apiKey,
        from: fromEmail,
        subject: adminSubject,
        html: adminHtml,
      });
    } catch (error) {
      console.error("Error sending contact message email:", error);
      throw new Error("Impossible d'envoyer le message. Veuillez réessayer.");
    }
  },
});
