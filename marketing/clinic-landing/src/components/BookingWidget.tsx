import { Shield } from "lucide-react";

interface BookingWidgetProps {
  clinicId?: string;
}

const BookingWidget = ({ clinicId = "butkevica" }: BookingWidgetProps) => {
  // Build widget URL with clinicId parameter
  const widgetUrl = `https://test1-3oj.pages.dev/?clinicId=${clinicId}`;

  return (
    <div
      id="booking-widget-container"
      className="bg-card rounded-3xl w-full max-w-md shadow-elegant relative overflow-hidden"
      style={{ height: '620px' }}
    >
      {/* Loading state text (hidden when iframe loads) */}
      <div className="absolute inset-0 flex items-center justify-center bg-card z-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Ielādē pieraksta sistēmu...</p>
        </div>
      </div>

      {/* Live booking widget iframe */}
      <iframe
        src={widgetUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        title="Online Pieraksts"
        className="relative z-10 rounded-3xl"
        loading="lazy"
        allow="payment"
      />

      {/* Trust indicator overlay */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-muted-foreground text-sm z-20 pointer-events-none">
        <div className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Droša datu pārraide</span>
        </div>
      </div>
    </div>
  );
};

export default BookingWidget;
