# Flux E-Commerce Platform

This is a two-part project for an e-commerce platform, consisting of:
1. **Admin Portal**: A back-office application to manage products, orders, and categories.
2. **Main Website**: The storefront where customers can browse and purchase products.

## Project Structure

### Admin Portal (Port 3000)

The Admin Portal is designed to manage products, categories, and orders. Admin users can:
- Add, edit, and delete products
- Manage product categories
- View and manage orders

### Main Website (Port 3001)

The Main Website is a customer-facing platform where users can:
- Browse products by category
- View product details
- Add products to cart
- Proceed with checkout

## Tech Stack

### Backend
- **Node.js** with **Express** for handling API requests
- **MongoDB** for the database, storing products, categories, and orders
- **Mongoose** for object modeling
- **Redis** for caching frequently accessed data (optional, but helps improve performance)
  
### Frontend
- **Next.js** for both the Admin Portal and Main Website
- **React** components and hooks
- **Axios** for handling HTTP requests to the backend

### Other Tools
- **Docker** for containerizing the services
- **S3** for storing product images

## Setup Instructions

### Prerequisites
- Node.js and npm installed
- Docker installed for containerization
- MongoDB connection URI (either a local MongoDB instance or a cloud-based one like MongoDB Atlas)
- AWS S3 bucket for product images

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/ecommerce-platform.git
   cd ecommerce-platform
   ```

2. Set up environment variables by creating `.env` files for both the **Admin Portal** and **Main Website**:

   **For Admin Portal:**
   ```bash
   touch .env
   ```

   Add the following variables to `.env`:
   ```
   MONGODB_URI=your_mongodb_uri
   REDIS_URL=your_redis_url 
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   S3_BUCKET_NAME=your_s3_bucket_name
   ```

   **For Main Website:**
   ```bash
   touch .env
   ```

   Add the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   REDIS_URL=your_redis_url (optional)
   ```

3. Install dependencies for both parts of the project:
   - For **Admin Portal** (run in the `admin` folder):
     ```bash
     cd admin
     npm install
     ```

   - For **Main Website** (run in the `frontend` folder):
     ```bash
     cd frontend
     npm install
     ```

### Running the Application

You can run the application with **Docker** or **locally**.

#### Running with Docker

1. Build and run the containers using Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. Access the applications:
   - **Admin Portal**: http://localhost:3000
   - **Main Website**: http://localhost:3001

#### Running Locally

1. **Admin Portal**:
   ```bash
   cd admin
   npm run dev
   ```

   Access the Admin Portal at http://localhost:3000.

2. **Main Website**:
   ```bash
   cd frontend
   npm run dev
   ```

   Access the Main Website at http://localhost:3001.

## API Endpoints

### Products API

- **GET** `/api/products` – Get a list of all products
- **POST** `/api/products` – Create a new product
- **PUT** `/api/products/:id` – Update a product by ID
- **DELETE** `/api/products/:id` – Delete a product by ID

### Categories API

- **GET** `/api/categories` – Get a list of all categories
- **POST** `/api/categories` – Create a new category
- **PUT** `/api/categories/:id` – Update a category by ID
- **DELETE** `/api/categories/:id` – Delete a category by ID

### Orders API (Admin Only)

- **GET** `/api/orders` – Get a list of all orders

## Notes
- The **Admin Portal** is restricted to authenticated users with admin privileges.
- Product images are stored on **AWS S3**.
- Redis caching is available as an optional performance optimization.

```

This `README.md` covers the setup, running the project, and includes API endpoints without mentioning Elasticsearch. You can adapt the content based on any additional details you might want to include.
