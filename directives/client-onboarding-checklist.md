# Klienta Onboarding Kontrolsaraksts

Kad paraksti līgumu ar jaunu zobārstniecības klīniku, izmanto šo kontrolsarakstu, lai pilnībā iestatītu viņu rezervācijas automatizācijas sistēmu.

---

## 1. Informācija, ko Savākt no Klienta

### Uzņēmuma Dati
- [ ] Klīnikas nosaukums (oficiālais, brendingam)
- [ ] Klīnikas adrese (pilna)
- [ ] Galvenais tālruņa numurs
- [ ] Galvenais e-pasts (pacientu jautājumiem)
- [ ] Mājas lapas URL (ja ir)
- [ ] Logo fails (PNG, augsta izšķirtspēja)
- [ ] Brenda krāsas (hex kodi vai ļauj mums dizainēt)

### Komandas Informācija
- [ ] Ārstu/speciālistu saraksts (vārds, amats, specializācijas)
- [ ] Ārstu fotogrāfijas (pēc izvēles, priekš widget)
- [ ] Ārstu grafiki (darba dienas/stundas)
- [ ] Kurus pakalpojumus katrs ārsts var veikt

### Pakalpojumu Saraksts
- [ ] Piedāvāto pakalpojumu saraksts
- [ ] Cena katram pakalpojumam (vai cenu diapazoni)
- [ ] Ilgums katram pakalpojumam (30 min, 1 stunda, utt.)
- [ ] Depozīta summa par pakalpojumu (vai vienota likme, piem. €30)

---

## 2. Konti, ko Iestatīt (Mūsu Pusē)

### Supabase
- [ ] Izveidot jaunu projektu vai pievienot esošam
- [ ] Palaist datubāzes shēmas migrāciju
- [ ] Iestatīt RLS politikas
- [ ] Izveidot API atslēgas priekš n8n

### Stripe
- [ ] Dabūt klienta Stripe API atslēgas (Publishable + Secret)
- [ ] Konfigurēt webhook endpoint
- [ ] Iestatīt pareizo valūtu (EUR)
- [ ] Iestatīt depozītu summas atbilstoši pakalpojumiem

### Google Workspace (priekš klīnikas)
- [ ] Iestatīt `noreply@[klinika-domēns]` e-pastiem
- [ ] Savienot Gmail OAuth n8n
- [ ] Savienot klīnikas īpašnieka Google Calendar n8n
- [ ] Pārbaudīt kalendāra atļaujas
- [ ] **⚠️ KRITISKS: Publicēt Google Cloud App "Production" režīmā** - Pretējā gadījumā OAuth tokens beigsies pēc 7 dienām!
  - Google Cloud Console → APIs & Services → OAuth consent screen → "Publish App"
  - Pirmajā autentifikācijā parādīsies "Google hasn't verified this app" - spiest "Advanced" → "Go to [app name]"

### n8n Workflows
- [ ] Klonēt bāzes workflow veidnes
- [ ] Atjaunināt credentials (Stripe, Gmail, Calendar, Supabase, Telegram)
- [ ] Atjaunināt klīnikas specifisko tekstu (latviešu/angļu)
- [ ] Testēt pilnu rezervācijas plūsmu no sākuma līdz beigām
- [ ] Aktivizēt workflow

### Cloudflare/Hostings
- [ ] Izveidot jaunu pages projektu priekš widget
- [ ] Konfigurēt custom domēnu (ja nepieciešams)
- [ ] Iestatīt environment variables

---

## 3. Pielāgošanas Jautājumi Klientam

### E-pasta Veidnes
Jautā klientam, kā viņi vēlas, lai apstiprinājuma e-pasti izskatās:

> "Mēs sūtām automātiskus apstiprinājuma e-pastus pacientiem. Vai vēlaties tos:
> - Tikai latviski?
> - Tikai angliski?  
> - Abās valodās (automātiski noteikts)?
>
> Šeit ir paraugs, ko e-pasts saka:
> _'Labdien, [Vārds]! Paldies par Jūsu maksājumu €30 apmērā! Jūsu zobārstniecības vizīte ir apstiprināta...'_
>
> Vai vēlaties mainīt šo tekstu?"

### Atgādinājumu Preferences
> "Mēs varam sūtīt pacientiem automātiskus atgādinājumus pirms vizītes:
> - Cik stundas iepriekš? (mēs iesakām 24h un 2h)
> - Ar e-pastu, SMS, vai abiem?"

### Recall Sistēma
> "Mēs varam automātiski sūtīt e-pastus pacientiem, kuri nav apmeklējuši 6 mēnešus. Vai vēlaties ieslēgt šo funkciju?"

### Depozīta Politika
> "Par rezervācijas depozītu:
> - Kāda summa? (€20, €30, €50?)
> - Vai tam jābūt par pakalpojumu vai vienotai likmei?
> - Kā jūs to izskaidrojat pacientiem? (mēs rādām 'nodrošina jūsu laiku, tiek atskaitīts no gala rēķina')"

### Atcelšanas Politika
> "Kāda ir jūsu atcelšanas politika?
> - Cik stundas iepriekš var atcelt ar pilnu atmaksu?
> - Vai paturāt depozītu, ja pacients neierodas?"

### Kalendāra Notikumu Detaļas
> "Kādai informācijai jāparādās jūsu Google Calendar notikumos?
> - Pacienta vārds ✓
> - Pakalpojuma veids ✓
> - Pacienta tālruņa numurs?
> - Pacienta e-pasts?
> - Vēl kaut kas?"

