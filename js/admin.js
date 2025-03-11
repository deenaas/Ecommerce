// js/admin.js

// Firebase Configuration and Initialization
const firebaseConfig = {
  apiKey: "AIzaSyDV6hrpGBZoSkSPHZtqqn2OrCVDdj-W8IU",
  authDomain: "ecommerce-146f7.firebaseapp.com",
  projectId: "ecommerce-146f7",
  storageBucket: "ecommerce-146f7.firebasestorage.app",
  messagingSenderId: "496636403004",
  appId: "1:496636403004:web:8177f60c3ba2b5325a9239",
  measurementId: "G-GCN4LS140X"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;

// Admin Login
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;

  if (email === 'sdeenaa16@gmail.com' && password === 'Deenaa@123') {
    auth.signInWithEmailAndPassword(email, password)
      .then(cred => {
        currentUser = cred.user;
        document.getElementById('loginMessage').innerText = "Login successful!";
        document.getElementById('loginSection').classList.remove('active');
        document.getElementById('adminPanel').classList.add('active');
        loadAnalytics();
        loadLowStockAlerts();
        loadUserManagement();
      })
      .catch(err => document.getElementById('loginMessage').innerText = err.message);
  } else {
    document.getElementById('loginMessage').innerText = "Invalid admin credentials. Use sdeenaa16@gmail.com and Deenaa@123.";
  }
});

// Toggle Sections
function showCategory(category) {
  document.querySelectorAll('.category-section').forEach(sec => sec.style.display = 'none');
  document.getElementById(category).style.display = 'block';
  if (category === 'orderManagement') {
    loadOrders();
  } else if (category === 'analytics') {
    loadAnalytics();
  } else if (category === 'productInventory') {
    loadProductInventory();
  } else if (category === 'lowStockAlerts') {
    loadLowStockAlerts();
  }
}

// Toggle Sidebar on Mobile
function toggleSidebar() {
  document.querySelector('.sidebar nav ul').classList.toggle('active');
}

// Generic Product Save Function
// Replace the existing saveProduct function
function saveProduct(category, productId, imageURLs, messageDivId, formId) {
  const productData = {
    category: category,
    productId: productId, // Explicitly include productId
    name: document.getElementById(`${category}Name`).value || '',
    description: document.getElementById(`${category}Description`).value || '',
    brand: document.getElementById(`${category}Brand`)?.value || '',
    imageURLs: imageURLs || [],
    price: parseInt(document.getElementById(`${category}Price`).value) || 0,
    availability: parseInt(document.getElementById(`${category}Availability`).value) || 0,
    stock: parseInt(document.getElementById(`${category}Stock`).value) || 0,
    creditReward: parseInt(document.getElementById(`${category}CreditReward`).value) || 0,
    isActive: document.getElementById(`${category}IsActive`).value === 'true',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    discountPrice: parseInt(document.getElementById(`${category}DiscountPrice`)?.value) || undefined,
    warehouseId: document.getElementById(`${category}WarehouseId`)?.value || '',
    soldBy: document.getElementById(`${category}SoldBy`)?.value || ''
  };

  // Add category-specific specifications
  productData.specifications = {};
  if (category === 'electronics') {
    productData.specifications = {
      display: document.getElementById('electronicsDisplay')?.value || '',
      processor: document.getElementById('electronicsProcessor')?.value || '',
      battery: document.getElementById('electronicsBattery')?.value || ''
    };
  } else if (category === 'fashion') {
    productData.specifications = {
      size: document.getElementById('fashionSize')?.value || '',
      color: document.getElementById('fashionColor')?.value || '',
      material: document.getElementById('fashionMaterial')?.value || ''
    };
  } else if (category === 'furniture') {
    productData.specifications = {
      dimensions: document.getElementById('furnitureDimensions')?.value || '',
      material: document.getElementById('furnitureMaterial')?.value || '',
      weight: parseInt(document.getElementById('furnitureWeight')?.value) || 0
    };
  } else if (category === 'cosmetics') {
    productData.specifications = {
      type: document.getElementById('cosmeticsType')?.value || '',
      ingredients: document.getElementById('cosmeticsIngredients')?.value.split(',').map(i => i.trim()) || [],
      expirationDate: document.getElementById('cosmeticsExpirationDate')?.value || ''
    };
  } else if (category === 'foodandhealth') {
    productData.specifications = {
      type: document.getElementById('foodAndHealthType')?.value || '',
      nutritionalInfo: document.getElementById('foodAndHealthNutritionalInfo')?.value || '',
      shelfLife: document.getElementById('foodAndHealthShelfLife')?.value || ''
    };
  }

  console.log(`Saving product data:`, productData); // Debug log
  db.collection('products').doc(productId).set(productData, { merge: true })
    .then(() => {
      document.getElementById(messageDivId).innerText = `${category} ${productId} added/updated successfully!`;
      document.getElementById(formId).reset();
      loadProductInventory(); // Refresh Product Inventory
      loadLowStockAlerts(); // Refresh low stock alerts
    loadProductInventory(); // Refresh Product Inventory
    loadLowStockAlerts(); // Refresh low stock alerts
    })
    .catch(err => {
      document.getElementById(messageDivId).innerText = `Error: ${err.message}`;
      console.error(`Error saving product ${productId}:`, err);
    });
}

