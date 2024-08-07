import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { getThemeColor } from "../utils/util";
import { GrankStats } from "../schemas/Grank";
import { SlashCommand } from "../types";
import regions from "../config/regions";
import { PlayerStats } from "../schemas/PlayerStats";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("grank_loan")
    .setDescription("Take a Loan from the grank.")
    .addIntegerOption(option => option
        .setName("amount")
        .setDescription("Amount of CP to loan")
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

            let loanAmount = interaction.options.getInteger("amount")!;
            if (grankStats.CP < loanAmount) {
                await interaction.reply({
                    content: "The Grank does not have enough CP for this loan. (Or something else happened)"
                });
                return;
            }

            //2 days in future
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 2);
            const validLoan = await GrankStats.updateDebtLedger("mineEntranceGrank", playerStats.userId, loanAmount, dueDate);
            if (!validLoan) {
                await interaction.reply({
                    content: `/grankLoan interaction failed for user ${playerStats.userId}.`
                });
                return;
            }

            const loanInterestPercentage = ((grankStats.interest - 1) * 100).toFixed(2) + "%";
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Loan")
                    .setDescription(`<@${interaction.member!.user.id}> has taken a loan of ${loanAmount} CP with a loan interest of ${loanInterestPercentage} \n\n **New Balance**: ${playerStats.CP + loanAmount} CP`)
                    .setAuthor({ name: interaction.member!.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setImage(currentRegion.grankImage!)
                    .setColor(getThemeColor("text"))
                    .setTimestamp()
                ]
            });
        } catch (error) {
            console.error(`Failed to handle grankLoan command: ${error.stack}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 6
}

export default command;