---

## 4. Tehniskie Iestatīšanas Soļi

### Widget Izvietošana
```bash
# Klonēt widget jaunam klientam
cp -r src/widget/butkevica-dental-booking src/widget/[jauna-klinika-nosaukums]

# Atjaunināt konfigurācijas failus
# - constants.ts: pakalpojumi, cenas, teksti
# - .env: Stripe atslēgas, Supabase URL
```

### n8n Workflow Klonēšana
1. Eksportēt bāzes workflow JSON
2. Importēt n8n
3. Atjaunināt visus credentials
4. Atjaunināt teksta virknes (e-pasta saturs, kalendāra kopsavilkums)
5. Atjaunināt Telegram chat ID brīdinājumiem
6. Testēt ar testa Stripe maksājumu
7. Aktivizēt

### Stripe Webhook
```
POST https://[n8n-domēns]/webhook/stripe-confirmation-webhook
Events: checkout.session.completed
```

---

## 5. Nodošana Klientam

### Apmācības Sesija (~30 min)
- [ ] Dashboard pārskats
- [ ] Kā skatīt vizītes
- [ ] Kā pārvaldīt grafika bloķēšanu/atvaļinājumus
- [ ] Ko darīt, ja kaut kas salūzt (sazināties ar tevi)

### Dokumentācija, ko Sniegt
- [ ] Ātrās uzsākšanas ceļvedis
- [ ] "Kā pievienot atvaļinājuma dienu"
- [ ] "Kā mainīt pakalpojumu cenas"
- [ ] Ārkārtas kontakts (tavs Telegram/e-pasts)

### Go-Live Kontrolsaraksts
- [ ] Visas testa rezervācijas izdzēstas no Supabase
- [ ] Stripe LIVE režīmā (ne testa)
- [ ] Workflows aktīvi un webhook URL pareizi konfigurēti
- [ ] Widget ievietots klīnikas mājaslapā
- [ ] Pirmā īstā rezervācija veiksmīgi apstrādāta

### Twilio SMS (SVARĪGI!)
- [ ] **Twilio konta upgrade uz PAID** - Trial konts pievieno "Sent from your Twilio trial account" visām SMS
- [ ] Iegādāties lokālo Latvijas numuru (+371) profesionālākam izskatam
- [ ] Pārbaudīt, ka SMS atgādinājumi atnāk bez trial prefiksa
- [ ] Izmaksas: ~€0.05-0.08 par SMS, ~€25-40/mēnesī par 500 SMS

### n8n Workflow Aktivizācija
- [ ] **KATRS workflow jābūt AKTĪVAM (zaļā toggle)** - webhook nestrādā ja workflow nav aktīvs
- [ ] Pārbaudīt n8n-8-cancellation.json ir aktivizēts
- [ ] Pārbaudīt ka Cloudflare env `N8N_CANCELLATION_WEBHOOK_URL` atbilst n8n webhook URL
- [ ] Manuāli testēt webhook ar curl pirms go-live

### Stripe Refund Konfigurācija
- [ ] Izveidot HTTP Basic Auth credential n8n ar nosaukumu "Stripe API Key"
  - Username: Stripe secret key (`sk_live_...`)
  - Password: (tukšs)
- [ ] Testēt refund plūsmu ar testa atcelšanu (>24h pirms vizītes)

---

## 6. Pēc-Palaišanas Monitorings (Pirmā Nedēļa)

- [ ] Ikdienas pārbaude, ka rezervācijas plūst uz Supabase
- [ ] Pārbaudīt, ka kalendāra notikumi tiek izveidoti
- [ ] Apstiprināt, ka e-pasti tiek piegādāti (nav spam mapē)
- [ ] Pārbaudīt n8n izpildes kļūdām
- [ ] Jautāt klientam atsauksmes pēc 3-5 īstām rezervācijām
- [ ] Pārbaudīt SMS atgādinājumus - vai atnāk bez trial prefiksa
- [ ] Testēt atcelšanas plūsmu - vai n8n workflow izpildās

---

## Ātrā Atsauce: Nepieciešamie Credentials

| Serviss | Credential Veids | Kur Dabūt |
|---------|------------------|-----------|
| Stripe | API Keys (pk_, sk_) | Stripe Dashboard → Developers → API keys |
| Stripe Refund | HTTP Basic Auth | n8n → Credentials → sk_live_... kā username |
| Gmail | OAuth2 | n8n → Credentials → Gmail → Connect |
| Google Calendar | OAuth2 | n8n → Credentials → Google Calendar → Connect |
| Supabase | API URL + anon key | Supabase Dashboard → Settings → API |
| Telegram | Bot Token + Chat ID | BotFather + `getUpdates` API |
| Twilio | Account SID + Auth Token | Twilio Console → Account → Keys |

---

## Piezīmes & Uzlabojumi

_Pievieno piezīmes šeit, mācoties no katra onboarding:_

- 2025-12-13: Twilio trial konts pievieno "Sent from your Twilio trial account" - JĀUPGRADE pirms go-live!
- 2025-12-13: n8n cancellation workflow neizpildās ja nav AKTĪVS - webhook vienkārši nestrādā
- 2025-12-13: Atcelšana <24h nerefundo depozītu (by design) - pārliecināties ka klients saprot šo politiku 
