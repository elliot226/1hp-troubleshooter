// pages/api/webhook.js
import Stripe from 'stripe';
import { buffer } from 'micro';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  let event;
  
  try {
    const buf = await buffer(req);
    const signature = req.headers['stripe-signature'];
    
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const planId = session.metadata.planId;
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Update user subscription status in Firestore
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          subscription: {
            id: subscription.id,
            status: subscription.status,
            planId: planId,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            createdAt: new Date(subscription.created * 1000)
          },
          isPro: true
        });
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userSnapshot = await getDoc(doc(db, "subscriptions", subscription.id));
        
        if (userSnapshot.exists()) {
          const userId = userSnapshot.data().userId;
          const userRef = doc(db, "users", userId);
          
          await updateDoc(userRef, {
            subscription: {
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end
            },
            isPro: subscription.status === 'active'
          });
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userSnapshot = await getDoc(doc(db, "subscriptions", subscription.id));
        
        if (userSnapshot.exists()) {
          const userId = userSnapshot.data().userId;
          const userRef = doc(db, "users", userId);
          
          await updateDoc(userRef, {
            subscription: {
              status: 'canceled',
              canceledAt: new Date()
            },
            isPro: false
          });
        }
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}