import { Language, Service, Specialist, Translations, Clinic } from './types';

// Patient-friendly services based on real Riga dental clinic offerings
export const SERVICES: Service[] = [
    {
        id: 'demo_s1',
        name: { [Language.EN]: 'Consultation', [Language.LV]: 'Konsultācija', [Language.RU]: 'Консультация' },
        description: { [Language.EN]: 'Examination, X-ray, and treatment plan.', [Language.LV]: 'Izmeklēšana, rentgens un ārstēšanas plāns.', [Language.RU]: 'Осмотр, рентген и план лечения.' },
        price: 35,
        durationMinutes: 30,
        icon: '',
        category: 'preventive'
    },
    {
        id: 'demo_s2',
        name: { [Language.EN]: 'Dental Hygiene', [Language.LV]: 'Zobu higiēna', [Language.RU]: 'Гигиена зубов' },
        description: { [Language.EN]: 'Professional cleaning and tartar removal.', [Language.LV]: 'Profesionālā tīrīšana un zobakmens noņemšana.', [Language.RU]: 'Профессиональная чистка и удаление камня.' },
        price: 65,
        durationMinutes: 60,
        icon: '',
        category: 'preventive'
    },
    {
        id: 'demo_s3',
        name: { [Language.EN]: 'Teeth Whitening', [Language.LV]: 'Zobu balināšana', [Language.RU]: 'Отбеливание зубов' },
        description: { [Language.EN]: 'Professional in-office whitening.', [Language.LV]: 'Profesionālā balināšana klīnikā.', [Language.RU]: 'Профессиональное отбеливание в клинике.' },
        price: 150,
        durationMinutes: 90,
        icon: '',
        category: 'treatment'
    },
    {
        id: 'demo_s4',
        name: { [Language.EN]: 'Filling', [Language.LV]: 'Plombēšana', [Language.RU]: 'Пломбирование' },
        description: { [Language.EN]: 'Tooth-colored filling for cavities.', [Language.LV]: 'Zobu krāsas plomba kariesa ārstēšanai.', [Language.RU]: 'Эстетическая пломба для лечения кариеса.' },
        price: 85,
        durationMinutes: 45,
        icon: '',
        category: 'treatment'
    },
    {
        id: 'demo_s5',
        name: { [Language.EN]: 'Root Canal Treatment', [Language.LV]: 'Sakņu kanālu ārstēšana', [Language.RU]: 'Лечение каналов' },
        description: { [Language.EN]: 'Save your tooth with root canal therapy.', [Language.LV]: 'Saglabājiet zobu ar kanālu terapiju.', [Language.RU]: 'Сохраните зуб с помощью лечения каналов.' },
        price: 250,
        durationMinutes: 90,
        icon: '',
        category: 'treatment'
    },
    {
        id: 'demo_s7',
        name: { [Language.EN]: 'Tooth Extraction', [Language.LV]: 'Zoba izraušana', [Language.RU]: 'Удаление зуба' },
        description: { [Language.EN]: 'Safe and painless tooth removal.', [Language.LV]: 'Droša un nesāpīga zoba noņemšana.', [Language.RU]: 'Безопасное и безболезненное удаление.' },
        price: 75,
        durationMinutes: 30,
        icon: '',
        category: 'surgery'
    },
    {
        id: 'demo_s8',
        name: { [Language.EN]: 'Implant Consultation', [Language.LV]: 'Implantu konsultācija', [Language.RU]: 'Консультация по имплантам' },
        description: { [Language.EN]: '3D planning for dental implants.', [Language.LV]: '3D plānošana zobu implantiem.', [Language.RU]: '3D планирование имплантации.' },
        price: 50,
        durationMinutes: 45,
        icon: '',
        category: 'surgery'
    }
];

export const SPECIALISTS: Specialist[] = [
    {
        id: 'demo_d1',
        name: 'Dr. Ieva Bērziņa',
        role: { [Language.EN]: 'Lead Dentist', [Language.LV]: 'Galvenā zobārste', [Language.RU]: 'Главный стоматолог' },
        photoUrl: '/avatar-female.jpg',
        specialties: ['demo_s1', 'demo_s2', 'demo_s3', 'demo_s4', 'demo_s5']
    },
    {
        id: 'demo_d2',
        name: 'Dr. Kārlis Ozols',
        role: { [Language.EN]: 'Dental Hygienist', [Language.LV]: 'Zobu higiēnists', [Language.RU]: 'Гигиенист' },
        photoUrl: '/avatar-male.jpg',
        specialties: ['demo_s2', 'demo_s3']
    },
    {
        id: 'demo_d3',
        name: 'Dr. Anna Liepiņa',
        role: { [Language.EN]: 'Oral Surgeon', [Language.LV]: 'Ķirurģe', [Language.RU]: 'Хирург' },
        photoUrl: '/avatar-female.jpg',
        specialties: ['demo_s5', 'demo_s7', 'demo_s8']
    }
];

