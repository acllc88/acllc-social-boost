const Stripe = require('stripe')
const stripe = new Stripe.StripeClient(process.env.STRIPE_SECRET_KEY)

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const signature = req.headers['stripe-signature']
  try {
    const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object
      if (session.payment_status === 'paid') {
        console.log('[v0] Paid order received', session.id, session.metadata)
        // Firestore order creation is performed by the signed-in client after checkout.
        // This webhook is the trusted payment confirmation point for fulfillment systems.
      }
    }
    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('[v0] Stripe webhook verification failed', error.message)
    return res.status(400).send(`Webhook Error: ${error.message}`)
  }
}
