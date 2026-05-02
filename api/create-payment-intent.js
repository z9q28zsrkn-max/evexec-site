const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, booking } = req.body;

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // value in pence
            currency: 'gbp',
            automatic_payment_methods: { enabled: true },
            metadata: {
                booking_ref: booking.ref,
                customer_name: `${booking.firstName} ${booking.lastName}`,
                email: booking.email
            },
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
