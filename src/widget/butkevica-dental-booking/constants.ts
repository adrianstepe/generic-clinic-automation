import { Language, Service, Specialist, Translations, Clinic } from './types';

export const SERVICES: Service[] = [
    {
        id: 's1',
        name: { [Language.EN]: 'Integrated Teeth and Oral Cavity Test', [Language.LV]: 'Integrēta zobu un mutes dobuma pārbaude', [Language.RU]: 'Комплексное обследование зубов и полости рта' },
        description: { [Language.EN]: 'Full mouth examination with X-rays and personalized treatment plan.', [Language.LV]: 'Pilna mutes dobuma izmeklēšana ar rentgenu un individuāls ārstēšanas plāns.', [Language.RU]: 'Полное обследование полости рта с рентгеном и индивидуальный план лечения.' },
        price: 50,
        durationMinutes: 45,
        icon: '',
        category: 'preventive'
    },
    {
        id: 's2',
        name: { [Language.EN]: 'Check-Ups and Dental Hygiene', [Language.LV]: 'Pārbaudes un zobu higiēna', [Language.RU]: 'Осмотры и гигиена зубов' },
        description: { [Language.EN]: 'Routine examination, professional cleaning, and plaque removal.', [Language.LV]: 'Kārtējā pārbaude, profesionālā tīrīšana un aplikuma noņemšana.', [Language.RU]: 'Плановый осмотр, профессиональная чистка и удаление налёта.' },
        price: 65,
        durationMinutes: 60,
        icon: '',
        category: 'preventive'
    },
    {
        id: 's3',
        name: { [Language.EN]: "Children's Dentistry (up to 14 years)", [Language.LV]: 'Bērnu zobārstniecība (līdz 14 gadiem)', [Language.RU]: 'Детская стоматология (до 14 лет)' },
        description: { [Language.EN]: 'Gentle, kid-friendly care with patience and fun.', [Language.LV]: 'Maiga, bērniem draudzīga aprūpe ar pacietību un jautrību.', [Language.RU]: 'Бережный, дружелюбный к детям уход с терпением и весельем.' },
        price: 45,
        durationMinutes: 30,
        icon: '',
        category: 'children'
    },
    {
        id: 's4',
        name: { [Language.EN]: 'Dental Treatment', [Language.LV]: 'Zobu ārstēšana', [Language.RU]: 'Лечение зубов' },
        description: { [Language.EN]: 'For cavities, toothaches, or broken teeth. Fillings and repairs.', [Language.LV]: 'Kariesa, zobu sāpju vai bojātu zobu ārstēšana. Plombēšana un remonts.', [Language.RU]: 'При кариесе, зубной боли или сломанных зубах. Пломбы и ремонт.' },
        price: 60,
        durationMinutes: 60,
        icon: '',
        category: 'treatment'
    },
    {
        id: 's5',
        name: { [Language.EN]: 'Sedative Treatment', [Language.LV]: 'Ārstēšana sedācijā', [Language.RU]: 'Лечение под седацией' },
        description: { [Language.EN]: 'Relaxed, anxiety-free dental care. Ideal for dental phobia.', [Language.LV]: 'Relaksēta, bez stresa zobārstniecība. Ideāli zobārsta fobijai.', [Language.RU]: 'Расслабленное лечение без тревоги. Идеально при страхе стоматолога.' },
        price: 100,
        durationMinutes: 60,
        icon: '',
        category: 'treatment'
    },
    {
        id: 's6',
        name: { [Language.EN]: 'Teeth Whitening', [Language.LV]: 'Zobu balināšana', [Language.RU]: 'Отбеливание зубов' },
        description: { [Language.EN]: 'Professional whitening for a brighter, whiter smile.', [Language.LV]: 'Profesionāla balināšana spožākam, baltākam smaidam.', [Language.RU]: 'Профессиональное отбеливание для яркой белоснежной улыбки.' },
        price: 250,
        durationMinutes: 90,
        icon: '',
        category: 'treatment'
    },
    {
        id: 's7',
        name: { [Language.EN]: 'Surgery', [Language.LV]: 'Ķirurģija', [Language.RU]: 'Хирургия' },
        description: { [Language.EN]: 'Tooth extractions and minor surgical procedures.', [Language.LV]: 'Zobu izraušana un nelielas ķirurģiskas procedūras.', [Language.RU]: 'Удаление зубов и небольшие хирургические процедуры.' },
        price: 120,
        durationMinutes: 60,
        icon: '',
        category: 'surgery'
    },
    {
        id: 's8',
        name: { [Language.EN]: 'Prosthetics', [Language.LV]: 'Protezēšana', [Language.RU]: 'Протезирование' },
        description: { [Language.EN]: 'Crowns, bridges, and dentures to restore your smile.', [Language.LV]: 'Kroņi, tilti un protēzes smaida atjaunošanai.', [Language.RU]: 'Коронки, мосты и протезы для восстановления улыбки.' },
        price: 400,
        durationMinutes: 60,
        icon: '',
        category: 'prosthetics'
    },
    {
        id: 's9',
        name: { [Language.EN]: 'Implantology', [Language.LV]: 'Implantoloģija', [Language.RU]: 'Имплантология' },
        description: { [Language.EN]: 'Permanent tooth replacement with dental implants.', [Language.LV]: 'Pastāvīga zobu aizstāšana ar zobārstniecības implantiem.', [Language.RU]: 'Постоянное замещение зубов с помощью имплантов.' },
        price: 750,
        durationMinutes: 90,
        icon: '',
        category: 'surgery'
    },
    {
        id: 's10',
        name: { [Language.EN]: 'Restoration of Jaw Bone Tissues', [Language.LV]: 'Žokļa kaula audu atjaunošana', [Language.RU]: 'Восстановление костной ткани челюсти' },
        description: { [Language.EN]: 'Bone grafting to prepare for implants or restore structure.', [Language.LV]: 'Kaula transplantācija implantu sagatavošanai vai struktūras atjaunošanai.', [Language.RU]: 'Костная пластика для подготовки к имплантам или восстановления структуры.' },
        price: 500,
        durationMinutes: 90,
        icon: '',
        category: 'surgery'
    }
];

