import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { paymentIntentId, booking } = req.body;

    try {
        // 1. Log the booking in Supabase
        const { error: dbError } = await supabase
            .from('bookings')
            .insert([{ 
                stripe_id: paymentIntentId,
                reference: booking.ref,
                customer_name: `${booking.firstName} ${booking.lastName}`,
                email: booking.email,
                pickup_info: `${booking.pickup} to ${booking.airport}`,
                travel_date: `${booking.date} ${booking.time}`,
                price: booking.price,
                status: 'paid'
            }]);

        if (dbError) throw dbError;

        // 2. Send Confirmation Email to Customer
        await resend.emails.send({
            from: 'EV Exec <onboarding@resend.dev>', // Replace with your verified domain later
            to: booking.email,
            subject: `Booking Confirmed: ${booking.ref}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; color: #07192E;">
                    <h2 style="color: #C9A84C;">Your Tesla Transfer is Confirmed</h2>
                    <p>Hi ${booking.firstName},</p>
                    <p>Thank you for choosing EV Exec. Your premium electric transfer is all set.</p>
                    <hr border="none" style="border-top: 1px solid #eee;" />
                    <p><strong>Reference:</strong> ${booking.ref}</p>
                    <p><strong>Journey:</strong> ${booking.pickup} to ${booking.airport}</p>
                    <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
                    <p><strong>Price:</strong> £${booking.price} (Paid via Stripe)</p>
                    <hr border="none" style="border-top: 1px solid #eee;" />
                    <p style="font-size: 0.9em; color: #666;">Your driver will monitor your flight. If you need to make changes, please reply to this email.</p>
                </div>
            `
        });

        res.status(200).json({ success: true, ref: booking.ref });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
