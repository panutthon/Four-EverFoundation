
const WEBHOOK_URL = "s";

export const DISCORD_COLORS = {
    PRIMARY: 3447003, // Blue
    SUCCESS: 5763719, // Green
    WARNING: 16776960, // Yellow
    DANGER: 15548997, // Red
};

export const sendDiscordNotification = async (
    title: string,
    description: string,
    color: number,
    fields?: { name: string; value: string; inline?: boolean }[]
) => {
    if (!WEBHOOK_URL || WEBHOOK_URL.includes("YOUR_WEBHOOK_KEY_HERE")) {
        console.warn("Discord Webhook URL is not configured.");
        return;
    }

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                embeds: [
                    {
                        title,
                        description,
                        color,
                        fields: fields || [],
                        timestamp: new Date().toISOString(),
                        footer: {
                            text: "Four-Ever Notification System",
                        },
                    },
                ],
            }),
        });

        if (!response.ok) {
            console.error("Failed to send Discord notification");
        }
    } catch (error) {
        console.error("Error sending Discord notification:", error);
    }
};
