// pages/api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, userId } = req.body;
    
    // Define your subscription plans
    const plans = {
      weekly: {
        name: 'Weekly Plan',
        price: 1499, // $14.99
        interval: 'week'
      },
      monthly: {
        name: 'Monthly Plan',
        price: 3996, // $39.96 per month (4 weeks at $9.99/week)
        interval: 'month'
      },
      annual: {
        name: 'Annual Plan',
        price: 25948, // $259.48 per year (52 weeks at $4.99/week)
        interval: 'year'
      }
    };
    
    // Check if the plan exists
    if (!plans[planId]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    
    const plan = plans[planId];
    
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: '1HP Troubleshooter Pro Subscription'
            },
            unit_amount: plan.price,
            recurring: {
              interval: plan.interval
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/go-pro`,
      client_reference_id: userId, // Store userId for reference
      metadata: {
        userId: userId,
        planId: planId
      }
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}