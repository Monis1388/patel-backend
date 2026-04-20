const twilio = require('twilio');

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client = null;

// Only initialize if SID and Token are present and valid
if (twilioSid && twilioToken && !twilioSid.includes('your_')) {
    client = twilio(twilioSid, twilioToken);
}

/**
 * Sends an OTP SMS to the specified phone number
 * @param {string} phone - The recipient's phone number
 * @param {string} otp - The OTP to send
 */
const sendOTPSMS = async (phone, otp) => {
    if (!client) {
        console.warn(`[TWILIO] Client not initialized. Skipping SMS for ${phone}. OTP: ${otp}`);
        return false;
    }

    try {
        let cleaned = phone.toString().replace(/\D/g, '');
        
        let fullPhone;
        if (phone.toString().startsWith('+')) {
            fullPhone = `+${cleaned}`;
        } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
            fullPhone = `+${cleaned}`;
        } else {
            fullPhone = `+91${cleaned}`;
        }
        
        await client.messages.create({
            body: `Your OTP for Frame & Sunglasses is: ${otp}. Valid for 10 minutes.`,
            from: twilioPhone,
            to: fullPhone
        });
        console.log(`[TWILIO] OTP SMS successfully sent to ${fullPhone}`);
        return true;
    } catch (error) {
        console.error(`[TWILIO ERROR] Failed to send OTP to ${phone}:`, error.message);
        throw error;
    }
};

/**
 * Sends an order confirmation SMS to the customer
 * @param {string} phone - The customer's phone number
 * @param {string} orderId - The Order ID
 */
const sendOrderSMS = async (phone, orderId) => {
    if (!client) {
        console.warn(`[TWILIO] Client not initialized. Skipping Order confirmation SMS for ${phone}. OrderID: ${orderId}`);
        return false;
    }

    try {
        const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        const simplifiedId = orderId.toString().slice(-8).toUpperCase();
        
        await client.messages.create({
            body: `Your order is confirmed! Order ID: ORD-${simplifiedId}. Thank you for choosing Frame & Sunglasses. We are processing your eyewear with precision.`,
            from: twilioPhone,
            to: fullPhone
        });
        console.log(`[TWILIO] Order confirmation SMS sent to ${fullPhone} for Order ${orderId}`);
        return true;
    } catch (error) {
        console.error(`[TWILIO ERROR] Failed to send order SMS to ${phone}:`, error.message);
        throw error;
    }
};

module.exports = {
    sendOTPSMS,
    sendOrderSMS
};
