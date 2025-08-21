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
- **Publish to Shopify** - Creates new products directly in your Shopify store.

---

## ⚙️ Recommended Workflow
1. **Import products** from ERPNext using the **Import from ERPNext** feature.
2. **Run the AI actions**:
   - Find Category
   - Generate Description
   - Find Technical Specs (brand, model, and other technical attributes)
3. **Review & adjust** extracted data inside the product form in ListingFlow.
4. **Export back to ERPNext** — all technical specifications will be appended to the **Description** field.
5. **Publish to Shopify** - use the action menu to create the product in your store.

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
```

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

### 3. Configure Environment Variables for Local Development

Create a file named `.env.local` in the project root and add the following variables. These are essential for connecting to external services. Use the `.env` file as a template.

```env
# ERPNext Credentials
ERPNEXT_BASE_URL=https://erp.example.com
NEXT_PUBLIC_ERPNEXT_BASE_URL=https://erp.example.com
ERPNEXT_API_KEY=xxxxx
ERPNEXT_API_SECRET=xxxxx

# Shopify Credentials
SHOPIFY_STORE_URL="https://your-store-name.myshopify.com"
SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_..."
```

### 4. Configure Deployment Secrets for Firebase App Hosting

When deploying to Firebase App Hosting, you must create secrets for your environment variables. **This is a mandatory step for the deployed app to function correctly.**

Run the following commands, replacing `your_value_here` with your actual credentials:

```bash
# Set secrets for ERPNext
firebase apphosting:secrets:set ERPNEXT_API_KEY
firebase apphosting:secrets:set ERPNEXT_API_SECRET

# Set secrets for Shopify
firebase apphosting:secrets:set SHOPIFY_STORE_URL
firebase apphosting:secrets:set SHOPIFY_ADMIN_ACCESS_TOKEN
```
*(You will be prompted to enter the secret value in your terminal after running each command.)*

After creating the secrets, **you must grant the App Hosting service account access to them**. This is a critical step.

```bash
firebase apphosting:secrets:grantaccess ERPNEXT_API_KEY ERPNEXT_API_SECRET SHOPIFY_STORE_URL SHOPIFY_ADMIN_ACCESS_TOKEN
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
