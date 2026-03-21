import axios from 'axios';

export const sendOtpEmail = async (to: string, code: string) => {
  console.log("Sending OTP to:", to);

  try {
    const res = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          email: process.env.SMTP_FROM,
          name: 'Nexora',
        },
        to: [{ email: to }],
        subject: 'Your Nexora OTP Code',
        htmlContent: `
          <h2>Your OTP Code</h2>
          <h1>${code}</h1>
          <p>Expires in 10 minutes</p>
        `,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("MAIL SENT:", res.data);
  } catch (err: any) {
    console.error("MAIL ERROR FULL:", err.response?.data || err.message);
    throw err;
  }
};