export const TEXTS: Translations = {
    headerTitle: { [Language.EN]: 'Book Appointment', [Language.LV]: 'Pieteikt Vizīti', [Language.RU]: 'Записаться' },
    dentalClinic: { [Language.EN]: 'Dental Clinic', [Language.LV]: 'Zobārstniecības Klīnika', [Language.RU]: 'Стоматологическая Клиника' },
    stepService: { [Language.EN]: 'Service', [Language.LV]: 'Pakalpojums', [Language.RU]: 'Услуга' },
    stepDate: { [Language.EN]: 'Date & Time', [Language.LV]: 'Datums un Laiks', [Language.RU]: 'Дата и время' },
    stepDetails: { [Language.EN]: 'Details', [Language.LV]: 'Dati', [Language.RU]: 'Детали' },
    stepPayment: { [Language.EN]: 'Payment', [Language.LV]: 'Maksājums', [Language.RU]: 'Оплата' },
    next: { [Language.EN]: 'Next Step', [Language.LV]: 'Tālāk', [Language.RU]: 'Далее' },
    back: { [Language.EN]: 'Back', [Language.LV]: 'Atpakaļ', [Language.RU]: 'Назад' },
    selectService: { [Language.EN]: 'Select a Service', [Language.LV]: 'Izvēlieties pakalpojumu', [Language.RU]: 'Выберите услугу' },
    selectServiceDesc: { [Language.EN]: 'Choose a treatment to view availability and pricing.', [Language.LV]: 'Izvēlieties ārstēšanu, lai redzētu pieejamību un cenas.', [Language.RU]: 'Выберите процедуру, чтобы увидеть доступность и цены.' },
    selectBtn: { [Language.EN]: 'Select', [Language.LV]: 'Izvēlēties', [Language.RU]: 'Выбрать' },
    selectSpecialist: { [Language.EN]: 'Select a Specialist', [Language.LV]: 'Izvēlieties speciālistu', [Language.RU]: 'Выберите специалиста' },
    anySpecialist: { [Language.EN]: 'Any Available Specialist', [Language.LV]: 'Jebkurš pieejams speciālists', [Language.RU]: 'Любой доступный специалист' },
    morning: { [Language.EN]: 'Morning', [Language.LV]: 'Rīts', [Language.RU]: 'Утро' },
    afternoon: { [Language.EN]: 'Afternoon', [Language.LV]: 'Pēcpusdiena', [Language.RU]: 'День' },
    personalInfo: { [Language.EN]: 'Patient Information', [Language.LV]: 'Pacienta informācija', [Language.RU]: 'Информация о пациенте' },
    firstName: { [Language.EN]: 'First Name', [Language.LV]: 'Vārds', [Language.RU]: 'Имя' },
    lastName: { [Language.EN]: 'Last Name', [Language.LV]: 'Uzvārds', [Language.RU]: 'Фамилия' },
    email: { [Language.EN]: 'Email', [Language.LV]: 'E-pasts', [Language.RU]: 'Эл. почта' },
    phone: { [Language.EN]: 'Phone Number', [Language.LV]: 'Tālruņa numurs', [Language.RU]: 'Номер телефона' },
    symptoms: { [Language.EN]: 'Describe your problem (optional)', [Language.LV]: 'Aprakstiet problēmu (neobligāti)', [Language.RU]: 'Опишите проблему (необязательно)' },
    aiHelp: { [Language.EN]: 'Use AI to suggest service', [Language.LV]: 'Izmantot AI ieteikumiem', [Language.RU]: 'Использовать ИИ' },
    uploadPhoto: { [Language.EN]: 'Upload photo (optional)', [Language.LV]: 'Augšupielādēt foto (neobligāti)', [Language.RU]: 'Загрузить фото (необязательно)' },
    gdprLabel: { [Language.EN]: 'I agree to the processing of my personal data according to the GDPR policy.', [Language.LV]: 'Piekrītu manu personas datu apstrādei saskaņā ar VDAR.', [Language.RU]: 'Я согласен на обработку персональных данных согласно GDPR.' },
    confirm: { [Language.EN]: 'Confirm Booking', [Language.LV]: 'Apstiprināt', [Language.RU]: 'Подтвердить' },
    deposit: { [Language.EN]: 'Pay Today', [Language.LV]: 'Maksājums šodien', [Language.RU]: 'Оплата сегодня' },
    total: { [Language.EN]: 'Total Estimated', [Language.LV]: 'Kopā paredzēts', [Language.RU]: 'Всего' },
    paySecure: { [Language.EN]: 'Pay Securely', [Language.LV]: 'Drošs maksājums', [Language.RU]: 'Безопасная оплата' },
    successTitle: { [Language.EN]: 'Booking Confirmed!', [Language.LV]: 'Rezervācija apstiprināta!', [Language.RU]: 'Бронирование подтверждено!' },
    successMsg: { [Language.EN]: 'A confirmation email has been sent to you.', [Language.LV]: 'Apstiprinājuma e-pasts nosūtīts.', [Language.RU]: 'Письмо с подтверждением отправлено.' },
    addToCalendar: { [Language.EN]: 'Add to Calendar', [Language.LV]: 'Pievienot kalendāram', [Language.RU]: 'Добавить в календарь' },
    analyzing: { [Language.EN]: 'Analyzing...', [Language.LV]: 'Analizē...', [Language.RU]: 'Анализ...' },
    reservationFeeTitle: { [Language.EN]: 'Secure Your Slot', [Language.LV]: 'Rezervē savu laiku', [Language.RU]: 'Забронируйте место' },
    reservationFeeDesc1: { [Language.EN]: 'Your money stays yours — just held securely until your visit.', [Language.LV]: 'Jūsu nauda paliek jums — tikai droši turēta līdz vizītei.', [Language.RU]: 'Ваши деньги остаются вашими — просто хранятся до визита.' },
    reservationFeeDesc2: { [Language.EN]: 'Deducted from your total on the day of your appointment.', [Language.LV]: 'Atskaitīts no kopējās summas vizītes dienā.', [Language.RU]: 'Вычитается из общей суммы в день приёма.' },
    reservationFeeDesc3: { [Language.EN]: 'Only kept if you miss your appointment without 24h notice.', [Language.LV]: 'Tiek paturēts tikai tad, ja neierodaties bez 24h brīdinājuma.', [Language.RU]: 'Удерживается только при неявке без уведомления за 24ч.' },
    startingFrom: { [Language.EN]: 'From', [Language.LV]: 'No', [Language.RU]: 'От' },
    timelineToday: { [Language.EN]: 'Today', [Language.LV]: 'Šodien', [Language.RU]: 'Сегодня' },
    timelineVisit: { [Language.EN]: 'Day of Visit', [Language.LV]: 'Vizītes dienā', [Language.RU]: 'В день визита' },
    timelineRemainder: { [Language.EN]: 'Remainder', [Language.LV]: 'Atlikums', [Language.RU]: 'Остаток' },
    calendarAdded: { [Language.EN]: 'Added to Calendar', [Language.LV]: 'Pievienots kalendāram', [Language.RU]: 'Добавлено в календарь' },
    reservationFeeDeposit: { [Language.EN]: 'Reservation Fee (Deposit)', [Language.LV]: 'Rezervācijas maksa (Depozīts)', [Language.RU]: 'Плата за бронирование (Депозит)' },
    secureCheckout: { [Language.EN]: 'Secure Checkout', [Language.LV]: 'Droša apmaksa', [Language.RU]: 'Безопасная оплата' },
    secureCheckoutDesc: { [Language.EN]: 'You will be redirected to Stripe to securely complete your payment.', [Language.LV]: 'Jūs tiksit novirzīts uz Stripe, lai droši pabeigtu maksājumu.', [Language.RU]: 'Вы будете перенаправлены на Stripe для безопасного завершения платежа.' },
    appointmentSummary: { [Language.EN]: 'Appointment Summary', [Language.LV]: 'Vizītes kopsavilkums', [Language.RU]: 'Сводка записи' },
    dateLabel: { [Language.EN]: 'Date', [Language.LV]: 'Datums', [Language.RU]: 'Дата' },
    timeLabel: { [Language.EN]: 'Time', [Language.LV]: 'Laiks', [Language.RU]: 'Время' },
    serviceLabel: { [Language.EN]: 'Service', [Language.LV]: 'Pakalpojums', [Language.RU]: 'Услуга' },
    specialistLabel: { [Language.EN]: 'Specialist', [Language.LV]: 'Speciālists', [Language.RU]: 'Специалист' },
    nextAvailable: { [Language.EN]: 'Next Available', [Language.LV]: 'Tuvākais pieejamais laiks', [Language.RU]: 'Ближайшее время' },
    noSlotsDate: { [Language.EN]: 'No slots available for this date.', [Language.LV]: 'Šajā datumā nav pieejamu laiku.', [Language.RU]: 'Нет доступных слотов на эту дату.' },
    allBooked: { [Language.EN]: 'All slots are fully booked.', [Language.LV]: 'Visi laiki ir aizņemti.', [Language.RU]: 'Все слоты заняты.' },
    checkingAvailability: { [Language.EN]: 'Checking availability...', [Language.LV]: 'Pārbauda pieejamību...', [Language.RU]: 'Проверка доступности...' },
    findingSlot: { [Language.EN]: 'Finding next available...', [Language.LV]: 'Meklē tuvāko pieejamo...', [Language.RU]: 'Поиск ближайшего...' },
    categoryPreventive: { [Language.EN]: 'Preventive Care', [Language.LV]: 'Regulārā aprūpe', [Language.RU]: 'Профилактика' },
    categoryChildren: { [Language.EN]: 'Children', [Language.LV]: 'Bērniem', [Language.RU]: 'Детская' },
    categoryTreatment: { [Language.EN]: 'Treatment', [Language.LV]: 'Ārstēšana', [Language.RU]: 'Лечение' },
    categorySurgery: { [Language.EN]: 'Surgery & Implants', [Language.LV]: 'Ķirurģija un Implanti', [Language.RU]: 'Хирургия и Имплантация' },
    categoryProsthetics: { [Language.EN]: 'Prosthetics', [Language.LV]: 'Protezēšana', [Language.RU]: 'Протезирование' },
    helpMeChoose: { [Language.EN]: "I'm in Pain / Help Me Choose", [Language.LV]: 'Man sāp / Palīdziet izvēlēties', [Language.RU]: 'У меня болит / Помогите выбрать' },
    helpMeChooseDesc: { [Language.EN]: "Not sure what you need? Book a consultation and we'll help.", [Language.LV]: 'Nezināt, kas jums vajadzīgs? Piesakieties konsultācijai un mēs palīdzēsim.', [Language.RU]: 'Не знаете, что вам нужно? Запишитесь на консультацию, и мы поможем.' },
    priceTooltip: { [Language.EN]: 'Final price depends on treatment complexity and materials used.', [Language.LV]: 'Galīgā cena atkarīga no ārstēšanas sarežģītības un izmantotajiem materiāliem.', [Language.RU]: 'Окончательная цена зависит от сложности лечения и материалов.' },
    popularBadge: { [Language.EN]: 'Popular', [Language.LV]: 'Populārs', [Language.RU]: 'Популярное' },
    trustSignal: { [Language.EN]: 'Free cancellation up to 24h before appointment', [Language.LV]: 'Bezmaksas atcelšana līdz 24h pirms vizītes', [Language.RU]: 'Бесплатная отмена за 24ч до визита' },
    timePeriodMorning: { [Language.EN]: 'Morning', [Language.LV]: 'Rīts', [Language.RU]: 'Утро' },
    timePeriodAfternoon: { [Language.EN]: 'Afternoon', [Language.LV]: 'Diena', [Language.RU]: 'День' },
    timePeriodEvening: { [Language.EN]: 'Evening', [Language.LV]: 'Vakars', [Language.RU]: 'Вечер' },
    slotsAvailable: { [Language.EN]: 'slots', [Language.LV]: 'laiki', [Language.RU]: 'слотов' },
    yourAppointment: { [Language.EN]: 'Your appointment', [Language.LV]: 'Jūsu vizīte', [Language.RU]: 'Ваша запись' },
};

export const DEFAULT_CLINIC: Clinic = {
    id: 'sample',
    name: 'Sample Dental Clinic',
    domain: 'example.com',
    logoUrl: '', // Uses default branding
    clinicEmail: 'clinic@example.com',
    theme: {
        primaryColor: '#0d9488'
    },
    settings: {
        currency: 'EUR',
        timezone: 'Europe/Riga'
    }
};