
import React, { useState } from 'react';
import { Database, Copy, CheckCircle, Code, Server, Table, AlertTriangle } from 'lucide-react';

const DatabaseSchema: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlSchema = `-- ======================================================
-- JIFFYKART MASTER DATABASE SCHEMA
-- Generated for PostgreSQL / MySQL
-- ======================================================

-- 1. CORE INFRASTRUCTURE & AUTH
CREATE TABLE admin_users (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_type ENUM('Super Admin', 'Manager', 'Editor', 'Support Agent') NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE franchises (
    id VARCHAR(50) PRIMARY KEY,
    owner_name VARCHAR(100) NOT NULL,
    business_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    status ENUM('Active', 'On Hold', 'Disabled') DEFAULT 'Active',
    kyc_status ENUM('Verified', 'Pending', 'Rejected') DEFAULT 'Pending',
    joined_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE franchise_territories (
    id SERIAL PRIMARY KEY,
    franchise_id VARCHAR(50) REFERENCES franchises(id),
    pincode VARCHAR(10) NOT NULL,
    city VARCHAR(50),
    UNIQUE(franchise_id, pincode)
);

-- 2. VENDOR ECOSYSTEM
CREATE TABLE vendors (
    id VARCHAR(50) PRIMARY KEY,
    franchise_id VARCHAR(50) REFERENCES franchises(id),
    shop_name VARCHAR(100) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    business_type VARCHAR(50),
    address TEXT,
    pincode VARCHAR(10),
    kyc_status ENUM('Verified', 'Pending', 'Rejected') DEFAULT 'Pending',
    account_status ENUM('Active', 'Inactive', 'Blocked') DEFAULT 'Active',
    rating DECIMAL(3,2) DEFAULT 0.0,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    bank_details JSONB, -- Stores bank_name, acc_no, ifsc
    joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATALOG MANAGEMENT
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    parent_id INT REFERENCES categories(id),
    slug VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active'
);

CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(50) REFERENCES vendors(id),
    category_id INT REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    mrp DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    unit_type VARCHAR(20) DEFAULT 'piece',
    image_url TEXT,
    status ENUM('Live', 'Draft', 'Pending', 'Rejected') DEFAULT 'Draft',
    is_featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. COMMERCE & ORDERS
CREATE TABLE customers (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    default_pincode VARCHAR(10),
    status ENUM('Active', 'Blocked') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customers(id),
    vendor_id VARCHAR(50) REFERENCES vendors(id),
    franchise_id VARCHAR(50) REFERENCES franchises(id),
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2),
    delivery_fee DECIMAL(10,2),
    payment_mode ENUM('COD', 'UPI', 'Card', 'Wallet') NOT NULL,
    payment_status ENUM('Paid', 'Unpaid', 'Refunded') DEFAULT 'Unpaid',
    order_status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned') DEFAULT 'Pending',
    delivery_pincode VARCHAR(10),
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id),
    product_id VARCHAR(50) REFERENCES products(id),
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10,2) NOT NULL,
    variant_details VARCHAR(255)
);

-- 5. LOGISTICS
CREATE TABLE delivery_partners (
    id VARCHAR(50) PRIMARY KEY,
    franchise_id VARCHAR(50) REFERENCES franchises(id),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    pincode VARCHAR(10),
    current_status ENUM('Available', 'Busy', 'Offline') DEFAULT 'Offline',
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    rating DECIMAL(3,2) DEFAULT 5.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. SUPPORT & CRM
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_no VARCHAR(20) UNIQUE NOT NULL,
    requester_id VARCHAR(50) NOT NULL, -- Generic ID (Customer/Vendor)
    source ENUM('Customer', 'Vendor') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_vendors_pincode ON vendors(pincode);
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Database className="text-indigo-600" /> Database Schema (SQL)
          </h2>
          <p className="text-sm text-gray-500 mt-1">Recommended relational structure for the JiffyKart production environment.</p>
        </div>
        <button 
          onClick={handleCopy}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${
            copied ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
          {copied ? 'Copied to Clipboard' : 'Copy SQL Schema'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg text-indigo-600 shadow-sm"><Table size={20}/></div>
            <div>
               <div className="text-xs font-bold text-indigo-400 uppercase">Total Tables</div>
               <div className="text-lg font-bold text-indigo-900">11 Objects</div>
            </div>
         </div>
         <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg text-emerald-600 shadow-sm"><Server size={20}/></div>
            <div>
               <div className="text-xs font-bold text-emerald-400 uppercase">Engine</div>
               <div className="text-lg font-bold text-emerald-900">PostgreSQL / MySQL</div>
            </div>
         </div>
         <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg text-orange-600 shadow-sm"><Code size={20}/></div>
            <div>
               <div className="text-xs font-bold text-orange-400 uppercase">Format</div>
               <div className="text-lg font-bold text-orange-900">SQL DDL Standard</div>
            </div>
         </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
           <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
           </div>
           <span className="text-[10px] font-mono text-gray-400 ml-2 uppercase tracking-widest">jiffykart_schema.sql</span>
        </div>
        <div className="p-6 overflow-x-auto">
          <pre className="font-mono text-sm leading-relaxed text-indigo-300 selection:bg-indigo-500 selection:text-white">
            {sqlSchema}
          </pre>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
         <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" /> Implementation Notes
         </h3>
         <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
            <li><strong>JSONB Support:</strong> For bank details and configurations, PostgreSQL <code className="bg-gray-100 px-1 rounded font-mono">JSONB</code> is recommended for flexibility.</li>
            <li><strong>Soft Deletes:</strong> Consider adding <code className="bg-gray-100 px-1 rounded font-mono">deleted_at</code> columns if your business logic requires data recovery.</li>
            <li><strong>Scaling:</strong> Use UUIDs instead of SERIAL IDs if you plan to move to a distributed system in the future.</li>
            <li><strong>Relational mapping:</strong> The <code className="bg-gray-100 px-1 rounded font-mono">franchise_id</code> in the <code className="bg-gray-100 px-1 rounded font-mono">vendors</code> table enables the "Field Manager" territory filtering seen in the dashboard.</li>
         </ul>
      </div>
    </div>
  );
};

export default DatabaseSchema;
