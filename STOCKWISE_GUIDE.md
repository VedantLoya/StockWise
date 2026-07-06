# StockWise: Smart Inventory Management System
## Complete System Architecture, Architectural Decisions, and Interview Reference Handbook

This handbook serves as the definitive reference guide for **StockWise**, a production-ready, highly optimized MERN stack inventory management platform designed for small-to-medium businesses.

---

## 🗂️ Table of Contents
1. **Project Vision & Business Requirements**
2. **Architectural Decisions & Technology Stack Analysis**
3. **Database Schema Design & Data Integrity Rules**
4. **Backend API Architecture & Middleware Security**
5. **Frontend Application Design & Component Hierarchy**
6. **Advanced Implementation Features (Search, Filters, Pagination)**
7. **Deployment Strategy (Render, Vercel, MongoDB Atlas)**
8. **50 Project-Specific Technical Interview Questions & Comprehensive Answers**
9. **Behavioral/HR Questions & Star-Method Answer Frameworks**

---

## 1. Project Vision & Business Requirements

StockWise is created to solve a real-world operations problem faced by small warehouse owners and boutique retailers: **loss of inventory visibility leading to stockouts or capital tied up in excess stock**. 

### Core Product Capabilities
- **Stateless Authentication**: Users sign up, log in, and log out securely. Sessions persist across browser reloads using cryptographically signed JSON Web Tokens (JWT) stored in the browser's local storage.
- **Product Inventory Management**: Real-time CRUD (Create, Read, Update, Delete) capability on individual inventory items.
- **Automated Low Stock Warnings**: Instant visual flags (`⚠ Low Stock`) appear when the available quantity falls below the developer-configured minimum stock threshold.
- **Multi-criteria Query Engine**: Users can search by product name, SKU code, category, or supplier, with options to filter by category or low stock alerts, sorting by multiple criteria, and server-side pagination to limit page load payloads.
- **Dashboard Metrics**: Aggregated analytical panels displaying total cataloged products, total unique categories, items needing restocking, and cumulative inventory valuation.

---

## 2. Architectural Decisions & Technology Stack Analysis

Our architecture avoids over-engineering while adhering to industry-standard patterns. Below is an evaluation of why we chose our tech stack:

```
                  +---------------------------------------+
                  |         Vercel (Client CDN)           |
                  |     Vite + React SPA (Tailwind CSS)   |
                  +-------------------+-------------------+
                                      |
                             HTTPS REST API (JWT)
                                      |
                  +-------------------+-------------------+
                  |         Render (Node.js Host)         |
                  |          Express API Server           |
                  +-------------------+-------------------+
                                      |
                                  TCP / IP
                                      |
                  +-------------------+-------------------+
                  |        MongoDB Atlas (Cloud DB)       |
                  |         NoSQL Document Store          |
                  +---------------------------------------+
```

### Decoupled Single-Page App (SPA) vs. Monolithic SSR
- **Decision**: Decoupled React Frontend (served via Vercel) and Express REST API Backend (served via Render).
- **Rationale**: Separating the view layer from the data API enables high horizontal scaling. The client code is served as static HTML/JS/CSS assets via a Global CDN, reducing server workload. The API server only processes JSON data payloads, keeping resource consumption low.

### The MERN Stack Composition

| Technology | Role | Justification |
| :--- | :--- | :--- |
| **React (Vite)** | Client UI | Component-driven architecture allows building reusable interface elements. Vite provides high-speed module compilation and HMR during development compared to legacy tools. |
| **Node.js & Express** | Server Runtime | Single-threaded event loop utilizing asynchronous I/O allows Express to handle concurrent API requests efficiently with minimal memory usage. |
| **MongoDB & Mongoose** | Database Layer | Inventory schemas are highly prone to additions (e.g., adding warehouse locations, dimensions). MongoDB's schemaless JSON document layout easily accommodates these iterations. Mongoose acts as a schema validation layer. |
| **Tailwind CSS** | Design Utility | A utility-first CSS engine compiling a single static stylesheet. The final build footprint for CSS is minimal (~15KB) because only classes used in the project code are compiled. |
| **JWT** | Session Auth | Eliminates server-side session tracking databases, making the API stateless. JWT structures can be verified instantly by decryption algorithms on any backend instance using the shared secret. |

