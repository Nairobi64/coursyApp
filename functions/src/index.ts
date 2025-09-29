/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// ✅ Import clair depuis v1
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";
import fetch from "node-fetch"; // pour Orange API
import { UserRecord } from "firebase-admin/auth";

admin.initializeApp();

// ========= CONFIG SENDGRID =========
const SENDGRID_API_KEY = functions.config().sendgrid?.key;
const SENDGRID_SENDER = functions.config().sendgrid?.sender;

if (!SENDGRID_API_KEY || !SENDGRID_SENDER) {
  throw new Error("⚠️ SendGrid config missing: run `firebase functions:config:set sendgrid.key=... sendgrid.sender=...`");
}
sgMail.setApiKey(SENDGRID_API_KEY);

// ========= CONFIG ORANGE =========
const ORANGE_CLIENT_ID = functions.config().orange?.id;
const ORANGE_CLIENT_SECRET = functions.config().orange?.secret;
const ORANGE_NUMBER = functions.config().orange?.number; // ex: "+221774123306"

if (!ORANGE_CLIENT_ID || !ORANGE_CLIENT_SECRET || !ORANGE_NUMBER) {
  throw new Error("⚠️ Orange config missing: run `firebase functions:config:set orange.id=... orange.secret=... orange.number=...`");
}

const ORANGE_API_URL = `https://api.orange.com/smsmessaging/v1/outbound/tel%3A${encodeURIComponent(ORANGE_NUMBER)}/requests`;

// ========= Test SMS Orange via HTTP =========
export const testSmsOrange = functions.https.onRequest(async (req, res) => {
  const phone = (req.query.phone as string);
  const message = (req.query.message as string);

  if (!phone || !message) {
    res.status(400).send("Paramètres manquants : phone et message");
    return;
  }

  try {
    // 1️⃣ Récupérer le token
    const tokenResp = await fetch("https://api.orange.com/oauth/v3/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${ORANGE_CLIENT_ID}:${ORANGE_CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenResp.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error("Impossible de récupérer le token Orange");

    // 2️⃣ Envoyer le SMS
    const resp = await fetch(ORANGE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        outboundSMSMessageRequest: {
          address: `tel: +221781675194`,          // numéro destinataire
          senderAddress: `tel:+221774123306`, // ton numéro Orange validé
          outboundTextMessage: { message },
        },
      }),
    });

    if (!resp.ok) {
      console.error("❌ Erreur SMS Orange:", resp.status, await resp.text());
      res.status(500).send("Erreur envoi SMS Orange");
      return;
    }

    const result = await resp.json();
    console.log(`✅ SMS envoyé à ${phone}: ${message}`);
    res.status(200).send(result);

  } catch (err) {
    console.error("❌ Exception SMS:", err);
    res.status(500).send(err);
  }
});

// 🔑 Récupérer un token d'accès Orange
async function getOrangeAccessToken(): Promise<string | null> {
  try {
    const res = await fetch("https://api.orange.com/oauth/v3/token", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${ORANGE_CLIENT_ID}:${ORANGE_CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      console.error("❌ Erreur token Orange:", res.status, await res.text());
      return null;
    }

    const tokenData = (await res.json()) as { access_token: string };
    return tokenData.access_token;
  } catch (err) {
    console.error("❌ Exception Orange:", err);
    return null;
  }
}

// ========= EMAIL BIENVENUE =========
export const sendWelcomeEmail = functions.auth.user().onCreate(
  async (user: UserRecord) => {
    if (!user.email) return null;

    const displayName = user.displayName || "nouvel utilisateur";

    const msg: sgMail.MailDataRequired = {
      to: user.email,
      from: SENDGRID_SENDER,
      subject: "Bienvenue 🎉",
      text: `Salut ${displayName}, merci de t'être inscrit !`,
      html: `<h2>Bienvenue ${displayName} 👋</h2>`,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Email envoyé à ${user.email}`);
    } catch (error) {
      console.error("❌ Erreur email :", error);
    }

    return null;
  }
);

// ========= EMAIL SUR CREATION DE COLIS =========
export const sendTrackingEmail = functions.firestore
  .document("colis/{colisId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return null;

    // 📌 Vérifier si un email est présent (il faut que tu stockes email dans users ou dans le colis)
    let email = data.expediteurEmail;
    let nom = data.expediteurNom || "Client";

    // si pas d'email dans le colis → aller chercher dans `users/{uid}`
    if (!email && data.client?.uid) {
      const userSnap = await admin.firestore().doc(`users/${data.client.uid}`).get();
      if (userSnap.exists) {
        email = userSnap.data()?.email;
        nom = userSnap.data()?.prenom || nom;
      }
    }

    if (!email) {
      console.warn("⚠️ Aucun email trouvé pour ce colis, email non envoyé");
      return null;
    }

    const trackingNumber = data.trackingNumber;

    const msg: sgMail.MailDataRequired = {
      to: email,
      from: SENDGRID_SENDER,
      subject: "📦 Votre numéro de suivi",
      text: `Bonjour ${nom}, votre colis a été enregistré. 
Numéro de suivi : ${trackingNumber}. 
Merci d'utiliser notre service 🚚`,
      html: `
        <h2>Bonjour ${nom} 👋</h2>
        <p>Votre colis a bien été enregistré.</p>
        <p><b>Numéro de suivi :</b> ${trackingNumber}</p>
        <p>Merci d'utiliser notre service 🚚</p>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Email de suivi envoyé à ${email}`);
    } catch (err) {
      console.error("❌ Erreur envoi email suivi :", err);
    }

    return null;
  });


// ========= SMS CLIENT SUR COMMANDE =========
export const sendSmsOnCommandeUpdate = functions.firestore
  .document("livraison/{commandeId}")
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    if (!after?.notifClientPending) return null;

    const { message, to } = after.notifClientPending;

    const clientSnap = await admin.firestore().doc(`users/${to}`).get();
    if (!clientSnap.exists) return null;

    const phone = clientSnap.data()?.telephone;
    if (!phone) {
      console.error("❌ Aucun numéro trouvé pour l’utilisateur", to);
      return null;
    }

    const token = await getOrangeAccessToken();
    if (!token) return null;

    try {
      const resp = await fetch(ORANGE_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outboundSMSMessageRequest: {
            address: `tel:${phone}`,
            senderAddress: `tel:${ORANGE_NUMBER}`,
            outboundSMSTextMessage: { message },
          },
        }),
      });

      if (!resp.ok) {
        console.error("❌ Erreur SMS Orange:", resp.status, await resp.text());
      } else {
        console.log(`✅ SMS envoyé à ${phone}: ${message}`);
        await change.after.ref.update({
          notifClientPending: admin.firestore.FieldValue.delete(),
        });
      }
    } catch (err) {
      console.error("❌ Exception SMS:", err);
    }

    return null;
  });







// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