// CRUD Handlers for Each Category
// Replace the existing categories.forEach block
const categories = ['electronics', 'fashion', 'furniture', 'cosmetics', 'foodandhealth'];
categories.forEach(category => {
  const form = document.getElementById(`${category}Form`);
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log(`Submitting form for category: ${category}`); // Debug log
      const productId = document.getElementById(`${category}ProductId`).value.trim();
      if (!productId) {
        document.getElementById(`${category}Message`).innerText = "Product ID is required!";
        return;
      }
      const imageFile = document.getElementById(`${category}ImageFile`)?.files[0];
      let imageURLs = document.getElementById(`${category}ImageURLs`)?.value.split(',').map(url => url.trim()).filter(url => url) || [];

      if (imageFile) {
        const storageRef = storage.ref(`products/${category}/${productId}/${imageFile.name}`);
        const uploadTask = storageRef.put(imageFile);

        uploadTask.on('state_changed',
          (snapshot) => { /* Handle progress if needed */ },
          (error) => {
            document.getElementById(`${category}Message`).innerText = `Error uploading image: ${error.message}`;
          },
          () => {
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
              imageURLs = [downloadURL];
              saveProduct(category, productId, imageURLs, `${category}Message`, `${category}Form`);
            });
          }
        );
      } else {
        saveProduct(category, productId, imageURLs, `${category}Message`, `${category}Form`);
      }
    });
  } else {
    console.warn(`Form with ID ${category}Form not found`);
  }
});

// Fetch Product for Update
document.getElementById('fetchProductForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const productId = document.getElementById('fetchProductId').value.trim();
  db.collection('products').doc(productId).get()
    .then(doc => {
      if (!doc.exists) {
        document.getElementById('fetchProductMessage').innerText = `Product ${productId} not found!`;
        document.getElementById('fetchedProductDetails').innerHTML = '';
        return;
      }
      const prod = doc.data();
      document.getElementById('fetchProductMessage').innerText = `Product ${productId} fetched successfully!`;
      
      // Display fetched product details
      document.getElementById('fetchedProductDetails').innerHTML = `
        <h3>Product Details</h3>
        <p>ID: ${productId}</p>
        <p>Name: ${prod.name}</p>
        <p>Category: ${prod.category}</p>
        <p>Price: $${prod.price}</p>
        <p>Stock: ${prod.stock}</p>
        <p>Active: ${prod.isActive ? 'Yes' : 'No'}</p>
        <button onclick="prefillForm('${productId}', '${prod.category}')">Edit in Form</button>
      `;
    })
    .catch(err => {
      document.getElementById('fetchProductMessage').innerText = `Error: ${err.message}`;
    });
});

