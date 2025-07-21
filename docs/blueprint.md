# **App Name**: ListingFlow

## Core Features:

- Product Data Management: Allows users to manage product data including name, code, quantity, price, descriptions, images, and supplier information through a spreadsheet UI.
- Location Organization: Organize products by physical location via UI.
- E-commerce Integration: Create product listings optimized for various e-commerce platforms, complete with tags and categorized publication status.
- AI-Powered Product Description Generation: Utilizes generative AI to suggest engaging product descriptions from a CSV. The tool uses listing status to suggest appropriate fields, tags and keywords, optimized for e-commerce SEO.
- Listing Management UI: UI for creating and managing listings to supported platforms, with ability to push generated content and keep track of listing progress.
- Local Data Storage: The product descriptions, platform status, location, etc are stored in a local file that can be backed up or transferred to another computer. All of the features use data that exists only within that local data file, but does not expose the data to the Internet.
- eBay File Exchange Automation: Automate listing creation on eBay using File Exchange (CSV upload) for business accounts.
- 3rd-Party Tool Integration: Offer integration with 3rd-party tools like Codisto, InkFrog, Linnworks for bulk uploading listings.
- eBay API Scripting: Provide a Python script for direct posting of products via eBay API based on Excel data. This is a tool to help automate listings.
- Assisted Manual Listing: Facilitate manual listing with an Excel macro/script that generates titles, HTML descriptions, prices, and image links for easy copy-pasting into eBay.
- Listing Presets: Users can save Listing Presets per platform/category. Ex: Set Condition to Used; Delivery time to 2-3 days; eBay Category to 20653, for the category "Appliances"
- Media Folder Link Generator: Maps the product code to a product picture. Generates the complete URL from Nextcloud link or Imgur. Scans the folder “/Pictures/Products”.
- CSV Validator: Adds a validator (ex: line 17 has error, missing code, invalid image etc).
- HTML Previewer: Live preview for how the title will look, and how the HTML description will look (including the images).
- Shareable Export: Even if the app is local it can Export to ZIP: table + pictures + CSV list + HTML preview.
- Auto-tagging AI: Based on the generated description, the product can be suggested: tags (for SEO), keywords, category. Can be done simply with a small local model or prompt GPT in backend. (Pot contribui cu prompt engineering aici.)
- Batch Mode UI: A quick way to select 5–10 products and: apply the same preset, generate description to all, mark as "ready to export". Asta crește productivitatea enorm în listing workflow.
- Exports personalizate per platformă: Today you have File Exchange, tomorrow you have Shopify → each platform has another CSV.   Proposal: you create a structure: exports/  ebay_template.csv  shopify_template.csv  etsy_template.csv  And the application uses a universal converter with a field map.

## Style Guidelines:

- Primary color: Muted blue (#79A3B1) to evoke a sense of trust and reliability.
- Background color: Light gray (#F0F4F8) to provide a clean and professional backdrop.
- Accent color: Soft peach (#E0AFA0) for a touch of warmth and approachability.
- Body and headline font: 'Inter' sans-serif for a modern, machined, objective look.
- Use a set of clean and simple icons that visually represent the product's functionality. Line icons are preferrable.
- Employ a grid-based layout for structured organization, ensuring information is easily accessible.
- Implement subtle animations for user interactions. A sliding panel or a fade-in effect can provide visual feedback and improve user experience.