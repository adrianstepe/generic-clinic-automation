import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { ClinicConfig } from "@/config/clinics";

interface ClinicPageProps {
    clinic: ClinicConfig;
}

const ClinicPage = ({ clinic }: ClinicPageProps) => {
    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <Navigation clinicName={clinic.name} phone={clinic.phone} />
            <Hero clinicName={clinic.name} phone={clinic.phone} />
            <Services />
            <Contact />
            <Footer clinicName={clinic.name} phone={clinic.phone} email={clinic.email} />
        </div>
    );
};

export default ClinicPage;