// Prefill Form for Update
function prefillForm(productId, category) {
  db.collection('products').doc(productId).get()
    .then(doc => {
      const prod = doc.data();
      showCategory(category);
      const formPrefix = category.toLowerCase();
      document.getElementById(`${formPrefix}ProductId`).value = productId;
      document.getElementById(`${formPrefix}Name`).value = prod.name;
      document.getElementById(`${formPrefix}Description`).value = prod.description;
      document.getElementById(`${formPrefix}Brand`).value = prod.brand;
      document.getElementById(`${formPrefix}ImageURLs`).value = prod.imageURLs?.join(', ') || '';
      document.getElementById(`${formPrefix}Price`).value = prod.price;
      document.getElementById(`${formPrefix}Availability`).value = prod.availability;
      document.getElementById(`${formPrefix}Stock`).value = prod.stock;
      document.getElementById(`${formPrefix}CreditReward`).value = prod.creditReward || 0;
      document.getElementById(`${formPrefix}IsActive`).value = prod.isActive ? 'true' : 'false';

      if (category === 'electronics') {
        document.getElementById('electronicsDisplay').value = prod.specifications.display || '';
        document.getElementById('electronicsProcessor').value = prod.specifications.processor || '';
        document.getElementById('electronicsBattery').value = prod.specifications.battery || '';
      } else if (category === 'fashion') {
        document.getElementById('fashionSize').value = prod.specifications.size || '';
        document.getElementById('fashionColor').value = prod.specifications.color || '';
        document.getElementById('fashionMaterial').value = prod.specifications.material || '';
        document.getElementById('fashionDiscountPrice').value = prod.discountPrice || '';
        document.getElementById('fashionWarehouseId').value = prod.warehouseId || '';
        document.getElementById('fashionSoldBy').value = prod.soldBy || '';
      } else if (category === 'furniture') {
        document.getElementById('furnitureDimensions').value = prod.specifications.dimensions || '';
        document.getElementById('furnitureMaterial').value = prod.specifications.material || '';
        document.getElementById('furnitureWeight').value = prod.specifications.weight || 0;
        document.getElementById('furnitureDiscountPrice').value = prod.discountPrice || '';
        document.getElementById('furnitureWarehouseId').value = prod.warehouseId || '';
        document.getElementById('furnitureSoldBy').value = prod.soldBy || '';
      } else if (category === 'cosmetics') {
        document.getElementById('cosmeticsType').value = prod.specifications.type || '';
        document.getElementById('cosmeticsIngredients').value = prod.specifications.ingredients?.join(', ') || '';
        document.getElementById('cosmeticsExpirationDate').value = prod.specifications.expirationDate || '';
        document.getElementById('cosmeticsDiscountPrice').value = prod.discountPrice || '';
        document.getElementById('cosmeticsWarehouseId').value = prod.warehouseId || '';
        document.getElementById('cosmeticsSoldBy').value = prod.soldBy || '';
      } else if (category === 'foodAndHealth') {
        document.getElementById('foodAndHealthType').value = prod.specifications.type || '';
        document.getElementById('foodAndHealthNutritionalInfo').value = prod.specifications.nutritionalInfo || '';
        document.getElementById('foodAndHealthShelfLife').value = prod.specifications.shelfLife || '';
        document.getElementById('foodAndHealthDiscountPrice').value = prod.discountPrice || '';
        document.getElementById('foodAndHealthWarehouseId').value = prod.warehouseId || '';
        document.getElementById('foodAndHealthSoldBy').value = prod.soldBy || '';
      }
    })
    .catch(err => alert(`Error prefilling form: ${err.message}`));
}

// Delete Product
document.getElementById('deleteProductForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const productId = document.getElementById('deleteProductId').value.trim();
  if (confirm(`Are you sure you want to delete product ${productId}?`)) {
    db.collection('products').doc(productId).delete()
      .then(() => {
        document.getElementById('deleteProductMessage').innerText = `Product ${productId} deleted successfully!`;
        document.getElementById('deleteProductForm').reset();
        loadLowStockAlerts();
      })
      .catch(err => {
        document.getElementById('deleteProductMessage').innerText = `Error: ${err.message}`;
      });
  }
});

// Helper Function to Delete Product (used in inventory and search views)
function deleteProduct(productId) {
  if (confirm(`Are you sure you want to delete product ${productId}?`)) {
    db.collection('products').doc(productId).delete()
      .then(() => {
        alert(`Product ${productId} deleted successfully!`);
        loadProductInventory(); // Refresh inventory
        loadLowStockAlerts();
      })
      .catch(err => alert(`Error deleting product: ${err.message}`));
  }
}

