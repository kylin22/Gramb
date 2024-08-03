enum Currencies {
    CP = "CP",
    CX = "CX"
}

type Prices = {
    [key in Currencies]?: number;
}

export { Currencies, Prices }