export const SPECIALISTS: Specialist[] = [
    {
        id: 'd1',
        name: 'Dr. Anna Bērziņa',
        role: { [Language.EN]: 'Lead Surgeon', [Language.LV]: 'Galvenā ķirurģe', [Language.RU]: 'Главный хирург' },
        photoUrl: 'https://picsum.photos/100/100?random=1',
        // Surgery, Implants, Bone Restoration, Prosthetics
        specialties: ['s7', 's9', 's10', 's8']
    },
    {
        id: 'd2',
        name: 'Dr. Jānis Liepiņš',
        role: { [Language.EN]: 'General Dentist', [Language.LV]: 'Vispārējais zobārsts', [Language.RU]: 'Стоматолог общей практики' },
        photoUrl: 'https://picsum.photos/100/100?random=2',
        // Integrated Test, Hygiene, Treatment, Whitening, Prosthetics
        specialties: ['s1', 's2', 's4', 's6', 's8']
    },
    {
        id: 'd3',
        name: 'Dr. Elena Petrova',
        role: { [Language.EN]: 'Pediatric Dentist', [Language.LV]: 'Bērnu zobārste', [Language.RU]: 'Детский стоматолог' },
        photoUrl: 'https://picsum.photos/100/100?random=3',
        // Children, Treatment, Sedation
        specialties: ['s3', 's4', 's5']
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
    id: 'butkevica',
    name: 'Butkeviča Dental Practice',
    domain: 'drbutkevicadentalpractice.com',
    logoUrl: '', // Uses default branding
    clinicEmail: 'info@drbutkevicadentalpractice.com',
    theme: {
        primaryColor: '#0d9488'
    },
    settings: {
        currency: 'EUR',
        timezone: 'Europe/Riga'
    }
};