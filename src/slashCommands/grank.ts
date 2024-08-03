import { SlashCommandBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { getThemeColor } from "../utils/util";
import { GrankStats } from "../schemas/Grank";
import { SlashCommand } from "../types";
import regions from "../config/regions";
import { PlayerStats } from "../schemas/PlayerStats";


const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("grank")
    .setDescription("Visit the local Grank"),
    execute: async (interaction) => {
        try {
            const playerStats = await PlayerStats.getStats(interaction.member!.user.id);

            if (!playerStats) {
                await interaction.reply({
                    content: "Use /gramble first"
                });
                return;
            }

            const currentRegion = regions.find(region => region.id === playerStats?.currentRegion)!;
            if (currentRegion.id !== "mineEntrance") {
                await interaction.reply({
                    content: "You can't do that in this region, the grank is located in Mine Entrance."
                });
                return;
            }

            const grankStats = await GrankStats.getStats("mineEntranceGrank");

            if (!grankStats) {
                await GrankStats.createWithDefaults("mineEntranceGrank");
                await interaction.reply({
                    content: "The grank is gone: Recreating Grank for debug purposes..."
                });
                return;
            }

            const getTimeDifference = (startDate: Date, endDate: Date) => {
                const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
            
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const diffSeconds = Math.floor(((diffMs % (1000 * 60 * 60)) % (1000 * 60)) / 1000);
            
                return {
                    hours: diffHours,
                    minutes: diffMinutes,
                    seconds: diffSeconds
                };
            }

            let debtLedgerDisplay = "";
            Object.entries(grankStats.debtLedger).forEach(([userId, debt]) => {
                if (debt.debt) {
                    const deadline = getTimeDifference(new Date()!, debt.due!);
                    debtLedgerDisplay += `<@${userId}> owes ${debt.debt}CP (${deadline.hours}h ${deadline.minutes}m ${deadline.seconds}s remaining)\n`
                }
            });

            if (!debtLedgerDisplay) {
                debtLedgerDisplay = "Nobody has debt with the Grank";
            }

            const loanInterestPercentage = ((grankStats.interest - 1) * 100).toFixed(2) + "%";

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Grank Information")
                    .setDescription(`Welcome to the Grank <@${interaction.member!.user.id}>\n\n**Current Balance: ${grankStats.CP}CP**\n**Loan Interest: ${loanInterestPercentage}**`)
                    .setAuthor({ name: interaction.member!.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setImage(currentRegion.image) //TODO grank sprite
                    .setColor(getThemeColor("text"))
                    .addFields(
                        { name: "Debt Ledger", value: `${debtLedgerDisplay}`}
                    )
                ]
            });
        } catch (error) {
            console.error(`Failed to handle grank command: ${error.stack}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 6
}

export default command;