---

## 3. Database Schema Design & Data Integrity Rules

StockWise enforces data integrity at the database layer using Mongoose validator configurations to prevent corrupted data from reaching our records.

```
       +-------------------------+             +-------------------------+
       |         USER            |             |        PRODUCT          |
       +-------------------------+             +-------------------------+
       | _id (ObjectId)      PK  |<-----------+| createdBy (ObjectId) FK |
       | name (String)           |             | productName (String)    |
       | email (String)   Unique |             | sku (String)     Unique |
       | password (String)       |             | category (String)       |
       | createdAt (Date)        |             | supplier (String)       |
       | updatedAt (Date)        |             | quantity (Number)       |
       +-------------------------+             | minimumStock (Number)   |
                                               | unitPrice (Number)      |
                                               | description (String)    |
                                               | createdAt (Date)        |
                                               | updatedAt (Date)        |
                                               +-------------------------+
```

### The User Collection Schema (`models/User.js`)
- **Email Normalization**: Enforces `lowercase: true` and `trim: true` to prevent authentication conflicts from case mismatches. Unique indexes prevent duplicate registrations.
- **Password Obfuscation**: The field config uses `select: false`. This is a vital security defense preventing Mongoose from returning the password hash during user queries unless explicitly overridden.
- **Pre-save Hook**: Uses `userSchema.pre("save")` to hash passwords with `bcryptjs` using a salt work factor of 10 prior to DB write. The code checks `this.isModified("password")` to bypass re-hashing when updating fields like names.

### The Product Collection Schema (`models/Product.js`)
- **Unique SKU Enforcement**: SKU values are automatically converted to uppercase and checked against a unique database index to guarantee catalog clarity.
- **Non-negative Constraints**: Quantity, Minimum Stock, and Unit Price use the `min: [0, ...]` validator. This ensures prices and counts can never hold invalid negative values.
- **Computed Virtual Property (`isLowStock`)**: 
  Instead of dedicating a field in the DB to store a low stock flag (which requires updates every time quantity changes), we use a Mongoose virtual property:
  ```javascript
  productSchema.virtual("isLowStock").get(function () {
    return this.quantity <= this.minimumStock;
  });
  ```
  This dynamically computes the state on read and serializes into output via the schema setting `toJSON: { virtuals: true }`.

---

## 4. Backend API Architecture & Middleware Security

The Express API is structured defensively to isolate features and control access.

```
Request ---> Index.js ---> Route Router ---> Protect Middleware ---> Controller Actions ---> Mongoose Model ---> Database
```

### Auth Guard Middleware Flow
All `/api/products` routes are protected by `middleware/authMiddleware.js`.
1. The request enters the handler.
2. The middleware extracts the `Authorization` header and checks for a `Bearer <token>` pattern.
3. If missing, it returns a `401 Unauthorized` response, blocking route entry.
4. If found, it decodes the JWT using `jwt.verify(token, process.env.JWT_SECRET)`.
5. It extracts the `id` from the token payload, runs `User.findById(decoded.id).select("-password")`, and sets it on the Express request object as `req.user`.
6. It invokes `next()` to transition control to the product controllers.

---

## 5. Frontend Application Design & Component Hierarchy

The React client implements unidirectional data flow and separates state logic from display markup.

```
                                  [App.jsx]
                                      |
                              [AuthProvider]
                                      |
                     +----------------+----------------+
                     |                                 |
                 [Layout]                         [Public pages]
                     |                           (Login / Register)
             +-------+-------+
             |               |
         [Sidebar]      [Pages Pages]
                 (Dashboard / Products / LowStock)
```

### State Management via React Context
The `AuthProvider` inside `context/AuthContext.jsx` manages the global authentication state:
- Maintains the logged-in `user` payload, loading screens, and session tokens.
- Persists session credentials to browser `localStorage` on registration or login.
- Exposes `login`, `register`, and `logout` actions to children.
- On client start, it executes a background credentials validation request to `/api/auth/me` to refresh or invalidate the session.

