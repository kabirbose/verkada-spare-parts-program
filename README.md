# Spare Parts Program

An internal web application for managing, browsing, and requesting spare parts for devices. Built with Next.js, MongoDB, and Tailwind CSS.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Features](#features)
  - [Storefront — Devices View](#storefront--devices-view)
  - [Storefront — Spare Parts View](#storefront--spare-parts-view)
  - [Device Detail Page](#device-detail-page)
  - [Cart](#cart)
  - [Orders](#orders)
  - [Admin Dashboard](#admin-dashboard)
    - [Add Part](#add-part)
    - [Add Device](#add-device)
    - [Edit a Part](#edit-a-part)
    - [Edit a Device](#edit-a-device)
    - [Export Catalog](#export-catalog)
    - [Bulk CSV Import / Update](#bulk-csv-import--update)
  - [Selection Mode & Bulk Actions](#selection-mode--bulk-actions)
  - [Image Handling](#image-handling)
- [Data Models](#data-models)
- [API Reference](#api-reference)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | MongoDB via Mongoose 9 |
| Styling | Tailwind CSS 4 |
| CSV parsing | PapaParse 5 |
| Font | Geist (via `next/font`) |

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- A **MongoDB** instance — either a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster or a locally running instance

---

## Development Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd spare-parts-web-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local   # if an example file exists
# or create it manually:
touch .env.local
```

Open `.env.local` and add your MongoDB connection string (see [Environment Variables](#environment-variables) below).

### 4. Start the development server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Other scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot-reload |
| `npm run build` | Create an optimised production build |
| `npm run start` | Run the production build locally |
| `npm run lint` | Run ESLint across the codebase |

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Required — MongoDB connection string
# Atlas example:  mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
# Local example:  mongodb://localhost:27017/spare-parts
MONGODB_URI=mongodb+srv://...
```

> **Note:** Never commit `.env.local` to version control. It is already listed in `.gitignore`.

---

## Project Structure

```
spare-parts-web-app/
├── app/
│   ├── layout.tsx               # Root HTML layout, global font
│   ├── page.tsx                 # Home / storefront (server component)
│   ├── cart/
│   │   └── page.tsx             # Cart + request submission form
│   ├── orders/
│   │   └── page.tsx             # Order history viewer
│   ├── product/[model]/
│   │   └── page.tsx             # Device detail + spare parts table
│   ├── admin/
│   │   ├── page.tsx             # Admin dashboard (add parts & devices)
│   │   ├── edit-part/[id]/
│   │   │   └── page.tsx         # Edit an individual spare part
│   │   └── edit-product/[id]/
│   │       └── page.tsx         # Edit an individual device
│   └── api/
│       ├── parts/               # GET (list) · POST (create)
│       │   └── [id]/            # GET · PUT · DELETE
│       ├── products/            # GET (list) · POST (create)
│       │   └── [id]/            # GET · PUT · DELETE
│       ├── cart/                # GET · POST · DELETE (clear)
│       │   └── [productId]/     # PUT (quantity) · DELETE (remove item)
│       ├── submissions/         # GET (all orders) · POST (submit)
│       └── upload/              # POST (file upload, reserved for future use)
├── components/
│   ├── ProductsGrid.tsx         # Main storefront grid (devices + parts)
│   ├── ProductDetail.tsx        # Spare parts table for a specific device
│   ├── CsvImport.tsx            # Collapsible CSV bulk-import panel
│   └── ui/
│       ├── CardActionButtons.tsx
│       ├── FormActions.tsx
│       ├── FormField.tsx
│       ├── ImageUploadField.tsx
│       ├── StatusBadge.tsx
│       └── StatusMessage.tsx
├── models/
│   ├── Product.ts               # Mongoose schema for devices
│   └── SparePart.ts             # Mongoose schema for spare parts
├── lib/
│   └── mongodb.ts               # Cached MongoDB connection
└── public/
    └── uploads/                 # Directory for any server-saved uploads
```

---

## Features

### Storefront — Devices View

**URL:** `/`

The home page opens in **Devices** view by default. All devices are displayed as cards, grouped by their category (e.g. "Indoor Dome Camera").

- **Search** — Type in the search bar to filter devices by name or category in real time.
- **Click a card** — Navigates to that device's detail page, which lists all compatible spare parts.
- **Hover a card** — Reveals **Edit** and **Delete** icon buttons in the top-right corner of the card.
- **Edit** — Navigates to `/admin/edit-product/[id]`.
- **Delete** — Prompts for confirmation and permanently removes the device.
- **Placeholder image** — If a device has no image, a camera icon placeholder is shown.

---

### Storefront — Spare Parts View

**URL:** `/` → click **Spare Parts** toggle

Switch to the spare parts view using the **Devices / Spare Parts** toggle in the top-right of the header.

- **Search** — Filters parts by name or notes content.
- **Part cards** show: Part Name, Type, Compatible Devices, Location, In Stock status, ETA (if applicable), and Notes.
- **Image** — If a part has an associated image, it is displayed at the top of the card (same layout as device cards).
- **Gear icon** — Shown on part cards that have no image.
- **Hover a card** — Reveals **Edit Spare Part** and **Delete Spare Part** buttons.
- **+ Add to Cart** — Adds the part to the cart (quantity 1). The cart badge in the header updates immediately. Clicking again increments the quantity.

---

### Device Detail Page

**URL:** `/product/[device-id]`

Clicking any device card opens this page, which shows a table of all spare parts compatible with that device.

- **Device header** — Shows the device image (or a camera placeholder), name, and category.
- **Search** — Filters the parts table by part name or type.
- **Parts table columns:** Spare Part · Type · Location · In Stock · ETA · Notes · Add to Cart button.
- **Location / In Stock** — Displayed as colour-coded badges (green/red/yellow for stock; blue/purple/grey for location).
- **Notes** — Truncated with an ellipsis; the full text is visible on hover (`title` tooltip).
- **Image tooltip** — If a spare part has an associated image, hovering over its row shows a floating preview thumbnail that follows the cursor.
- **+ Add to Cart** — Adds the part to the shared cart.

---

### Cart

**URL:** `/cart`

The cart is shared and persisted in MongoDB (there is a single global cart).

- **Item list** — Shows each added part with its quantity.
- **Quantity controls** — Use the **−** / **+** buttons or type directly into the quantity field to adjust amounts. Setting a quantity to 0 removes the item.
- **Remove item** — Click the trash icon on any row.
- **Clear cart** — Removes all items at once (with confirmation).
- **Request form** — Fill in the required fields to submit a spare parts request:
  - Support Engineer Name
  - Case Number
  - Company Name
  - Attention To (recipient)
  - Customer Address
  - Customer Email / Phone
  - Shipping Method (Standard or Expedited)
  - Notes (optional)
- **Submit Request** — Saves the order to the database, clears the cart, and shows a confirmation screen with links to go back to the storefront or view orders.

---

### Orders

**URL:** `/orders`  
Also accessible via **View Orders** in the Admin Dashboard.

Displays all submitted spare parts requests, newest first.

- **Summary row** — Each order shows: Case Number, shipping badge (Standard / Expedited), parts count, company name, engineer name, and submission timestamp. Click a row to expand it.
- **Expanded detail** — Shows all submitted fields plus a table of the parts and quantities requested.
- **Search** — Filter orders by case number, company name, engineer name, or recipient.
- **Shipping filter** — Toggle between All / Standard / Expedited.
- **Sort** — Switch between Newest first and Oldest first.

---

### Admin Dashboard

**URL:** `/admin`

The central management area. Contains two tabs — **Add Part** and **Add Device** — plus catalog export tools and a bulk CSV import panel below each form.

---

#### Add Part

Fill in the form to add a new spare part to the catalog:

| Field | Required | Notes |
|---|---|---|
| Part ID | Yes | Unique numeric-style identifier, e.g. `267` |
| Part Name | Yes | Display name, e.g. `CD61 Bubble` |
| Compatible Devices | Yes | Comma-separated list. **Must exactly match existing device names**, e.g. `CD61, CD62` |
| Part Type | Yes | Category, e.g. `Bubble`, `Mount` |
| Location / Available At | No | Storage location, e.g. `Warehouse Aisle 4` |
| Stock Status | No | Free-text, e.g. `Yes`, `No`, `5 Left` |
| ETA | No | Expected restock date, e.g. `5/23/2026` |
| Notes | No | Free-form instructions or comments |
| Image | No | See [Image Handling](#image-handling) |

Click **Create Part** to save. A success or error banner appears inline.

---

#### Add Device

Fill in the form to add a new device to the catalog:

| Field | Required | Notes |
|---|---|---|
| Device ID | Yes | URL-safe slug, lowercase, no spaces, e.g. `cd63`. Used in the device detail URL. |
| Device Name | Yes | Display name, e.g. `CD63` |
| Device Category | Yes | Group label shown in the storefront, e.g. `Indoor Dome Camera` |
| Image | No | See [Image Handling](#image-handling) |

Click **Create Device** to save.

---

#### Edit a Part

**URL:** `/admin/edit-part/[id]`

Accessible by hovering over a part card on the storefront and clicking the **edit (pencil) icon**, or by navigating directly.

- All fields from the Create Part form are editable, except the Part ID (locked after creation).
- The current image is shown as a preview. You can change it or remove it.
- **Save Changes** — Updates the part in the database and returns to the storefront.
- **Cancel** — Returns to the storefront without saving.
- **Delete** — Permanently removes the part (with confirmation).

---

#### Edit a Device

**URL:** `/admin/edit-product/[id]`

Accessible by hovering over a device card on the storefront and clicking the **edit icon**.

- Device Name, Category, and Image are editable. The Device ID is locked.
- Same Save / Cancel / Delete actions as the edit part form.

---

#### Export Catalog

Located at the top of the Admin Dashboard.

- **Export All Parts** — Downloads a `parts-export.csv` file containing every spare part in the database.
- **Export All Devices** — Downloads a `devices-export.csv` file containing every device.

CSV columns for **parts**: Part ID · Part Name · Compatible Devices · Part Type · Location · Stock Status · ETA · Notes

CSV columns for **devices**: Device ID · Device Name · Device Category · Image URL

---

#### Bulk CSV Import / Update

A collapsible panel below each create form, labelled **Bulk Import via CSV**.

**Two modes:**

| Mode | Behaviour |
|---|---|
| **Create New** | Creates records from every valid row. Rows with an ID that already exists will fail and be reported. |
| **Update Existing** | Matches rows by ID. Only non-empty fields overwrite the existing values — blank cells are ignored. |

**How to use:**

1. Click **Download Template** to get a CSV file with the correct column headers and an example row.
2. Fill in your data and save the file.
3. Click the file drop zone (or click anywhere on it) to select your CSV.
4. A preview table appears showing all rows, colour-coded as **Valid** (green) or **Invalid** (red) with the reason displayed.
5. Invalid rows are automatically skipped during import — only valid rows are sent.
6. Click **Import N parts / devices** (or **Update N…**) to begin. A progress bar tracks each row as it is sent to the API.
7. A results summary shows how many succeeded and details any failures (with row number, ID, and reason).

---

### Selection Mode & Bulk Actions

Available on the storefront (both Devices and Spare Parts views).

**Activating selection mode:**

Click the **checkbox icon** button in the top-right of the storefront header. The button turns blue and all cards become selectable.

**Selecting items:**

- **Click** a card to toggle its selection (blue border + check circle).
- **Click and drag** across the grid to rubber-band select multiple cards at once.
- **Select all** — Click in the floating action bar at the bottom to select all currently visible (filtered) items.

**Bulk actions (appear in the floating bar once at least one item is selected):**

| Action | Description |
|---|---|
| **Export N** | Downloads a CSV of the selected items only |
| **Delete N** | Permanently deletes all selected items (with confirmation). Successfully deleted items are removed from the grid instantly. |

**Exiting selection mode:**

Click the **× (Cancel)** button in the floating action bar, or click the selection toggle button again.

---

### Image Handling

Images can be added to both **devices** and **spare parts** through the **Image** field on any create or edit form.

**Two input methods:**

| Tab | How it works |
|---|---|
| **URL** | Paste any publicly accessible image URL. The image is stored as-is in the database. |
| **Upload File** | Select a local image file (JPG, PNG, WebP, GIF, etc.). The file is converted to a **base64 data URL** entirely in the browser and stored directly in MongoDB. Maximum file size: **3 MB**. |

A live **preview** (96×96 px) appears below the field as soon as an image is selected or a valid URL is entered. Click **Remove image** to clear it.

**Where images appear:**

- **Device cards** on the storefront — full-width 16:9 image at the top of the card. Falls back to a camera icon placeholder if no image is set or the URL fails to load.
- **Device detail page** header — 96×96 px thumbnail next to the device name. Same fallback behaviour.
- **Spare part cards** on the storefront — full-width 16:9 image at the top of the card (same as devices). Parts without an image show a gear icon instead.
- **Spare parts table** (device detail page) — hovering over any row whose part has an image shows a floating 192×144 px tooltip that follows the cursor.

---

## Data Models

### Product (Device)

```
_id          String   (required) — URL slug, e.g. "cd63"
name         String   (required) — Display name, e.g. "CD63"
description  String   (required) — Category, e.g. "Indoor Dome Camera"
imageUrl     String              — External URL or base64 data URL
```

### SparePart

```
_id               String   (required) — Numeric-style ID, e.g. "267"
sparePart         String   (required) — Display name, e.g. "CD61 Bubble"
compatibleProduct String[] — Device names this part fits, e.g. ["CD61", "CD62"]
type              String   — Part category, e.g. "Bubble"
availableAt       String   — Storage location, e.g. "Warehouse Aisle 4"
inStockStatus     String   — Availability, e.g. "Yes", "No", "5 Left"
eta               String   — Expected restock date, e.g. "5/23/2026"
notes             String   — Free-form instructions
imageUrl          String   — External URL or base64 data URL
```

### Cart

There is a single shared cart stored with a fixed `_id` of `"main"`.

```
_id    String  — Always "main"
items  Array
  partId    String
  partName  String
  quantity  Number
```

### Submission (Order)

```
_id                  ObjectId  — Auto-generated
supportEngineerName  String    (required)
caseNumber           String    (required)
companyName          String    (required)
customerAddress      String    (required)
attentionTo          String    (required)
shippingMethod       String    (required) — "standard" | "expedited"
contactInfo          String    (required) — Email or phone
notes                String
items                Array
  partId    String
  partName  String
  quantity  Number
createdAt            Date      — Auto-set by Mongoose timestamps
```

---

## API Reference

All endpoints are under `/api/`. Request and response bodies are JSON unless otherwise noted.

### Parts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/parts` | Return all spare parts |
| `POST` | `/api/parts` | Create a new spare part |
| `GET` | `/api/parts/[id]` | Fetch a single part |
| `PUT` | `/api/parts/[id]` | Update a part |
| `DELETE` | `/api/parts/[id]` | Delete a part |

### Products (Devices)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Return all devices |
| `POST` | `/api/products` | Create a new device |
| `GET` | `/api/products/[id]` | Fetch a single device |
| `PUT` | `/api/products/[id]` | Update a device |
| `DELETE` | `/api/products/[id]` | Delete a device |

### Cart

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cart` | Return the current cart |
| `POST` | `/api/cart` | Add a part (or increment quantity if already in cart) |
| `DELETE` | `/api/cart` | Clear the entire cart |
| `PUT` | `/api/cart/[partId]` | Set the quantity of a specific item |
| `DELETE` | `/api/cart/[partId]` | Remove a specific item from the cart |

### Submissions (Orders)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/submissions` | Return all submitted orders, newest first |
| `POST` | `/api/submissions` | Submit a new order and clear the cart |

### Upload

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Accept a multipart file upload and save to `/public/uploads/`. Reserved for future use — the UI currently handles images client-side via `FileReader`. |
