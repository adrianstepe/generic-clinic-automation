// Clinic configuration for personalized landing pages
export interface ClinicConfig {
    slug: string;
    name: string;
    phone: string;
    email?: string;
}

export const clinics: ClinicConfig[] = [
    { slug: "alpha-dental", name: "Alpha Dental Clinic", phone: "+371 29206450", email: "alpha@alphadentalclinic.lv" },
    { slug: "elsia", name: "ELSIA", phone: "+371 26726704", email: "info@cerec.lv" },
    { slug: "era-esthetic", name: "ERA Esthetic Dental", phone: "+371 25333303" },
    { slug: "aurora-dental", name: "Aurora Dental", phone: "+371 67 373 654" },
    { slug: "x-dental", name: "X-Dental", phone: "+371 67 552 431", email: "xdental@balticom.lv" },
    { slug: "maxilla", name: "Maxilla", phone: "+371 66002528", email: "info@maxilla.lv" },
    { slug: "comfortdent", name: "ComfortDent", phone: "+371 29713775", email: "info@comfortdent.lv" },
    { slug: "smile-office", name: "Smile Office", phone: "+371 23302158" },
    { slug: "dental-shop", name: "Dental Shop", phone: "+371 23079205", email: "info@dentalshopclinic.lv" },
    { slug: "jk-diennakts", name: "JK Diennakts Zobārstniecība", phone: "+371 26557021", email: "info@diennaktszobarstnieciba.lv" },
];

export const getClinicBySlug = (slug: string): ClinicConfig | undefined => {
    return clinics.find(c => c.slug === slug);
};

export const defaultClinic: ClinicConfig = {
    slug: "demo",
    name: "Demo Klīnika",
    phone: "+371 20000000",
};
