Da — aproape 👍, dar dacă vrei să arate „cum trebuie” pe GitHub, trebuie să corectăm câteva lucruri:
	1.	Indentarea ta cu • și taburi în secțiuni precum Project Structure și Notes nu e nevoie — pe GitHub e mai bine să folosești listă markdown cu - sau *.
	2.	Blocurile de cod pentru comenzi (git clone, npm install etc.) trebuie închise corect în bash și env.
	3.	Secțiunea ERPNext Export Format e mai lizibilă dacă o punem într-un bloc de cod.
	4.	Evităm amestecul de stiluri (bullet-uri + taburi + linii „⸻”) și folosim separator markdown --- unde vrei o linie.

Ți-l rescriu rapid optimizat pentru GitHub:

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

⸻

🛠 Installation & Setup
	1.	Clone the repository

git clone https://github.com/[user]/ListingFlow.git
cd ListingFlow

	2.	Install dependencies

npm install

	3.	Configure environment variables in .env

ERP_API_URL=https://erp.example.com
ERP_API_KEY=xxxxx
ERP_API_SECRET=xxxxx
GENKIT_API_KEY=xxxxx

	4.	Start the development server

npm run dev


⸻

📂 Project Structure
	•	/src/app – Main application pages and logic
	•	/src/components – UI components (forms, tables, etc.)
	•	/src/ai/flows – AI logic for categories, descriptions, and specs extraction
	•	/src/server/api – API endpoints for ERPNext and AI processing
	•	/public – Static resources

⸻

📌 Notes
	•	Works even if ERPNext doesn’t have the brand registered in its database.
	•	Keeps ERPNext as the single source of truth while allowing advanced AI-based enrichment in ListingFlow.
	•	Easily extendable for additional platforms like Amazon or WooCommerce.
