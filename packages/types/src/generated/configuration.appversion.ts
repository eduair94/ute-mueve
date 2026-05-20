// AUTO-GENERATED from packages/openapi/fixtures/configuration.appversion.example.json
// Do NOT edit by hand. Run `pnpm types:generate` to refresh.

export interface ConfigurationAppversionFixture {
    data:     Data;
    messages: any[];
    success:  boolean;
    errors:   any[];
    result:   number;
}

export interface Data {
    customersAppMinVersionSupportedAndroid: string;
    customersAppMinVersionSupportediOS:     string;
    emailServerBlackList:                   any[];
    environment:                            string;
}