### The Axios Service Layer
Instead of using `fetch()` directly in UI views, all communications routing is modularized:
- `services/api.js` constructs an Axios instance referencing `VITE_API_URL`.
- An **interceptors request pipeline** automatically fetches the JWT from localStorage and attaches it to the headers.
- An **interceptors response pipeline** intercepts incoming errors. If a `401` error is returned (indicating the session has expired), the interceptor clears local cache credentials, logs the user out, and redirects them to `/login`.

---

## 6. Advanced Implementation Features (Search, Filters, Pagination)

To manage database loads, the backend and frontend work in tandem to paginate and filter queries at the database query level rather than inside memory loops.

### The Search & Filter Aggregation Pipeline
In `controllers/productController.js`, queries are processed using parameters sent by the frontend:
1. **Owner Checking**: Always filters by `createdBy: req.user._id` to prevent data leakage across users.
2. **Regex Multi-field Search**: If a search string is provided, a regex pattern matches text across `productName`, `sku`, `category`, and `supplier`:
   ```javascript
   query.$or = [
     { productName: { $regex: search, $options: "i" } },
     { sku: { $regex: search, $options: "i" } },
     { category: { $regex: search, $options: "i" } },
     { supplier: { $regex: search, $options: "i" } },
   ];
   ```
3. **Low Stock Expression Query**: When filtering by low stock items, because `isLowStock` is a virtual field and not a database property, we cannot search for it directly. Instead, we use a MongoDB comparison expression query:
   ```javascript
   query.$expr = { $lte: ["$quantity", "$minimumStock"] };
   ```
4. **Parallel Pipeline Resolution**: Rather than sequentially executing the count and list query, they run in parallel using `Promise.all`:
   ```javascript
   const [products, total] = await Promise.all([
     Product.find(query).sort({ [sortBy]: order === "asc" ? 1 : -1 }).skip(skip).limit(limitNum),
     Product.countDocuments(query)
   ]);
   ```

---

## 7. Deployment Strategy (Render, Vercel, MongoDB Atlas)

We configure the build files to optimize deployment.

### Client-side SPA Router Routing Fix (`client/vercel.json`)
When deploying a React single-page app utilizing `react-router-dom`, requests to sub-routes (e.g., `/dashboard`) will trigger a Vercel 404 on page reload because the server checks the folder path for an index file. To prevent this, we declare rewrite directives pointing all paths back to the application entry:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 8. 50 Project-Specific Technical Interview Questions & Answers

These questions cover all critical aspects of the application stack.

### ⚛️ React & Client-Side Logic

#### 1. Why did you choose Vite over Create React App (CRA)?
* **Answer**: Vite is faster because it uses native ES Modules during development, parsing code on demand rather than pre-bundling the whole project with Webpack. Production builds are processed using Rolldown/Rollup, generating highly optimized asset outputs.

#### 2. What is a Single Page Application (SPA), and how did you configure it for deployment?
* **Answer**: An SPA loads a single HTML page and dynamically updates it as the user interacts with the app. For deployment, we added a `vercel.json` rewrite file directing all incoming request paths back to `index.html`, allowing React Router to handle page routing inside the browser.

#### 3. How did you structure your components to ensure reusability?
* **Answer**: We extracted global elements like `Sidebar.jsx`, `Layout.jsx` wrappers, `ProductModal.jsx` (which handles both adding and editing products depending on context), and confirmation alerts like `ConfirmDialog.jsx`.

#### 4. Why did you use React Context to manage authentication instead of Redux?
* **Answer**: Redux is designed for complex, multi-layered state updates. Authentication state—consisting of a user profile, a token, and loading flags—is relatively straightforward. React Context manages this state effectively without extra configuration or package overhead.

#### 5. How do you handle maintaining the user session after page refreshes?
* **Answer**: When the app starts, the `AuthProvider` initializes state by checking for a token in `localStorage`. If found, it makes a quick validation request to `/api/auth/me` to confirm session validity, clearing storage if it has expired.

#### 6. What are the benefits of using React Router's `<NavLink>` over `<Link>`?
* **Answer**: `<NavLink>` accepts an `isActive` callback, allowing us to dynamically apply highlight classes (such as `bg-blue-50 text-blue-700`) to indicate the active navigation menu item.

