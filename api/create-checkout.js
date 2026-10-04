const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { serviceId, serviceName, price, quantity, customerEmail, userId } = req.body || {}
    const cents = Math.round(Number(price) * 100)
    const units = Math.max(1, Math.min(100, Math.round(Number(quantity) || 1)))
    if (!serviceId || !serviceName || !Number.isFinite(cents) || cents <= 0) return res.status(400).json({ error: 'Invalid service' })
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'usd', product_data: { name: serviceName }, unit_amount: cents }, quantity: units }],
      customer_email: customerEmail || undefined,
      success_url: `${req.headers.origin || 'https://acllcsocialboost.vercel.app'}/#/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://acllcsocialboost.vercel.app'}/#/`,
      metadata: { serviceId: String(serviceId), userId: String(userId || ''), quantity: String(units) },
    })
    return res.status(200).json({ url: session.url, sessionId: session.id })
  } catch (error) {
    console.error('[v0] Stripe checkout error', error)
    return res.status(500).json({ error: 'Unable to start checkout' })
  }
}
