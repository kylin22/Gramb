import { SlashCommandBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { getThemeColor } from "../utils/util";
import { SlashCommand } from "../types";
import { PlayerStats } from "../schemas/PlayerStats";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the leaderboard."),
    execute: async (interaction) => {
        try {
            const allPlayerStats = await PlayerStats.getAllStats();
            if (!allPlayerStats) {
                await interaction.reply({
                    content: "Failed to get player stats." //TODO calculate leaderboard placement based on assests including debt and inventory
                });
                return;
            }

            let description = "";
            allPlayerStats.sort((a, b) => b.CP - a.CP);
            for (let i = 0; i < allPlayerStats.length; i++) {
                description += `**${i + 1}.** <@${allPlayerStats[i].userId}>: ${allPlayerStats[i].CP}CP\n`
            }

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Leaderboard")
                    .setDescription(description)
                    .setColor(getThemeColor("text"))
                ]
            });
        } catch (error) {
            console.error(`Failed to handle leaderboard command: ${error.stack}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 6
}

export default command;