#### 7. How did you implement the protected routes logic in the client?
* **Answer**: We created a `ProtectedRoute.jsx` wrapper component. It checks the global `useAuth` hook. If the state is loading, it shows a spinner; if the user is authenticated, it renders the child pages; if not, it redirects the user to `/login`.

#### 8. What role does `useCallback` play in your `Products.jsx` component?
* **Answer**: We wrapped the `fetchProducts` data retrieval function in `useCallback` to cache the function instance. This prevents infinite loops inside the page `useEffect` block, which depends on that function.

#### 9. Why did you configure global CSS classes in `index.css` instead of writing individual utility classes?
* **Answer**: By adding custom components like `.btn-primary` and `.input-field` under `@layer components` in Tailwind, we maintained design consistency across different pages while avoiding repetitive class strings in our code.

#### 10. Explain how the Axios interceptors work in `services/api.js`.
* **Answer**: The request interceptor retrieves the stored JWT and appends it to the `Authorization` header of outgoing requests. The response interceptor checks for `401 Unauthorized` errors, automatically clearing credentials and redirecting to login on expiration.

#### 11. What is the difference between controlled and uncontrolled inputs, and which did you use?
* **Answer**: Controlled inputs bind their values to component state, rendering updates on change events. Uncontrolled inputs rely on DOM references. We used controlled inputs in all form components to validate data entries instantly.

#### 12. How does the dashboard page retrieve and display its calculations?
* **Answer**: It requests statistics from `/api/products/dashboard/stats` upon mount. The returned data contains computed calculations like inventory valuations, low stock alert arrays, and catalog lists, which are then stored in local page state.

#### 13. What does the `key` prop do in your map listings, and why is using index bad?
* **Answer**: The `key` prop helps React identify which items have changed, been added, or been removed. Using array indices can lead to UI rendering bugs and slow down rendering when items are reordered.

#### 14. What are React fragments (`<>...</>`), and why did you use them?
* **Answer**: Fragments allow grouping multiple sibling components without adding unnecessary node containers to the DOM tree, keeping the layout clean.

#### 15. How did you handle async network loading states in the UI?
* **Answer**: We managed a boolean `loading` state variable across pages. When an API call starts, `loading` is set to `true` (rendering a spinner). Once resolved, it is set to `false`, rendering the updated data grid.

#### 16. What is the difference between `useEffect` dependencies and leaving the dependency array empty?
* **Answer**: An empty dependency array tells React to run the effect callback only once when the component mounts. Specifying state variables in the array tells React to rerun the effect whenever those variables change.

---

### 🟢 Node.js & Express API Backend

#### 17. What is Node.js, and why is it suitable for built REST APIs?
* **Answer**: Node.js is an asynchronous, event-driven JavaScript runtime built on Chrome's V8 engine. Its non-blocking I/O model makes it highly efficient for handling concurrent REST API requests.

#### 18. What is Express.js, and what does `express.json()` middleware do?
* **Answer**: Express is a minimalist web framework for Node.js that simplifies routing and middleware configuration. The `express.json()` middleware parses incoming JSON request bodies, making them accessible via `req.body`.

#### 19. What is Cross-Origin Resource Sharing (CORS), and how did you resolve it?
* **Answer**: CORS is a browser security feature that blocks frontend applications from requesting APIs hosted on a different port or domain. We used the `cors` package in Express to specify that our frontend is permitted to make requests.

#### 20. How does the authentication middleware protect endpoints?
* **Answer**: It reads the incoming request's Authorization header, verifies the token signature against the server's JWT secret, and attaches the validated user payload to `req.user` before calling `next()`.

#### 21. What is the purpose of salting and hashing passwords?
* **Answer**: Salting adds random data to passwords before hashing them. This ensures that identical passwords yield different hashes, protecting users even if the database is exposed.

#### 22. Why did you use `bcryptjs` instead of the native `bcrypt` package?
* **Answer**: `bcryptjs` is written in pure JavaScript and does not require local C++ compilers during installation, preventing platform-specific build failures.

