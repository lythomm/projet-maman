import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAuth } from "./admin";

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

// Get settings (public)
export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    if (!settings) {
      return { deliveryFee: 20, terms: DEFAULT_TERMS }; // Default fallback
    }
    return {
      ...settings,
      terms: settings.terms ?? DEFAULT_TERMS,
    };
  },
});

// Update settings (Admin only)
export const update = mutation({
  args: {
    token: v.string(),
    deliveryFee: v.number(),
    terms: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);
    const settings = await ctx.db.query("settings").first();
    if (settings) {
      await ctx.db.patch(settings._id, { 
        deliveryFee: args.deliveryFee,
        terms: args.terms,
      });
    } else {
      await ctx.db.insert("settings", { 
        deliveryFee: args.deliveryFee,
        terms: args.terms,
      });
    }
  },
});
