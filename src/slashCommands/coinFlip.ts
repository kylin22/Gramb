import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { PlayerStats } from "../schemas/PlayerStats";
import { SlashCommand } from "../types";
import { getThemeColor } from "../utils/util";
import { Currencies } from "../classes/Currencies";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("coin_flip")
    .setDescription("Double or nothing.")
    .addStringOption(option => option
        .setName("choice")
        .setDescription("Heads or tails")
        .setRequired(true)
        .addChoices(
            { name: "heads", value: "Heads" },
            { name: "tails", value: "Tails" }
        ))
    .addIntegerOption(option => option
        .setName("bet")
        .setDescription("Amount of CP to bet")
        .setRequired(true)
        .setMinValue(0)),
    execute: async (interaction) => {
        try {
            const playerStats = await PlayerStats.getStats(interaction.member!.user.id);
            if (!playerStats) {
                await interaction.reply({
                    content: "Use /gramble first"
                });
                return;
            }

            const choice = interaction.options.getString("choice")!;
            const bet = interaction.options.getInteger("bet")!;

            if (bet > playerStats.CP) {
                await interaction.reply({
                    content: `You don't have enough CP (${playerStats.CP}CP) for this bet`
                });
                return;
            }

            const randomNumber = Math.random();

            //evil
            let randomOutcome = "Tails";
            if (randomNumber < 0.52) {
                randomOutcome = choice === "Heads" ? "Tails" : "Heads";
            } else {
                randomOutcome = choice;
            }

            let description = "";
            let CPChange = 0;

            if (choice === randomOutcome) {
                CPChange = bet;
                description = `**You win ${bet} CP**`;
            } else {
                // User loses
                CPChange = -bet;
                description = `**You lose ${bet} CP**`;
            }
            description += `\n\n **New Balance**: ${playerStats.CP + CPChange} CP`

            await PlayerStats.updateStats(playerStats.userId, CPChange, Currencies.CP);

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(randomOutcome)
                    .setDescription(description)
                    .setAuthor({ name: interaction.member!.user.username, iconURL: interaction.user.displayAvatarURL() })
                    // .setImage(currentRegion.image) //TODO coin sprite
                    .setColor(getThemeColor("text"))
                    .setTimestamp()
                ]
            });
        } catch (error) {
            console.error(`Failed to handle coin_flip command: ${error.stack}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 6
}

export default command;