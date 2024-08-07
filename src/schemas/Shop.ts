import { Schema, model, Model } from "mongoose";
import Item from "../classes/Item";
import itemsMap from "../config/items";
import { Prices } from "../classes/Currencies";

let defaultPrices = Item.initializeResourcePrices(itemsMap);
let defaultHistory: { [itemId: string]: { sellPrice: Prices[] } } = {};
for (const itemId in defaultPrices) {
  defaultHistory[itemId] = {
      sellPrice: [defaultPrices[itemId].sellPrice]
  };
}

interface IShopStats extends Document {
  shopId: string;
  price: { [itemId: string]: { sellPrice: Prices } };
  history: { [itemId: string]: { sellPrice: Prices[] } };
}

interface IShopStatsModel extends Model<IShopStats> {
  createWithDefaults(shopId: string): Promise<boolean | null>;
  getStats(shopId: string): Promise<IShopStats | null>;
  updateStats(shopId: string, prices: Prices): Promise<void>;
}

const ShopStatsSchema = new Schema({
  shopId: {
    type: String,
    required: true,
  },
  price: {
    type: Object,
    default: defaultPrices,
  },
  history: {
    type: Object,
    default: defaultHistory,
  }
}, { minimize: false });

const ShopStats = model<IShopStats, IShopStatsModel>("ShopStats", ShopStatsSchema);

ShopStats.createWithDefaults = async function(shopId: string) {
  try {
    let foundStats = await ShopStats.findOne({ shopId });
    
    if (!foundStats) {
      foundStats = new ShopStats({ shopId });
      console.log(`Created grank ${shopId}.`);
      await foundStats.save();
      return true;
    } else {
      console.log(`Shop ${shopId} already exists.`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to create shop stats for shop ${shopId}: ${error.stack}`);
    return null;
  }
};

ShopStats.getStats = async function(shopId: string) {
  try {
    const shopStats = await ShopStats.findOne({ shopId });
    return shopStats ? shopStats.toObject() : null;
  } catch (error) {
    console.error(`Failed to retrieve shop stats for grank ${shopId}: ${error.stack}`);
    return null;
  }
}

ShopStats.updateStats = async function(shopId: string, prices: { [itemId: string]: { sellPrice: Prices } }) {
  const HISTORY_WINDOW_SIZE = 10;

  const shopStats = await ShopStats.getStats(shopId);
  if (!shopStats) {
    console.error(`Attempted to access non-existent or broken shopStats for ${shopId}`);
    return;
  }

  let updatedHistory = shopStats.history;
  for (const itemId in defaultPrices) {
    updatedHistory[itemId].sellPrice.unshift(prices[itemId].sellPrice);
    if (updatedHistory[itemId].sellPrice.length > HISTORY_WINDOW_SIZE) {
      updatedHistory[itemId].sellPrice.pop();
    }
  }

  try {
    await ShopStats.updateOne(
      { shopId },
      { 
        $set: { 
            price: prices, 
            history: updatedHistory
        }
      }
    );
  } catch (error) {
    console.error(`Failed to update CP for shop ${shopId}: ${error.stack}`);
  }
}

export { ShopStats, IShopStats };