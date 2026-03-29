# WhatsApp Grocery Ordering System

A full-stack grocery ordering system via WhatsApp with voice ordering and UPI payment integration.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **WhatsApp API:** Twilio WhatsApp Sandbox
- **Speech-to-Text:** OpenAI Whisper API
- **Payment:** UPI deep links + QR code generation
- **Admin Dashboard:** React (Vite) + Tailwind CSS
- **Deployment:** Render (free tier)

## Features

### WhatsApp Bot
- Send "Hi" to see the main menu
- Browse product categories (fruits, vegetables, dairy, etc.)
- Add/remove items via chat: `add 2 milk`, `remove bread`
- View cart, checkout, and place orders
- UPI payment link + QR code generation
- Payment confirmation via chat: `paid ORD-123`

### Voice Ordering
- Send audio messages with your order
- Whisper API transcribes speech to text
- NLP parsing extracts items and quantities
- Items added to cart automatically

### Admin Dashboard
- JWT-based login system
- Dashboard with order/revenue statistics
- Manage orders (update status: Pending, Packed, Delivered)
- Manage products (add, edit, delete)
- View users and payment status

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas free tier)

### Setup

```bash
# Clone the repo
git clone https://github.com/thekaushaldewangan-bit/whatsapp-grocery-system.git
cd whatsapp-grocery-system

# Install dependencies
npm install
cd admin-dashboard && npm install && cd ..

# Copy environment file
cp .env.example .env
# Edit .env with your values (JWT_SECRET is required)

# Seed the database
npm run seed

# Start development server
npm run dev

# In another terminal, start the admin dashboard
cd admin-dashboard && npm run dev
```

### Default Admin Credentials (after seeding)
- Email: `admin@grocery.com`
- Password: `Admin@123`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/webhook/whatsapp` | Twilio webhook |
| GET | `/api/products` | List products |
| GET | `/api/products/categories/all` | List categories |
| POST | `/api/cart` | Add to cart |
| GET | `/api/orders` | List orders (auth) |
| POST | `/api/orders` | Create order |
| PATCH | `/api/orders/:id/status` | Update order status |
| POST | `/api/auth/login` | Admin login |
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/orders` | Admin orders list |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | JWT signing secret |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `DEMO_MODE` | No | Set `true` to run without Twilio/OpenAI |
| `TWILIO_ACCOUNT_SID` | When live | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | When live | Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | When live | Twilio WhatsApp number |
| `OPENAI_API_KEY` | When live | OpenAI API key for Whisper |
| `UPI_ID` | No | UPI payment ID |
| `ADMIN_SECRET_KEY` | No | Required for admin registration |

## Deployment on Render

1. Push to GitHub
2. Create a MongoDB Atlas free cluster
3. On Render, create a Web Service from the GitHub repo
4. Set Build Command: `npm run build`
5. Set Start Command: `npm start`
6. Add environment variables (MONGODB_URI, JWT_SECRET, NODE_ENV=production)
7. The admin dashboard is served from the same service at the root URL

## Sample WhatsApp Test Messages

```
Hi                          → Shows main menu
categories                  → Shows product categories
fruits                      → Shows fruit products
add 2 milk                  → Adds 2 milk to cart
add 1 apple                 → Adds 1 apple to cart
show cart                   → Shows cart summary
remove milk                 → Removes milk from cart
checkout                    → Starts checkout flow
John, 123 Main St, 9876543210  → Places order
paid ORD-123-abc            → Confirms payment
```

## License

ISC
