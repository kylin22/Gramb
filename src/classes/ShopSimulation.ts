import { IShopStats, ShopStats } from "../schemas/Shop";
import { Prices, Currencies } from "./Currencies";

interface ShopItem {
    id: string;
    currencyType: Currencies;
    initialPrice: number;
    price: number;
    volatility: number;
    meanReversionSpeed: number;
}

export default class ShopSimulation {
    private historyWindow: { [itemId: string]: { sellPrice: Prices[] } };
    private items: ShopItem[] = [];
    private shop: IShopStats;
    
    constructor(shop: IShopStats) {
        const VOLATILITY_PERCENTAGE = 30;
        const REVERSION_PERCENTAGE = 20;
        this.shop = shop;
        this.historyWindow = shop.history;
        //bug in constructor
        for (const itemId in shop.price) {
            for (const currency of Object.values(Currencies)) {
                let itemPrice = 0;
                if (Object.keys(shop.price[itemId].sellPrice).includes(currency.toString())) {
                    itemPrice = shop.price[itemId].sellPrice[currency]!;

                    const newItem: ShopItem = { 
                        id: itemId, 
                        currencyType: currency, 
                        initialPrice: itemPrice, 
                        price: itemPrice, 
                        volatility: itemPrice / VOLATILITY_PERCENTAGE, 
                        meanReversionSpeed: itemPrice / REVERSION_PERCENTAGE 
                    };
                    
                    this.items.push(newItem);
                }
            }
        }
    }

    async simulateStep() {
        let nextItems: ShopItem[] = [];
        for (const shopItem of this.items) {
            const direction = Math.random() > 0.5 ? 1 : -1;
            let magnitude = Math.random() * shopItem.volatility;
            let potentialNewPrice = shopItem.price + (direction * magnitude);

            const VARIANCE = 0.5;
            if (potentialNewPrice < shopItem.initialPrice * VARIANCE) {
                magnitude = (shopItem.initialPrice * VARIANCE - shopItem.price);
            } else if (potentialNewPrice > shopItem.initialPrice * (VARIANCE + 1)) {
                magnitude = (shopItem.initialPrice * (VARIANCE + 1) - shopItem.price);
            }
        
            shopItem.price += direction * magnitude;
            //mean reversion
            const movingAverage = this.calculateMovingAverage(shopItem);
            const deviationThreshold = shopItem.meanReversionSpeed;
            if (Math.abs(shopItem.price - movingAverage) > deviationThreshold) {
                const adjustmentAmount = deviationThreshold * (shopItem.price - movingAverage) / Math.abs(shopItem.price - movingAverage);
                shopItem.price -= adjustmentAmount;
            }

            nextItems.push(shopItem);
        }

        const convertItemsToPrices = (shopItems: ShopItem[]) => {
            let prices: { [itemId: string]: { sellPrice: Prices } } = {};
            //TODO doesn't handle duplicate objects
            shopItems.forEach(item => {
                prices[item.id] = { sellPrice: { [item.currencyType]: item.price } }
            });
            return prices;
        }

        this.items = nextItems;
        await ShopStats.updateStats(this.shop.shopId, convertItemsToPrices(nextItems));
    }

    //doesnt handle multiple currencies
    calculateMovingAverage(shopItem: ShopItem): number {
        return this.historyWindow[shopItem.id].sellPrice.reduce((acc, curr) => acc + curr[shopItem.currencyType]!, 0) / this.historyWindow[shopItem.id].sellPrice.length;
    }
}