// Bulk Upload
document.getElementById('bulkUploadForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const file = document.getElementById('bulkUploadFile').files[0];
  if (!file) {
    document.getElementById('bulkUploadMessage').innerText = "Please select a CSV file!";
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const rows = text.split('\n').slice(1); // Skip header
    rows.forEach(row => {
      const [productId, category, name, description, brand, imageURLs, price, availability, stock, creditReward, isActive, ...specs] = row.split(',');
      const productData = {
        category,
        name,
        description,
        brand,
        imageURLs: imageURLs.split('|'),
        price: parseInt(price),
        availability: parseInt(availability) || 0,
        stock: parseInt(stock) || 0,
        creditReward: parseInt(creditReward) || 0,
        isActive: isActive === 'true',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        specifications: {}
      };
      if (category === 'electronics') {
        productData.specifications = { display: specs[0], processor: specs[1], battery: specs[2] };
      } else if (category === 'fashion') {
        productData.specifications = { size: specs[0], color: specs[1], material: specs[2] };
        productData.discountPrice = parseInt(specs[3]) || undefined;
        productData.warehouseId = specs[4];
        productData.soldBy = specs[5];
      } else if (category === 'furniture') {
        productData.specifications = { dimensions: specs[0], material: specs[1], weight: parseInt(specs[2]) || 0 };
        productData.discountPrice = parseInt(specs[3]) || undefined;
        productData.warehouseId = specs[4];
        productData.soldBy = specs[5];
      } else if (category === 'cosmetics') {
        productData.specifications = { type: specs[0], ingredients: specs[1]?.split('|'), expirationDate: specs[2] };
        productData.discountPrice = parseInt(specs[3]) || undefined;
        productData.warehouseId = specs[4];
        productData.soldBy = specs[5];
      } else if (category === 'foodAndHealth') {
        productData.specifications = { type: specs[0], nutritionalInfo: specs[1], shelfLife: specs[2] };
        productData.discountPrice = parseInt(specs[3]) || undefined;
        productData.warehouseId = specs[4];
        productData.soldBy = specs[5];
      }
      db.collection('products').doc(productId).set(productData)
        .catch(err => console.error(`Error uploading ${productId}: ${err.message}`));
    });
    document.getElementById('bulkUploadMessage').innerText = "Bulk upload completed! Check console for errors.";
    loadLowStockAlerts();
  };
  reader.readAsText(file);
});

