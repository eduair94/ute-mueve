// AUTO-GENERATED from packages/openapi/fixtures/customer.card.example.json
// Do NOT edit by hand. Run `pnpm types:generate` to refresh.

export interface CustomerCardFixture {
    data:     Datum[];
    messages: any[];
    success:  boolean;
    errors:   any[];
    result:   number;
}

export interface Datum {
    id:              string;
    cardId:          string;
    firstSixDigits:  string;
    lastFourDigits:  string;
    expirationMonth: string;
    expirationYear:  string;
    identifType:     string;
    identifNumber:   string;
    paymentMethodId: string;
    firstName:       string;
    lastName:        string;
    status:          string;
    statusDate:      string;
    cvvMandatory:    boolean;
    payerCardId:     string;
    issuerId:        string;
    minPay:          number;
    cardUseType:     number;
    cardUseTypeDesc: string;
}

