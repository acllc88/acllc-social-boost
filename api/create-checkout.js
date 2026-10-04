const Stripe = require('stripe')

const stripe = new Stripe.StripeClient(process.env.STRIPE_SECRET_KEY)
const SERVICES = {
  s1: { name: 'Instagram Views', priceInCents: 50 },
  s2: { name: 'Instagram Likes', priceInCents: 120 },
  s3: { name: 'Instagram Followers', priceInCents: 300 },
  s4: { name: 'YouTube Views', priceInCents: 200 },
  s5: { name: 'Facebook Post Likes', priceInCents: 150 },
  s6: { name: 'Facebook Followers', priceInCents: 250 },
  s7: { name: 'Facebook Page Likes', priceInCents: 250 },
  s8: { name: 'TikTok Views', priceInCents: 40 },
  s9: { name: 'TikTok Followers', priceInCents: 350 },
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { serviceId, quantity, customerEmail, userId } = req.body || {}
    const service = SERVICES[String(serviceId)]
    const units = Number(quantity)
    if (!service || !Number.isInteger(units) || units < 1 || units > 100) return res.status(400).json({ error: 'Invalid service or quantity' })
    if (customerEmail && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(customerEmail)) return res.status(400).json({ error: 'Invalid email' })
    const origin = req.headers.origin || 'https://acllcsocialboost.vercel.app'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'usd', product_data: { name: service.name }, unit_amount: service.priceInCents }, quantity: units }],
      customer_email: customerEmail || undefined,
      success_url: `${origin}/#/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#/`,
      integration_identifier: `acllc_checkout_${Math.random().toString(36).slice(2, 10)}`,
      metadata: { serviceId: String(serviceId), serviceName: service.name, userId: String(userId || ''), quantity: String(units) },
    })
    return res.status(200).json({ url: session.url, sessionId: session.id })
  } catch (error) {
    console.error('[v0] Stripe checkout error', error)
    return res.status(500).json({ error: 'Unable to start checkout' })
  }
}
