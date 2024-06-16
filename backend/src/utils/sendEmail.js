import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config({
  path: "backend/config/config.env",
});

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMPT_HOST,
      port: process.env.SMPT_PORT,
      service: process.env.SMPT_SERVICE,
      auth: {
        user: process.env.SMPT_MAIL,
        pass: process.env.SMPT_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.SMPT_MAIL,
      to: options.email,
      subject: options.subject,
      text: options.emailBody,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
};

export { sendEmail };
