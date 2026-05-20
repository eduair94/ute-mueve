// AUTO-GENERATED from packages/openapi/fixtures/station.statusFiltered.example.json
// Do NOT edit by hand. Run `pnpm types:generate` to refresh.

export interface StationStatusFilteredFixture {
    data:     Datum[];
    messages: any[];
    success:  boolean;
    errors:   any[];
    result:   number;
}

export interface Datum {
    id:                  number;
    name:                string;
    source:              string;
    status:              number;
    statusDetails:       string;
    lat:                 number;
    lng:                 number;
    chargeNetworkName:   string;
    countryCode:         string;
    operatorLogoUrl:     null;
    cardUseTypeDiscount: null;
}

