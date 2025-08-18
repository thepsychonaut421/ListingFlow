# Overview

**ListingFlow** is a middleware between **ERPNext** and e-commerce platforms like **eBay** and **Shopify**.  
It imports products from ERPNext, processes and enriches the product data, and prepares them for publishing.  
The system uses **Genkit AI** for:
- Category detection
- Description generation
- Technical specification extraction (brand, model, power, material, etc.)

---

## 🚀 Key Features
- **Import products from ERPNext** – Synchronizes product list from ERPNext into ListingFlow.
- **Product data enrichment** – Enhances imported items with AI-generated descriptions and specifications.
- **Automated category detection** – Uses AI to determine the best-fit category for eBay listings.
- **Technical specifications auto-extraction** – Extracts attributes like brand, model, power, capacity, material, dimensions, etc.
- **Export back to ERPNext** – Updates the **Description** field in ERPNext with all enriched technical data.

---

## ⚙️ Recommended Workflow
1. **Import products** from ERPNext using the **Import from ERPNext** feature.
2. **Run the AI actions**:
   - Find Category
   - Generate Description
   - Find Technical Specs (brand, model, and other technical attributes)
3. **Review & adjust** extracted data inside the product form in ListingFlow.
4. **Export back to ERPNext** — all technical specifications will be appended to the **Description** field.

---

## 📤 ERPNext Export Format

When exporting to ERPNext, ListingFlow formats the **Description** as:

```plaintext
[Original description]

Marke: [Brand]
Modell: [Model]
Leistung: [Power]
Kapazität: [Capacity]
Material: [Material]
Max. Temperatur: [Max Temperature]
Spannung: [Voltage]
Maße: [Dimensions]
Timer: [Timer range]
Gewicht: [Weight]

Funktionen:
[Comma-separated list of functions]

Zubehör:
[Comma-separated list of accessories]

💡 Note: If a brand is not pre-defined in ERPNext, it will still be included in the Description text, ensuring visibility without requiring ERPNext brand record creation.

---

## 🛠 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/thepsychonaut421/ListingFlow.git
cd ListingFlow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a file named `.env.local` in the project root and add the following variables. These are essential for authentication and connecting to external services.

```env
# ERPNext Credentials
NEXT_PUBLIC_ERPNEXT_URL=https://erp.example.com
ERPNEXT_API_KEY=xxxxx
ERPNEXT_API_SECRET=xxxxx

# Firebase Credentials (get these from your Firebase project settings)
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxx

# Firebase App Check Credentials
# Get this from your Google Cloud Console -> APIs & Services -> Credentials -> reCAPTCHA Enterprise
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=xxxxx
```

### 4. Configure Deployment Secrets

When deploying to Firebase App Hosting, you must create secrets for your environment variables. Run the following commands, replacing `your_value_here` with your actual credentials:

```bash
# Set secrets for ERPNext
firebase apphosting:secrets:set ERPNEXT_API_KEY --value=your_value_here
firebase apphosting:secrets:set ERPNEXT_API_SECRET --value=your_value_here

# Set secrets for Firebase SDK
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_API_KEY --value=your_value_here
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --value=your_value_here
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_PROJECT_ID --value=your_value_here
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_APP_ID --value=your_value_here
firebase apphosting:secrets:set NEXT_PUBLIC_RECAPTCHA_SITE_KEY --value=your_value_here
```

After creating the secrets, **you must grant the App Hosting service account access to them**. This is a critical step.

```bash
firebase apphosting:secrets:grantaccess ERPNEXT_API_KEY ERPNEXT_API_SECRET NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN NEXT_PUBLIC_FIREBASE_PROJECT_ID NEXT_PUBLIC_FIREBASE_APP_ID NEXT_PUBLIC_RECAPTCHA_SITE_KEY
```

The `apphosting.yaml` file is already configured to use these secrets.

### 5. Start the development server

```bash
npm run dev
```

---

## 📂 Project Structure
	•	/src/app – Main application pages and logic
	•	/src/components – UI components (forms, tables, etc.)
	•	/src/ai/flows – AI logic for categories, descriptions, and specs extraction
	•	/src/server/api – API endpoints for ERPNext and AI processing
	•	/public – Static resources

---

## 📌 Notes
	•	Works even if ERPNext doesn’t have the brand registered in its database.
	•	Keeps ERPNext as the single source of truth while allowing advanced AI-based enrichment in ListingFlow.
	•	Easily extendable for additional platforms like Amazon or WooCommerce.
