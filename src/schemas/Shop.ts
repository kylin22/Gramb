import { Schema, model, Model } from "mongoose";
import Item from "../classes/Item";
import itemsMap from "../config/items";
import { Prices } from "../classes/Currencies";

let defaultPrices = Item.initializeResourcePrices(itemsMap);

interface IShopStats extends Document {
  shopId: string;
  price: { [itemId: string]: { sellPrice: Prices } };
}

interface IShopStatsModel extends Model<IShopStats> {
  createWithDefaults(shopId: string): Promise<boolean | null>;
  getStats(shopId: string): Promise<IShopStats | null>;
}

const ShopStatsSchema = new Schema({
  shopId: {
    type: String,
    required: true,
  },
  price: {
    type: Object,
    default: defaultPrices,
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
    console.error(`Failed to retrieve grank stats for grank ${shopId}: ${error.stack}`);
    return null;
  }
}

export { ShopStats, IShopStats };