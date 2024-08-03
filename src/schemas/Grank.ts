import { Schema, model, Model } from "mongoose";
import { PlayerStats } from "../schemas/PlayerStats";

interface IGrankStats extends Document {
  grankId: string;
  CP: number;
  interest: number; 
  interestBounds: { min: number, max: number };
  debtLedger: { [userId: string]: { debt: number, due: Date | null } };
}

interface IGrankStatsModel extends Model<IGrankStats> {
  createWithDefaults(grankId: string): Promise<boolean | null>;
  getStats(grankId: string): Promise<IGrankStats | null>;
  updateDebtLedger(grankId: string, userId: string, debtChange: number, due?: Date): Promise<IGrankStats | null>;
  createAccount(grankId: string, userId: string): Promise<void>;
}

const GrankStatsSchema = new Schema({
  grankId: {
    type: String,
    required: true,
  },
  CP: {
    type: Number,
    default: 20000,
  },
  interest: {
    type: Number,
    default: 1.12,
  },
  interestBounds: {
    type: Object,
    default: {
      min: 1.12,
      max: 1.35
    }
  },
  debtLedger: {
    type: Object,
    default: {},
  }
}, { minimize: false });

const GrankStats = model<IGrankStats, IGrankStatsModel>("GrankStats", GrankStatsSchema);

GrankStats.createWithDefaults = async function(grankId: string) {
  try {
    let foundStats = await GrankStats.findOne({ grankId });
    
    if (!foundStats) {
        foundStats = new GrankStats({ grankId });
        console.log(`Created grank ${grankId}.`);
        await foundStats.save();
        return true;
    } else {
        console.log(`Grank ${grankId} already exists.`);
        return false;
    }
  } catch (error) {
    console.error(`Failed to create grank stats for grank ${grankId}: ${error.stack}`);
    return null;
  }
}

GrankStats.getStats = async function(grankId: string) {
  try {
    const grankStats = await GrankStats.findOne({ grankId });
    return grankStats ? grankStats.toObject() : null;
  } catch (error) {
    console.error(`Failed to retrieve grank stats for grank ${grankId}: ${error.stack}`);
    return null;
  }
}

//TODO change to use instance method instead of static
GrankStats.updateDebtLedger = async function(grankId: string, userId: string, debtChange: number, due?: Date) {
  const userStats = await PlayerStats.getStats(userId);
  if (!userStats) {
    console.error(`Attempted to access non-existent or broken playerStats for ${userId} (Debt Ledger change of ${debtChange}CP)`);
    return null;
  }

  const grankStats = await GrankStats.getStats(grankId);
  if (!grankStats) {
    console.error(`Attempted to access non-existent or broken grankStats for ${grankId} (${userId} Debt Ledger change of ${debtChange}CP)`);
    return null;
  }

  if (userStats.CP + debtChange < 0) {
    return null;
  }
  
  const originalDebtChange = debtChange;

  if (debtChange > 0) { //apply interest
    debtChange = Math.ceil(debtChange * grankStats.interest);
  }
  
  let newDebtLedger = { ...grankStats.debtLedger };

  const oldDebt = newDebtLedger[userId].debt
  const newDebt = oldDebt + debtChange;
  
  if (!oldDebt) {
    if (!due) {
      console.error(`No due date provided for ${grankId} (${userId} Debt Ledger change of ${debtChange}CP)`);
      return null;
    }
    newDebtLedger[userId].due = due;
  } else if (!newDebt) {
    newDebtLedger[userId].due = null;
  }

  newDebtLedger[userId].debt = newDebt;

  const calculateInterest = (stats: IGrankStats) => {
    let totalDebt = 0;
    for (const userId in stats.debtLedger) {
      totalDebt += stats.debtLedger[userId].debt;
    }
    const percentageLoaned = totalDebt / (stats.CP + totalDebt);
    const newInterest = (stats.interestBounds.max - stats.interestBounds.min) * percentageLoaned + stats.interestBounds.min;
    return newInterest;
  }
  
  const newInterest = calculateInterest(grankStats);

  await PlayerStats.updateOne(
    { userId },
    {
      $inc: {
        CP: originalDebtChange
      }
    }
  )
  await GrankStats.updateOne(
    { grankId },
    {
      $set: {
        debtLedger: newDebtLedger,
        interest: newInterest,
      },
      $inc: {
        CP: -originalDebtChange
      }
    }
  )

  return grankStats;
}

GrankStats.createAccount = async function(grankId: string, userId: string) {
  const userStats = await PlayerStats.getStats(userId);
  if (!userStats) {
    console.error(`Attempted to access non-existent or broken playerStats for ${userId} in Grank account creation`);
    return;
  }

  const grankStats = await GrankStats.getStats(grankId);
  if (!grankStats) {
    console.error(`Attempted to access non-existent or broken grankStats for ${grankId} in Grank account creation`);
    return;
  }

  const newDebtLedger = { ...grankStats.debtLedger };
  newDebtLedger[userId] = { debt: 0, due: null };

  await GrankStats.updateOne(
    { grankId },
    {
      $set: {
        debtLedger: newDebtLedger
      }
    }
  )
}

export { GrankStats, IGrankStats };