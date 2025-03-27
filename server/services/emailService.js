import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const emailUser = process.env.EMAIL || "info@fitnexus.berrysol.com";
const emailPassword = process.env.EMAIL_PASSWORD || "@#fyp-fitnexus@#";

const transporter = nodemailer.createTransport({
  host: "fitnexus.berrysol.com",
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

export const sendTaskAssignmentEmail = async (
  userEmail,
  userName,
  taskTitle,
  taskDescription
) => {
  try {
    const mailOptions = {
      from: emailUser,
      to: userEmail,
      subject: "New Task Assigned",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${userName},</h2>
          <p>You have been assigned a new task in the Task Management System.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${taskTitle}</h3>
            <p>${taskDescription || "No description provided."}</p>
          </div>
          <p>Please log in to your account to view the details and start working on this task.</p>
          <p>Best regards,<br>Task Management Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};

export const sendTaskUpdateEmail = async (
  userEmail,
  userName,
  taskTitle,
  updateType
) => {
  try {
    const mailOptions = {
      from: emailUser,
      to: userEmail,
      subject: "Task Update Notification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${userName},</h2>
          <p>There has been an update to a task you are assigned to:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${taskTitle}</h3>
            <p>Update type: ${updateType}</p>
          </div>
          <p>Please log in to your account to view the updated details.</p>
          <p>Best regards,<br>Task Management Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};

export default {
  sendTaskAssignmentEmail,
  sendTaskUpdateEmail,
};