#### 23. What is JWT, and what are its three components?
* **Answer**: JSON Web Token is a compact method for securely transmitting information between parties as a JSON object. Its components are the Header (specifying algorithm), Payload (user claims), and Signature (secret verification signature).

#### 24. What are the benefits of stateless JWT auth compared to stateful session cookies?
* **Answer**: Stateless authentication eliminates the need to store sessions in memory, allowing backend APIs to scale horizontally across multiple servers without synchronization issues.

#### 25. How did you configure Express to handle requests for routes that do not exist?
* **Answer**: We added a fallback route handler at the end of the routing definitions in `index.js`. Any request that matches no other route returns a `404` status with a "Route not found" message.

#### 26. Why did you implement separation of concerns between controllers and routes?
* **Answer**: Separating these layers keeps routes clean, containing only path mappings, and leaves data operations and validation to the controllers, making the codebase easier to maintain.

#### 27. What is the purpose of the `process.exit(1)` call in your database configuration?
* **Answer**: If the server fails to connect to the database on startup, it cannot function properly. Exiting immediately notifies process managers that the service is unhealthy and needs to be restarted.

#### 28. How did you secure database passwords and secrets in your code?
* **Answer**: We stored them as environment variables in a `.env` file that is ignored by Git, preventing sensitive credentials from being committed to public repositories.

#### 29. How do you handle server-side errors to prevent client crashes?
* **Answer**: We wrap our controller logic in `try-catch` blocks. If an error occurs, it is logged to the server console, and the client receives a `500 Server Error` response instead of a connection timeout.

#### 30. How would you handle a memory leak in a Node.js process?
* **Answer**: I would use memory profiling tools like Chrome DevTools to analyze heap dumps, identify uncollected objects, and check for unresolved callbacks or global variable allocations.

---

### 🛢️ MongoDB & Mongoose ORM

#### 31. What is MongoDB, and when should you choose it over PostgreSQL?
* **Answer**: MongoDB is a NoSQL document database that stores data in JSON-like documents. It is a good choice for projects with evolving schemas or complex hierarchical structures that do not fit neatly into SQL tables.

#### 32. What is Mongoose, and how does it help in node development?
* **Answer**: Mongoose is an Object Data Modeling (ODM) library for MongoDB. It provides a structured schema validation layer, handles document relationships, and translates database records into JavaScript objects.

#### 33. Why did you declare the `password` field in the user schema with `select: false`?
* **Answer**: This prevents Mongoose from returning the password hash in standard queries by default, protecting user credentials from accidental exposure in the API response.

#### 34. What is a unique index in MongoDB, and how did you configure it?
* **Answer**: A unique index ensures that no two documents in a collection share the same index key. We set `unique: true` on the `sku` field in Mongoose, which rejects duplicate SKU entries.

#### 35. Explain what Mongoose virtual properties are and give an example.
* **Answer**: Virtuals are document attributes that can be read and written but are not persisted to MongoDB. We used the virtual `isLowStock` to calculate `quantity <= minimumStock` dynamically on read operations.

#### 36. How does Mongoose validate input data constraints before saving?
* **Answer**: Mongoose schemas support built-in validators like `min`, `max`, and `match`. If a document fails validation, the save operation is rejected before database write is attempted.

#### 37. What is the difference between referencing and embedding document relations?
* **Answer**: Embedding nests child documents inside the parent document, which is ideal for one-to-few relations. Referencing stores the child document's ID in the parent document, which is better for growing collections like users and products.

#### 38. How does `timestamps: true` simplify schema management?
* **Answer**: It tells Mongoose to automatically add and update `createdAt` and `updatedAt` date fields on every document creation or update.

#### 39. Why did you use `toJSON: { virtuals: true }` in your model options?
* **Answer**: By default, Mongoose excludes virtual fields when converting database documents to JSON. Enabling this setting ensures virtual fields like `isLowStock` are sent to the client.

#### 40. How did you search across multiple fields (SKU, Category, Name) in a single query?
* **Answer**: We used the MongoDB `$or` operator combined with case-insensitive regular expressions (`$regex`, `$options: "i"`) to match search terms across fields.

---

### 🌐 System Integration & Deployment