// User Management
function loadUserManagement() {
  const userList = document.getElementById('userList').querySelector('tbody');
  userList.innerHTML = "";
  db.collection('users').get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const user = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.email}</td>
          <td>${user.name || 'N/A'}</td>
          <td>$${user.credit || 0}</td>
          <td>${user.orderHistory ? user.orderHistory.length : 0}</td>
          <td><button onclick="updateCredit('${doc.id}')">Update Credit</button></td>
        `;
        userList.appendChild(row);
      });
    })
    .catch(err => console.error("Error loading users:", err));
}

function updateCredit(userId) {
  const newCredit = prompt("Enter new credit amount:");
  if (newCredit !== null) {
    db.collection('users').doc(userId).update({
      credit: parseInt(newCredit) || 0
    }).then(() => loadUserManagement());
  }
}

// Load Orders by Category
function loadOrders() {
  const ordersListDiv = document.getElementById('ordersList');
  ordersListDiv.innerHTML = "Loading orders...";

  db.collection('orders').where('paymentStatus', '==', 'paid').get()
    .then(snapshot => {
      if (snapshot.empty) {
        ordersListDiv.innerHTML = "No orders found.";
        return;
      }

      const ordersByCategory = {};
      const promises = snapshot.docs.map(doc => {
        const order = doc.data();
        const cartItemsPromises = db.collection('orders').doc(doc.id).collection('cartItems').get()
          .then(cartSnapshot => {
            const items = cartSnapshot.docs.map(itemDoc => itemDoc.data());
            return Promise.all(items.map(item => {
              return db.collection('products').doc(item.productId).get()
                .then(prodDoc => {
                  const prod = prodDoc.data();
                  const category = prod.category || 'unknown';
                  if (!ordersByCategory[category]) {
                    ordersByCategory[category] = [];
                  }
                  ordersByCategory[category].push({
                    orderId: doc.id,
                    userId: order.userId,
                    productName: prod.name,
                    productId: item.productId,
                    quantity: item.quantity,
                    totalPrice: item.price * item.quantity
                  });
                });
            }));
          });
        return cartItemsPromises;
      });

      Promise.all(promises).then(() => {
        ordersListDiv.innerHTML = '';
        Object.keys(ordersByCategory).forEach(category => {
          const categoryDiv = document.createElement('div');
          categoryDiv.innerHTML = `<h4>${category}</h4>`;
          const orderList = document.createElement('ul');
          ordersByCategory[category].forEach(order => {
            const orderItem = document.createElement('li');
            orderItem.innerHTML = `
              Order ${order.orderId} by User ${order.userId}: 
              ${order.productName} (ID: ${order.productId}) - 
              Quantity: ${order.quantity}, Total: $${order.totalPrice.toFixed(2)}
            `;
            orderList.appendChild(orderItem);
          });
          categoryDiv.appendChild(orderList);
          ordersListDiv.appendChild(categoryDiv);
        });
      });
    })
    .catch(err => {
      ordersListDiv.innerHTML = `Error loading orders: ${err.message}`;
    });
}

// Load Product Inventory
// Replace the existing loadProductInventory function
function loadProductInventory() {
  const productListDiv = document.getElementById('productInventoryList');
  const showInactive = document.getElementById('showInactiveProducts').checked;
  productListDiv.innerHTML = "Loading products...";

  let query = db.collection('products');
  if (!showInactive) {
    query = query.where('isActive', '==', true);
  }

  query.get()
    .then(snapshot => {
      if (snapshot.empty) {
        productListDiv.innerHTML = "No products found.";
        return;
      }

      const productsByCategory = {};
      snapshot.forEach(doc => {
        const prod = doc.data();
        const category = prod.category || 'unknown';
        if (!productsByCategory[category]) {
          productsByCategory[category] = [];
        }
        productsByCategory[category].push({ id: doc.id, ...prod });
      });

      productListDiv.innerHTML = '';
      Object.keys(productsByCategory).forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.innerHTML = `<h4>${category}</h4>`;
        const productList = document.createElement('ul');
        productsByCategory[category].forEach(prod => {
          const stockWarning = prod.stock < 5 && prod.stock > 0 ? ' (Low Stock!)' : prod.stock === 0 ? ' (Out of Stock)' : '';
          const activeStatus = prod.isActive ? 'Active' : 'Inactive';
          const productItem = document.createElement('li');
          productItem.innerHTML = `
            ${prod.name} (ID: ${prod.id}) - 
            Price: $${prod.price || 'N/A'}, Stock: ${prod.stock || 0}${stockWarning}, 
            Status: ${activeStatus}, Credit Reward: ${prod.creditReward || 0}
            <button class="edit-btn" data-id="${prod.id}" data-category="${category}">Edit</button>
            <button class="delete-btn" data-id="${prod.id}">Delete</button>
          `;
          productList.appendChild(productItem);
        });
        categoryDiv.appendChild(productList);
        productListDiv.appendChild(categoryDiv);
      });

      // Use event delegation on the productListDiv to handle dynamic buttons
      productListDiv.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (editBtn) {
          e.preventDefault();
          const productId = editBtn.getAttribute('data-id');
          const category = editBtn.getAttribute('data-category');
          prefillForm(productId, category);
        } else if (deleteBtn) {
          e.preventDefault();
          const productId = deleteBtn.getAttribute('data-id');
          deleteProduct(productId);
        }
      });
    })
    .catch(err => {
      productListDiv.innerHTML = `Error loading products: ${err.message}`;
    });
}

// Product Search
document.getElementById('productSearchForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const query = document.getElementById('searchQuery').value.trim().toLowerCase();
  const searchResultsDiv = document.getElementById('searchResults');
  searchResultsDiv.innerHTML = "Searching...";

  db.collection('products').get()
    .then(snapshot => {
      const results = snapshot.docs.filter(doc => {
        const prod = doc.data();
        return doc.id.toLowerCase().includes(query) || prod.name.toLowerCase().includes(query);
      });

      if (results.length === 0) {
        searchResultsDiv.innerHTML = "No products found.";
        return;
      }

      searchResultsDiv.innerHTML = '<h4>Search Results</h4>';
      const resultList = document.createElement('ul');
      results.forEach(doc => {
        const prod = doc.data();
        const stockWarning = prod.stock < 5 && prod.stock > 0 ? ' (Low Stock!)' : prod.stock === 0 ? ' (Out of Stock)' : '';
        const activeStatus = prod.isActive ? 'Active' : 'Inactive';
        const resultItem = document.createElement('li');
        resultItem.innerHTML = `
          ${prod.name} (ID: ${doc.id}) - 
          Category: ${prod.category}, 
          Price: $${prod.price}, Stock: ${prod.stock}${stockWarning}, 
          Status: ${activeStatus}, Credit Reward: ${prod.creditReward || 0}
          <button onclick="prefillForm('${doc.id}', '${prod.category}')">Edit</button>
          <button onclick="deleteProduct('${doc.id}')">Delete</button>
        `;
        resultList.appendChild(resultItem);
      });
      searchResultsDiv.appendChild(resultList);
    })
    .catch(err => {
      searchResultsDiv.innerHTML = `Error searching products: ${err.message}`;
    });
});

// Low Stock Alerts
function loadLowStockAlerts() {
  const lowStockListDiv = document.getElementById('lowStockList');
  lowStockListDiv.innerHTML = "Loading low stock products...";

  db.collection('products').where('stock', '<', 5).where('stock', '>', 0).get()
    .then(snapshot => {
      if (snapshot.empty) {
        lowStockListDiv.innerHTML = "No low stock products.";
        return;
      }

      lowStockListDiv.innerHTML = '<h4>Low Stock Products</h4>';
      const lowStockList = document.createElement('ul');
      snapshot.forEach(doc => {
        const prod = doc.data();
        const lowStockItem = document.createElement('li');
        lowStockItem.innerHTML = `
          ${prod.name} (ID: ${doc.id}) - 
          Category: ${prod.category}, Stock: ${prod.stock}
          <button onclick="prefillForm('${doc.id}', '${prod.category}')">Edit</button>
        `;
        lowStockList.appendChild(lowStockItem);
      });
      lowStockListDiv.appendChild(lowStockList);

      // Show alert if there are low stock products
      if (snapshot.size > 0) {
        alert(`Warning: ${snapshot.size} products are low on stock!`);
      }
    })
    .catch(err => {
      lowStockListDiv.innerHTML = `Error loading low stock products: ${err.message}`;
    });
}

// Load Analytics
// Load Analytics with Date Filters and Detailed Metrics
function loadAnalytics() {
  const fromDate = document.getElementById('analyticsFromDate').value;
  const toDate = document.getElementById('analyticsToDate').value;

  const analytics = {
    cashOrders: [],
    customerPurchases: [],
    payments: [],
    topProducts: [],
    bottomProducts: [],
    outOfStockProducts: [],
    topCreditProducts: [],
    categoryStock: {},
    userActivity: {},
    categorySales: {},
    revenueOverTime: [],
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    outOfStockLostRevenue: 0,
    creditRewardsUsed: 0
  };

  // Helper function to check if order date is within the selected range
  const isWithinDateRange = (timestamp) => {
    if (!timestamp) return false;
    const orderDate = timestamp.toDate();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (from && orderDate < from) return false;
    if (to && orderDate > to) return false;
    return true;
  };

  // Step 1: Fetch Orders (Cash Orders and Customer Purchases)
  let ordersQuery = db.collection('orders');
  ordersQuery.get()
    .then(snapshot => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      analytics.customerPurchases = allOrders.filter(order => {
        return (!fromDate || !toDate) || (order.createdAt && isWithinDateRange(order.createdAt));
      });
      analytics.cashOrders = analytics.customerPurchases.filter(order => order.paymentStatus === 'paid');

      // Calculate Total Revenue, Total Orders, AOV, Credit Rewards Used, and Revenue Over Time
      let revenueByDate = {};
      analytics.totalOrders = analytics.cashOrders.length;
      analytics.cashOrders.forEach(order => {
        const total = order.totalAmount || 0;
        analytics.totalRevenue += total;

        // Revenue Over Time (group by date)
        if (order.createdAt) {
          const date = order.createdAt.toDate().toISOString().split('T')[0];
          revenueByDate[date] = (revenueByDate[date] || 0) + total;
        }

        // Credit Rewards Used
        if (order.creditUsed) {
          analytics.creditRewardsUsed += order.creditUsed;
        }
      });

      analytics.averageOrderValue = analytics.totalOrders > 0 ? analytics.totalRevenue / analytics.totalOrders : 0;

      // Convert revenueByDate to array for chart
      analytics.revenueOverTime = Object.entries(revenueByDate).map(([date, revenue]) => ({
        date,
        revenue
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      // Step 2: Fetch Cart Items for Category Sales and User Activity
      const cartPromises = analytics.cashOrders.map(order => {
        return db.collection('orders').doc(order.id).collection('cartItems').get()
          .then(cartSnapshot => {
            const items = cartSnapshot.docs.map(itemDoc => itemDoc.data());
            return Promise.all(items.map(item => {
              return db.collection('products').doc(item.productId).get()
                .then(prodDoc => {
                  const prod = prodDoc.data();
                  const category = prod.category || 'unknown';
                  const quantity = item.quantity || 0;
                  const revenue = item.price * quantity;

                  // Category Sales (by revenue)
                  analytics.categorySales[category] = (analytics.categorySales[category] || 0) + revenue;

                  // User Activity
                  analytics.userActivity[order.userId] = (analytics.userActivity[order.userId] || 0) + 1;
                });
            }));
          });
      });

      return Promise.all(cartPromises);
    })
    .then(() => {
      // Step 3: Fetch Payments
      return db.collection('payments').get()
        .then(snapshot => {
          analytics.payments = snapshot.docs.map(doc => doc.data()).filter(payment => {
            return (!fromDate || !toDate) || (payment.createdAt && isWithinDateRange(payment.createdAt));
          });
        });
    })
    .then(() => {
      // Step 4: Fetch Top Products by Stock
      return db.collection('products').orderBy('stock', 'desc').limit(10).get()
        .then(snapshot => {
          analytics.topProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
    })
    .then(() => {
      // Step 5: Fetch Bottom Products by Stock
      return db.collection('products').orderBy('stock', 'asc').limit(10).get()
        .then(snapshot => {
          analytics.bottomProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
    })
    .then(() => {
      // Step 6: Fetch Out-of-Stock Products and Estimate Lost Revenue
      return db.collection('products').where('stock', '==', 0).get()
        .then(snapshot => {
          analytics.outOfStockProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Estimate lost revenue (simplified: assume each out-of-stock product could have sold 5 units)
          analytics.outOfStockLostRevenue = analytics.outOfStockProducts.reduce((total, prod) => {
            return total + (prod.price * 5); // Assume 5 units could have been sold
          }, 0);
        });
    })
    .then(() => {
      // Step 7: Fetch Top Products by Credit Reward
      return db.collection('products').orderBy('creditReward', 'desc').limit(10).get()
        .then(snapshot => {
          analytics.topCreditProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
    })
    .then(() => {
      // Step 8: Fetch Inventory by Category
      return db.collection('products').get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            const stock = doc.data().stock || 0;
            const cat = doc.data().category || 'unknown';
            analytics.categoryStock[cat] = (analytics.categoryStock[cat] || 0) + stock;
          });
        });
    })
    .then(() => {
      // Update HTML with Analytics Data
      // Summary Metrics
      document.getElementById('totalRevenue').innerText = `$${analytics.totalRevenue.toFixed(2)}`;
      document.getElementById('averageOrderValue').innerText = `$${analytics.averageOrderValue.toFixed(2)}`;
      document.getElementById('totalOrders').innerText = analytics.totalOrders;
      document.getElementById('outOfStockLostRevenue').innerText = `$${analytics.outOfStockLostRevenue.toFixed(2)}`;
      document.getElementById('creditRewardsUsed').innerText = `${analytics.creditRewardsUsed} credits`;

      // Cash Reports
      document.getElementById('cashReports').innerHTML = analytics.cashOrders.map(o => `<div>${o.orderId}: $${o.totalAmount}</div>`).join('');

      // Customer Purchases
      document.getElementById('customerPurchases').innerHTML = analytics.customerPurchases.map(o => `<div>${o.userId}: $${o.totalAmount}</div>`).join('');

      // User Activity
      document.getElementById('userActivity').innerHTML = Object.entries(analytics.userActivity)
        .map(([userId, orderCount]) => `<div>User ${userId}: ${orderCount} orders</div>`).join('');

      // Payment Reports
      document.getElementById('paymentReports').innerHTML = analytics.payments.map(p => `<div>${p.transactionId}: $${p.amount} (${p.status})</div>`).join('');

      // Top Products by Stock
      document.getElementById('topProducts').innerHTML = analytics.topProducts.map(p => `<div>${p.id}: ${p.stock || 0}</div>`).join('');

      // Bottom Products by Stock
      document.getElementById('bottomProducts').innerHTML = analytics.bottomProducts.map(p => {
        const lowStockWarning = p.stock < 5 && p.stock > 0 ? ' (Low Stock!)' : p.stock === 0 ? ' (Out of Stock)' : '';
        return `<div>${p.id}: ${p.stock || 0}${lowStockWarning}</div>`;
      }).join('');

      // Out-of-Stock Products
      document.getElementById('outOfStockProducts').innerHTML = analytics.outOfStockProducts.length > 0 
        ? analytics.outOfStockProducts.map(p => `<div>${p.id}: ${p.name}</div>`).join('')
        : 'No out-of-stock products.';

      // Top Products by Credit Reward
      document.getElementById('topCreditProducts').innerHTML = analytics.topCreditProducts.map(p => `<div>${p.id}: ${p.creditReward || 0} credits</div>`).join('');

      // Top Categories by Sales
      document.getElementById('topCategoriesBySales').innerHTML = Object.entries(analytics.categorySales)
        .sort(([, a], [, b]) => b - a)
        .map(([category, revenue]) => `<div>${category}: $${revenue.toFixed(2)}</div>`).join('');

      // Inventory by Category
      document.getElementById('inventoryReports').innerHTML = Object.entries(analytics.categoryStock)
        .map(([cat, qty]) => `<div>${cat}: ${qty}</div>`).join('');

      // Update Charts
      // Top Products Chart
      new Chart(document.getElementById('topProductsChart'), {
        type: 'bar',
        data: {
          labels: analytics.topProducts.map(p => p.id),
          datasets: [{
            label: 'Stock',
            data: analytics.topProducts.map(p => p.stock || 0),
            backgroundColor: '#febd69',
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });

      // Bottom Products Chart
      new Chart(document.getElementById('bottomProductsChart'), {
        type: 'bar',
        data: {
          labels: analytics.bottomProducts.map(p => p.id),
          datasets: [{
            label: 'Stock',
            data: analytics.bottomProducts.map(p => p.stock || 0),
            backgroundColor: '#e47911',
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });

      // Top Categories by Sales Chart
      new Chart(document.getElementById('topCategoriesChart'), {
        type: 'bar',
        data: {
          labels: Object.keys(analytics.categorySales),
          datasets: [{
            label: 'Revenue ($)',
            data: Object.values(analytics.categorySales),
            backgroundColor: '#ff9900',
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });

      // Revenue Over Time Chart
      new Chart(document.getElementById('revenueOverTimeChart'), {
        type: 'line',
        data: {
          labels: analytics.revenueOverTime.map(item => item.date),
          datasets: [{
            label: 'Revenue ($)',
            data: analytics.revenueOverTime.map(item => item.revenue),
            fill: false,
            borderColor: '#232f3e',
            tension: 0.1
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });

      // Inventory Chart
      new Chart(document.getElementById('inventoryChart'), {
        type: 'pie',
        data: {
          labels: Object.keys(analytics.categoryStock),
          datasets: [{
            label: 'Inventory',
            data: Object.values(analytics.categoryStock),
            backgroundColor: ['#febd69', '#e47911', '#232f3e', '#ff9900', '#ffcc00'],
          }]
        },
        options: { responsive: true }
      });
    })
    .catch(err => console.error("Error loading analytics:", err));
}

// Apply Analytics Filters
document.getElementById('analyticsFilterForm').addEventListener('submit', function(e) {
  e.preventDefault();
  loadAnalytics();
});

// Clear Analytics Filters
function clearAnalyticsFilters() {
  document.getElementById('analyticsFilterForm').reset();
  loadAnalytics();
}

// Logout
function logout() {
  auth.signOut().then(() => {
    currentUser = null;
    alert("Logged out successfully.");
    document.getElementById('adminPanel').classList.remove('active');
    document.getElementById('loginSection').classList.add('active');
    window.location.href = 'index.html';
  });
}

// Auth State Change
auth.onAuthStateChanged(user => {
  currentUser = user;
  if (!user && document.getElementById('adminPanel').classList.contains('active')) {
    document.getElementById('adminPanel').classList.remove('active');
    document.getElementById('loginSection').classList.add('active');
  } else if (user) {
    loadUserManagement();
    loadAnalytics();
    loadLowStockAlerts();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.category-section').forEach(sec => sec.style.display = 'none');
  showCategory('electronics');
});



