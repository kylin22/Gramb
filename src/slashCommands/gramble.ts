import { SlashCommandBuilder, ChannelType, TextChannel, EmbedBuilder } from "discord.js"
import { getThemeColor } from "../utils/util";
import { GrankStats } from "../schemas/Grank";
import { SlashCommand } from "../types";
import { PlayerStats } from "../schemas/PlayerStats";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("gramble")
    .setDescription("Start your grambling journey."),
    execute: async (interaction) => {
        try {
            if (!interaction.member) {
                console.error("client user does not exist");
                return;
            }

            const validPlayerStatsCreation = await PlayerStats.createWithDefaults(interaction.member.user.id);
            await GrankStats.createAccount("mineEntranceGrank", interaction.member.user.id);
            let description = validPlayerStatsCreation ? `Welcome ${interaction.member.user.username}` : `${interaction.member.user.username} has been already registered`;

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Grambler")
                    .setDescription(description)
                    .setColor(getThemeColor("text"))
                ]
            });
        } catch (error) {
            console.error(`Failed to handle gramble command: ${error.message}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 10
}

export default command;