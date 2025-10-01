
export type LiveItem = {
    name: string;
    data: MarketPriceMap;
    lastUpdated: string | Date | null;
};


type PriceInfo = {
    wp: string;
    rp: string;
};

export type CommonList = {
    title: string;
    id: string;
};

export type ListData = {
    data: CommonList[];
    date: string | Date | null;
};

export type MarketPrice = {
    KERALA: PriceInfo;
    OUT_OF_STATE: PriceInfo;
};

export type MarketPriceMap = Record<string, MarketPrice>;
export type MarketPriceResponse = { data: MarketPriceMap; date: string | Date | null, name?: string | null };

export type LiveResponse = {
    data: Record<string, LiveItem>;
};