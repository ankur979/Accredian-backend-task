require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

// Endpoint to save referral data
app.post("/api/referrals", async (req, res) => {
  const {
    referrerName,
    referrerEmail,
    refereeName,
    refereeEmail,
    course,
    message,
  } = req.body;

  if (
    !referrerName ||
    !referrerEmail ||
    !refereeName ||
    !refereeEmail ||
    !course
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const referral = await prisma.referral.create({
      data: {
        referrerName,
        referrerEmail,
        refereeName,
        refereeEmail,
        course,
        message,
      },
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMPT_HOST,
      post: process.env.SMPT_PORT,
      secure: process.env.SMPT_SECURE,
      service: process.env.SMPT_SERVICE,
      auth: {
        user: process.env.SMPT_USER,
        pass: process.env.SMPT_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMPT_MAIL,
      to: referrerEmail,
      subject: "Referral Confirmation",
      text: `Hello ${referrerName},\n\nYou have successfully referred ${refereeName} for the course ${course}.\n\nThank you!`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res
          .status(500)
          .json({ error: "Couldn't send referral confirmation" });
      }
      console.log("Email sent: " + info.response);
    });

    res.status(201).json(referral);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to create referral" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