#### 41. How did you implement server-side pagination?
* **Answer**: We read the query parameters `page` and `limit` from the request. We then calculate the offset as `(page - 1) * limit` and pass these values to the Mongoose query chain using `.skip(skip).limit(limit)`.

#### 42. Explain why you ran two Mongoose queries inside a `Promise.all` block.
* **Answer**: We needed to get both the paginated list of products and the total count of matching items. Running them in parallel with `Promise.all` cuts database query execution time in half.

#### 43. Why is sorting logic executed on the database level rather than client-side?
* **Answer**: Sorting large datasets client-side degrades browser performance. Offloading sorting to the database query level ensures the client receives only the sorted subset of data it needs to render.

#### 44. What happens when a user attempts to update another user's product?
* **Answer**: The update controller queries for products matching both the requested product ID and the authenticated user's ID: `Product.findOne({ _id: req.params.id, createdBy: req.user._id })`. If no match is found, the update is rejected.

#### 45. What is the purpose of the `package-lock.json` file?
* **Answer**: It locks down the exact versions of all installed npm dependencies, ensuring that every deployment across environments runs on identical package source versions.

#### 46. How does Vercel know how to build your frontend React project?
* **Answer**: Vercel detects Vite configuration files and runs `npm run build` to output the bundled assets to the `dist` folder, which is then deployed to their edge CDN.

#### 47. Explain how Render hosts and runs your backend API.
* **Answer**: Render runs a continuous Node.js runtime process, installs the dependencies listed in `package.json`, sets up the configured environment variables, and starts the server via `node index.js`.

#### 48. What are the security risks of putting API keys and secrets directly in your code?
* **Answer**: Committing secrets to public repositories exposes them to scanning tools that can compromise databases, access cloud accounts, or leak user data.

#### 49. How did you resolve the React Router route loading issue on Vercel?
* **Answer**: We added a `vercel.json` file containing a rewrite rule that directs all incoming requests to `/index.html`, allowing the React Router router to manage client-side routing.

#### 50. How would you monitor production server performance?
* **Answer**: I would set up application performance monitoring tools (like New Relic or Datadog) to track API response latency, database queries, and system resource usage.

---

## 9. Behavioral/HR Questions & Star-Method Answer Frameworks

Use this structured format (Situation, Task, Action, Result) to answer behavioral interview questions.

### Question 1: "Tell me about a time you had to deal with a conflict between packages or libraries during development."
* **Situation**: "While building StockWise, I configured Tailwind CSS for styling after scaffolding the React project using Vite. During the configuration process, some dependencies were updated."
* **Task**: "I needed to compile a production build of the frontend, but the Vite build failed with an error stating that `react-router-dom` could not be resolved from my router configuration."
* **Action**: "I realized the Tailwind installation script had run a dependency cleanup that removed recently installed packages. I reinstalled the required packages using `npm install react-router-dom axios react-hot-toast react-icons` and updated `tailwind.config.js` to ensure proper routing."
* **Result**: "The production build compiled successfully in under 2 seconds, and routing and navigation worked seamlessly across both local and production environments."

### Question 2: "Why did you build an inventory system? What inspired the project?"
* **Situation**: "Many small businesses struggle with manual inventory tracking, leading to stock management issues like stockouts or capital tied up in slow-moving items."
* **Task**: "I wanted to build a practical tool to help store owners track inventory levels, monitor product categories, and receive automated restocking alerts."
* **Action**: "I designed and built StockWise, a web application with user authentication, CRUD operations, database constraints, automated alerts, and real-time dashboard analytics."
* **Result**: "I completed the project on a MERN stack with a clean, responsive UI, providing a functional system that solves a real business problem."

### Question 3: "How do you handle security when designing web applications?"
* **Situation**: "Security is a priority for web applications, especially those handling business inventory and user accounts."
* **Task**: "I needed to implement security measures for the StockWise API to protect user data and restrict access to authorized users."
* **Action**: "I hashed passwords using bcryptjs prior to database write, configured JWT middleware to verify tokens on protected endpoints, used a Mongoose select filter to prevent password hashes from being queried, and hid connection strings inside environment variables."
* **Result**: "The application utilizes stateless authentication, keeping user data and API endpoints protected against unauthorized access."
