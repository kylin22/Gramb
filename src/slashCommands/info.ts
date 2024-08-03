import { SlashCommandBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { getThemeColor } from "../utils/util";
import { GrankStats } from "../schemas/Grank";
import { SlashCommand } from "../types";
import regions from "../config/regions";
import { Flags } from "../classes/Flags";
import { PlayerStats } from "../schemas/PlayerStats";


const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("info")
    .setDescription("View your grambling stats."),
    execute: async (interaction) => {
        try {
            const playerStats = await PlayerStats.getStats(interaction.member!.user.id);

            if (!playerStats) {
                await interaction.reply({
                    content: "Use /gramble first"
                });
                return;
            }

            const grankStats = await GrankStats.getStats("mineEntranceGrank");

            if (!grankStats) {
                await interaction.reply({
                    content: "The grank is gone."
                });
                return;
            }

            const currentRegion = regions.find(region => region.id === playerStats?.currentRegion)!;
            const displayDate = playerStats.lastUpdated.toString().split("GMT")[0].trim();

            let debt = "";
            if (!grankStats.debtLedger.hasOwnProperty(playerStats.userId)) {
                console.error(`${playerStats.userId} has no grank account.`);
                await interaction.reply({ content: "Ping me if you see this. (missing grank account)", ephemeral: true });
            }

            const currentDebt = grankStats.debtLedger[playerStats.userId].debt;
            if (currentDebt > 0) {
                debt = `(Debt: ${currentDebt} CP)`
            }

            let commands = "placeholder";

            //TODO emojis for currencies
            let currencies = `${playerStats.CP} CP ${debt}`;
            if (playerStats.flags[Flags.CXUnlocked]) {
                currencies += `\n${playerStats.CX} CX`;
            }

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Grambling Information")
                    .setDescription(`Statistics for user <@${interaction.member!.user.id}>`)
                    .setAuthor({ name: interaction.member!.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setImage(currentRegion.image)
                    .setColor(getThemeColor("text"))
                    .addFields(
                        { name: "Currencies", value: currencies},
                        { name: "Available Commands", value: commands},
                        { name: "Miscellaneous", value: `
                            Last Updated: ${displayDate}
                        `}
                    )
                ]
            });
        } catch (error) {
            console.error(`Failed to handle gramble command: ${error.stack}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 6
}

export default command;