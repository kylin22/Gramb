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
    private historyWindow: number[];
    private historyWindowSize: number;
    private items: ShopItem[] = [];
    private shop: IShopStats;
    
    constructor(shop: IShopStats) {
        this.shop = shop;
        //bug in constructor
        for (const itemId in shop.price) {
            for (const currency of Object.values(Currencies)) {
                let itemPrice = 0;
                if (currency in Object.keys(shop.price[itemId].sellPrice)) {
                    itemPrice = shop.price[itemId].sellPrice[currency]!;
                }

                const newItem: ShopItem = { 
                    id: itemId, 
                    currencyType: currency, 
                    initialPrice: itemPrice, 
                    price: itemPrice, 
                    volatility: itemPrice / 20, 
                    meanReversionSpeed: itemPrice / 50 
                };

                this.items.push(newItem);
            }
        }
        this.items.forEach(element => {
            console.log(element);
        });
        

        this.historyWindow = [];
        this.historyWindowSize = 10;
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
            this.updateHistoryWindow(shopItem.price);
            //mean reversion
            const movingAverage = this.calculateMovingAverage();
            if (Math.abs(shopItem.price - movingAverage) > shopItem.meanReversionSpeed) {
                const adjustment = shopItem.meanReversionSpeed * (movingAverage - shopItem.price);
                shopItem.price += adjustment;
            }
            //ensure price stays within bounds after adjustment
            shopItem.price = Math.max(shopItem.initialPrice * VARIANCE, Math.min(shopItem.price, shopItem.initialPrice * (VARIANCE + 1)));

            nextItems.push(shopItem);
            console.log(`${shopItem.currencyType}: ${shopItem.initialPrice}`);
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

    updateHistoryWindow(newPrice: number): void {
        this.historyWindow.unshift(newPrice);
        if (this.historyWindow.length > this.historyWindowSize) {
            this.historyWindow.pop();
        }
    }

    calculateMovingAverage(): number {
        return this.historyWindow.reduce((acc, curr) => acc + curr, 0) / this.historyWindow.length;
    }

    getPriceHistory(): number[] {
        return [...this.historyWindow];
    }
}