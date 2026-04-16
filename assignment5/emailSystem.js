"use strict";

/**
 * emailSystem.js
 * Handles all outgoing emails for the scheduling app.
 * Currently just prints to the console, but the rest of the app
 * doesn't know that - it just calls these functions like a real email service.
 */

/**
 * Sends a 2-factor authentication code to the user's email.
 * @param {string} toEmail - The recipient's email address
 * @param {string} code - The 6-digit 2FA code to send
 * @returns {boolean} true if the email was "sent" successfully
 */
function sendTwoFactorCode(toEmail, code) {
    console.log("=== EMAIL SYSTEM ===");
    console.log("To: " + toEmail);
    console.log("Subject: Your Login Verification Code");
    console.log("Body: Your verification code is: " + code);
    console.log("       This code expires in 3 minutes.");
    console.log("====================");
    return true;
}

/**
 * Sends a suspicious activity warning email after 3 failed login attempts.
 * @param {string} toEmail - The recipient's email address
 * @returns {boolean} true if the email was "sent" successfully
 */
function sendSuspiciousActivityEmail(toEmail) {
    console.log("=== EMAIL SYSTEM ===");
    console.log("To: " + toEmail);
    console.log("Subject: Suspicious Login Activity on Your Account");
    console.log("Body: We noticed several failed login attempts on your account.");
    console.log("       If this was not you, please contact your administrator.");
    console.log("====================");
    return true;
}

/**
 * Sends an account locked notification after 10 failed login attempts.
 * @param {string} toEmail - The recipient's email address
 * @returns {boolean} true if the email was "sent" successfully
 */
function sendAccountLockedEmail(toEmail) {
    console.log("=== EMAIL SYSTEM ===");
    console.log("To: " + toEmail);
    console.log("Subject: Your Account Has Been Locked");
    console.log("Body: Your account has been locked due to too many failed login attempts.");
    console.log("       Please contact your administrator to restore access.");
    console.log("====================");
    return true;
}

module.exports = { sendTwoFactorCode, sendSuspiciousActivityEmail, sendAccountLockedEmail };
