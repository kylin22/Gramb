import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { getThemeColor } from "../utils/util";
import { GrankStats } from "../schemas/Grank";
import { SlashCommand } from "../types";
import regions from "../config/regions";
import { PlayerStats } from "../schemas/PlayerStats";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("grank_repay")
    .setDescription("Repay a Grank loan.")
    .addIntegerOption(option => option
        .setName("amount")
        .setDescription("Amount of CP to repay")
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

            const currentRegion = regions.find(region => region.id === playerStats?.currentRegion)!;
            if (currentRegion.id !== "mineEntrance") {
                await interaction.reply({
                    content: "You can't do that in this region, the grank is located in Mine Entrance."
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

            const repayAmount = interaction.options.getInteger("amount")!;
            if (!grankStats.debtLedger.hasOwnProperty(playerStats.userId)) {
                await interaction.reply({
                    content: "You don't need to repay any Grank loans."
                });
                return;
            }

            const currentDebt = grankStats.debtLedger[playerStats.userId].debt;
            if (currentDebt < repayAmount) {
                await interaction.reply({
                    content: `You only need to repay ${currentDebt}CP`
                });
                return;
            }

            const validLoan = await GrankStats.updateDebtLedger("mineEntranceGrank", playerStats.userId, -repayAmount);
            if (!validLoan) {
                await interaction.reply({
                    content: "You do not have enough CP for this repayment. (Or something else happened)"
                });
                return;
            }

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Repayment")
                    .setDescription(`<@${interaction.member!.user.id}> has repaid ${repayAmount} CP of their loan \n\n **New Balance**: ${playerStats.CP - repayAmount} CP`)
                    .setAuthor({ name: interaction.member!.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setImage(currentRegion.grankImage!)
                    .setColor(getThemeColor("text"))
                    .setTimestamp()
                ]
            });
        } catch (error) {
            console.error(`Failed to handle grankRepay command: ${error.stack}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 6
}

export default command;