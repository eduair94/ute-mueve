// AUTO-GENERATED from packages/openapi/fixtures/network.example.json
// Do NOT edit by hand. Run `pnpm types:generate` to refresh.

export interface NetworkFixture {
    data:     Datum[];
    messages: any[];
    success:  boolean;
    errors:   any[];
    result:   number;
}

export interface Datum {
    id:          number;
    networkDesc: string;
    networkId:   string;
    source:      string;
}

