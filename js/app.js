// js/app.js
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

let currentUser = null;
let currentOrder = null;

// Toggle sections
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  if (sectionId === 'products') loadProducts();
  if (sectionId === 'cart') loadCart();
  if (sectionId === 'wishlist') loadWishlist();
  if (sectionId === 'history') loadHistory();
}

// Toggle navigation menu on mobile
function toggleMenu() {
  document.querySelector('.main-nav ul').classList.toggle('active');
}

// Toggle user dropdown
function toggleDropdown() {
  document.getElementById('userDropdown').style.display =
    document.getElementById('userDropdown').style.display === 'block' ? 'none' : 'block';
}

// Close modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}



// Registration
document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const userData = {
    name: document.getElementById('regName').value,
    age: parseInt(document.getElementById('regAge').value),
    gender: document.getElementById('regGender').value,
    phone: document.getElementById('regPhone').value,
    dateOfBirth: document.getElementById('regDob').value,
    email: email,
    credit: 0,
    cart: [],
    orderHistory: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      currentUser = cred.user;
      document.getElementById('regMessage').innerText = "Registration successful!";
      return db.collection('users').doc(currentUser.uid).set(userData);
    })
    .then(() => showSection('home'))
    .catch(err => document.getElementById('regMessage').innerText = err.message);
});

// Login
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(cred => {
      currentUser = cred.user;
      document.getElementById('loginMessage').innerText = "Login successful!";
      document.getElementById('userGreeting').innerText = `Hello, ${cred.user.email.split('@')[0]}`;
      showSection('home');
    })
    .catch(err => document.getElementById('loginMessage').innerText = err.message);
});

// Forgot Password (new feature)
document.getElementById('forgotPasswordForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value;
  auth.sendPasswordResetEmail(email)
    .then(() => {
      document.getElementById('forgotMessage').innerText = "Password reset email sent!";
    })
    .catch(err => document.getElementById('forgotMessage').innerText = err.message);
});



// Load Products
// In js/app.js, replace the existing loadProducts function
function loadProducts() {
  const productsListDiv = document.getElementById('productsList');
  productsListDiv.innerHTML = "Loading products...";
  db.collection('products').get() // Fetch all products, including out-of-stock
    .then(snapshot => {
      productsListDiv.innerHTML = "";
      if (snapshot.empty) {
        productsListDiv.innerHTML = "No products available.";
        return;
      }
      snapshot.forEach(doc => {
        const prod = doc.data();
        const productId = doc.id;

        // Check stock and update isActive if necessary
        if (prod.stock === 0 && prod.isActive) {
          db.collection('products').doc(productId).update({ isActive: false });
          prod.isActive = false;
        }

        const imageUrl = prod.imageURLs?.[0] || 'assets/images/nothing.png';
        const prodDiv = document.createElement('div');
        prodDiv.classList.add('product-card');
        if (!prod.isActive) prodDiv.classList.add('out-of-stock');

        let specsHTML = '';
        if (prod.category === 'electronics') {
          specsHTML = `
            <p>Display: ${prod.specifications.display || 'N/A'}</p>
            <p>Processor: ${prod.specifications.processor || 'N/A'}</p>
            <p>Battery: ${prod.specifications.battery || 'N/A'}</p>
          `;
        } else if (prod.category === 'fashion') {
          specsHTML = `
            <p>Size: ${prod.specifications.size || 'N/A'}</p>
            <p>Color: ${prod.specifications.color || 'N/A'}</p>
            <p>Material: ${prod.specifications.material || 'N/A'}</p>
          `;
        } else if (prod.category === 'furniture') {
          specsHTML = `
            <p>Dimensions: ${prod.specifications.dimensions || 'N/A'}</p>
            <p>Material: ${prod.specifications.material || 'N/A'}</p>
            <p>Weight: ${prod.specifications.weight || 0} kg</p>
          `;
        } else if (prod.category === 'cosmetics') {
          specsHTML = `
            <p>Type: ${prod.specifications.type || 'N/A'}</p>
            <p>Ingredients: ${prod.specifications.ingredients?.join(', ') || 'N/A'}</p>
            <p>Expiration: ${prod.specifications.expirationDate || 'N/A'}</p>
          `;
        } else if (prod.category === 'foodAndHealth') {
          specsHTML = `
            <p>Type: ${prod.specifications.type || 'N/A'}</p>
            <p>Nutrition: ${prod.specifications.nutritionalInfo || 'N/A'}</p>
            <p>Shelf Life: ${prod.specifications.shelfLife || 'N/A'}</p>
          `;
        }

        const stockHTML = prod.stock < 5 && prod.stock > 0 ? `<p style="color: orange;">Stock: ${prod.stock} (Low Stock!)</p>` : '';
        const outOfStockMessage = !prod.isActive ? `<p style="color: red;">Out of Stock</p>` : '';

        prodDiv.innerHTML = `
          <div class="product-image">
            <img src="${imageUrl}" alt="${prod.name}" onerror="this.src='assets/images/nothing.png'">
          </div>
          <div class="product-details">
            <h3>${prod.name} (ID: ${productId})</h3>
            <p>Category: ${prod.category}</p>
            <p><small>${prod.description}</small></p>
            ${specsHTML}
            <p>Availability: ${prod.availability}</p>
            ${stockHTML}
            ${outOfStockMessage}
            <p>Price: $${prod.discountPrice || prod.price || 'N/A'}</p>
            <p>Credits Earned on Purchase: ${prod.creditReward || 0}</p>
            <button onclick="addToCart('${productId}', '${prod.name}')" ${!prod.isActive ? 'disabled' : ''}>Add to Cart</button>
            <button onclick="addToWishlist('${productId}', '${prod.name}')">Add to Wishlist</button>
          </div>
        `;
        productsListDiv.appendChild(prodDiv);
      });
    })
    .catch(err => {
      console.error("Error loading products:", err);
      productsListDiv.innerHTML = "Error loading products.";
    });
}

// Search Products (new feature - placeholder, needs Firebase query)
// Search Functionality
function searchProducts() {
  const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!searchInput) {
    alert("Please enter a search term.");
    return;
  }

  const productsList = document.getElementById('productsList');
  productsList.innerHTML = '<div>Loading search results...</div>';

  // Query Firestore and filter products
  db.collection('products')
    .where('isActive', '==', true)
    .get()
    .then(snapshot => {
      const filteredProducts = [];
      snapshot.forEach(doc => {
        const product = doc.data();
        const name = product.name ? product.name.toLowerCase() : '';
        const category = product.category ? product.category.toLowerCase() : '';
        if (name.includes(searchInput) || category.includes(searchInput)) {
          filteredProducts.push({ id: doc.id, ...product });
        }
      });

      // Display search results
      if (filteredProducts.length === 0) {
        productsList.innerHTML = `<p>No products found matching "${searchInput}".</p>`;
      } else {
        productsList.innerHTML = '';
        filteredProducts.forEach(product => {
          const item = document.createElement('div');
          item.className = 'product-item';
          item.innerHTML = `
            <img src="${product.imageURLs?.[0] || 'https://picsum.photos/150/150'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>$${product.discountPrice || product.price || 'N/A'}</p>
            <button onclick="addToCart('${product.id}', '${product.name}')">Add to Cart</button>
            <button onclick="addToWishlist('${product.id}', '${product.name}')">Add to Wishlist</button>
          `;
          productsList.appendChild(item);
        });
      }

      // Navigate to the Products section
      if (!document.getElementById('products').classList.contains('active')) {
        showSection('products');
      }
    })
    .catch(err => {
      console.error('Error searching products:', err);
      productsList.innerHTML = `<p>Error loading search results: ${err.message}</p>`;
    });
}

     //   Apply Filters (new feature - placeholder, needs Firebase query)
        function applyFilters() {
          const category = document.getElementById('categoryFilter').value;
          const priceMin = document.getElementById('priceMin').value || 0;
          const priceMax = document.getElementById('priceMax').value || Infinity;
          const sortBy = document.getElementById('sortBy').value;

          const productsListDiv = document.getElementById('productsList');
          productsListDiv.innerHTML = "Filtering...";
          let query = db.collection('products').where('isActive', '==', true);

          if (category !== 'all') query = query.where('category', '==', category);
          query.get()
            .then(snapshot => {
              productsListDiv.innerHTML = "";
              let filtered = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(prod => {
                  const price = prod.discountPrice || prod.price || 0;
                  return price >= priceMin && price <= priceMax;
                });

              if (sortBy === 'priceHigh') filtered.sort((a, b) => (b.discountPrice || b.price || 0) - (a.discountPrice || a.price || 0));
              else filtered.sort((a, b) => (a.discountPrice || a.price || 0) - (b.discountPrice || b.price || 0));

              if (filtered.length === 0) {
                productsListDiv.innerHTML = "No matching products.";
                return;
              }
              filtered.forEach(prod => {
                const productId = prod.id;
                const imageUrl = prod.imageURLs?.[0] || 'assets/images/nothing.png';
                const prodDiv = document.createElement('div');
                prodDiv.classList.add('product-card');
                prodDiv.innerHTML = `
                  <img src="${imageUrl}" alt="${prod.name}" width="200" onerror="this.src='assets/images/nothing.png'">
                  <h3>${prod.name}</h3>
                  <p>Price: $${prod.discountPrice || prod.price || 'N/A'}</p>
                  <button onclick="addToCart('${productId}', '${prod.name}')">Add to Cart</button>
                `;
                productsListDiv.appendChild(prodDiv);
              });
            })
            .catch(err => {
              console.error("Error applying filters:", err);
              productsListDiv.innerHTML = "Error applying filters.";
            });
        }

// Add to Cart
// In js/app.js, ensure addToCart function is present
function addToCart(productId, productName) {
  if (!currentUser) {
    alert("Please login first!");
    return;
  }
  db.collection('products').doc(productId).get().then(doc => {
    if (!doc.exists) {
      alert("Product not found!");
      return;
    }
    const prod = doc.data();
    if (!prod.isActive || prod.stock <= 0) {
      alert("This product is out of stock and cannot be added to the cart.");
      return;
    }
    const cartRef = db.collection('users').doc(currentUser.uid).collection('cart').doc(productId);
    cartRef.get().then(cartDoc => {
      if (cartDoc.exists) {
        const currentQty = cartDoc.data().quantity;
        if (currentQty + 1 > prod.stock) {
          alert(`Cannot add more of this item. Only ${prod.stock} left in stock.`);
          return;
        }
        cartRef.update({
          quantity: firebase.firestore.FieldValue.increment(1)
        }).then(() => {
          alert(`${productName} quantity updated in cart!`);
          loadCart();
        });
      } else {
        cartRef.set({
          productId: productId,
          name: prod.name,
          imageUrl: prod.imageURLs?.[0] || 'assets/images/nothing.png',
          price: prod.discountPrice || prod.price,
          quantity: 1
        }).then(() => {
          alert(`${productName} added to cart!`);
          loadCart();
        });
      }
    });
  }).catch(err => alert("Error adding to cart: " + err.message));
}

// Load Cart
// In js/app.js, replace the existing loadCart function
function loadCart() {
  if (!currentUser) {
    alert("Please login first!");
    return;
  }
  const cartListDiv = document.getElementById('cartList');
  cartListDiv.innerHTML = "";
  db.collection('users').doc(currentUser.uid).collection('cart').get()
    .then(snapshot => {
      if (snapshot.empty) {
        cartListDiv.innerHTML = "Your cart is empty.";
        document.getElementById('cartTotal').innerText = '0';
        return;
      }
      let total = 0;
      snapshot.forEach(doc => {
        const item = doc.data();
        const totalPrice = item.price * item.quantity;
        total += totalPrice;
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('cart-item');
        itemDiv.innerHTML = `
          <img src="${item.imageUrl || 'assets/images/nothing.png'}" alt="${item.name}" width="100" onerror="this.src='assets/images/nothing.png'">
          <br><strong>${item.name}</strong> (ID: ${item.productId})
          <br>Price per item: $${item.price}
          <br>Quantity: ${item.quantity}
          <button onclick="updateCartQuantity('${doc.id}', ${item.quantity + 1})">+</button>
          <button onclick="updateCartQuantity('${doc.id}', ${item.quantity - 1})">-</button>
          <br>Total Price: $${totalPrice.toFixed(2)}
          <br><button onclick="removeFromCart('${doc.id}')">Remove</button>
        `;
        cartListDiv.appendChild(itemDiv);
      });
      document.getElementById('cartTotal').innerText = total.toFixed(2);
    })
    .catch(err => console.error(err));
}

// Ensure updateCartQuantity and removeFromCart are present
function updateCartQuantity(docId, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(docId);
    return;
  }
  const cartRef = db.collection('users').doc(currentUser.uid).collection('cart').doc(docId);
  cartRef.get().then(doc => {
    const productId = doc.data().productId;
    db.collection('products').doc(productId).get().then(prodDoc => {
      const prod = prodDoc.data();
      if (newQuantity > prod.stock) {
        alert(`Cannot add more of this item. Only ${prod.stock} left in stock.`);
        return;
      }
      cartRef.update({ quantity: newQuantity })
        .then(() => loadCart())
        .catch(err => alert(`Error updating quantity: ${err.message}`));
    });
  });
}

function removeFromCart(docId) {
  db.collection('users').doc(currentUser.uid).collection('cart').doc(docId).delete()
    .then(() => {
      alert("Item removed from cart.");
      loadCart();
    })
    .catch(err => alert(`Error removing item: ${err.message}`));
}

// // Update Cart Quantity
// function updateCartQuantity(docId, newQuantity) {
//   const cartRef = db.collection('users').doc(currentUser.uid).collection('cart').doc(docId);
//   if (newQuantity <= 0) {
//     cartRef.delete().then(() => loadCart());
//   } else {
//     cartRef.update({ quantity: newQuantity }).then(() => loadCart());
//   }
// }

// Add to Wishlist
function addToWishlist(productId, name) {
  if (!currentUser) {
    alert("Please login first!");
    return;
  }
  const wishlistRef = db.collection('wishlist').doc(`${currentUser.uid}_${productId}`);
  wishlistRef.get().then(doc => {
    if (doc.exists) {
      wishlistRef.update({
        quantity: doc.data().quantity + 1,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        alert(`${name} quantity updated in wishlist.`);
        loadWishlist();
      });
    } else {
      wishlistRef.set({
        userId: currentUser.uid,
        productId: productId,
        name: name,
        quantity: 1,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        alert(`${name} added to wishlist.`);
        loadWishlist();
      });
    }
  }).catch(err => alert(err.message));
}

// Load Wishlist
function loadWishlist() {
  if (!currentUser) {
    alert("Please login first!");
    return;
  }
  const wishlistListDiv = document.getElementById('wishlistList');
  wishlistListDiv.innerHTML = "";
  db.collection('wishlist').where("userId", "==", currentUser.uid).get()
    .then(snapshot => {
      if (snapshot.empty) wishlistListDiv.innerHTML = "Your wishlist is empty.";
      snapshot.forEach(doc => {
        const item = doc.data();
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('wishlist-item');
        itemDiv.innerHTML = `
          <strong>${item.name} x${item.quantity}</strong> (ID: ${item.productId})
          <br><button onclick="removeFromWishlist('${doc.id}')">Remove</button>
          <button onclick="addToCart('${item.productId}', '${item.name}')">Add to Cart</button>
        `;
        wishlistListDiv.appendChild(itemDiv);
      });
    })
    .catch(err => console.error(err));
}

// Remove from Wishlist (new feature)
function removeFromWishlist(docId) {
  db.collection('wishlist').doc(docId).delete()
    .then(() => {
      alert("Item removed from wishlist.");
      loadWishlist();
    })
    .catch(err => alert(`Error removing item: ${err.message}`));
}

// Place Order
function placeOrder() {
  if (!currentUser) {
    alert("Please login first!");
    return;
  }
  const userCartRef = db.collection('users').doc(currentUser.uid).collection('cart');
  userCartRef.get().then(snapshot => {
    if (snapshot.empty) {
      alert("Your cart is empty!");
      return;
    }
    let cartItems = [];
    snapshot.forEach(doc => cartItems.push({ id: doc.id, ...doc.data() })); // Convert QuerySnapshot to array
    console.log("Cart items array in placeOrder:", cartItems); // Debug log
    const variants = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      imageUrl: item.imageUrl
    }));
    const totalAmount = variants.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    db.collection('orders').add({
      userId: currentUser.uid,
      items: variants,
      totalAmount: totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      orderDate: firebase.firestore.FieldValue.serverTimestamp()
    }).then(orderRef => {
      currentOrder = { id: orderRef.id, totalAmount, cartItems }; // Store cartItems as array
      console.log("Current order set in placeOrder:", currentOrder); // Debug log
      document.getElementById('paymentAmount').innerText = totalAmount;
      document.getElementById('paymentModal').style.display = 'flex';
    }).catch(err => console.error("Error in placeOrder:", err));
  }).catch(err => console.error("Error fetching cart:", err));
}


// Add this new function to initiate checkout
function checkoutCart() {
  placeOrder(); // Reuse existing placeOrder to initiate the order
}

// Modify the existing processPayment function to include bill generation with improved error handling
function processPayment() {
  if (!currentOrder || !currentUser) {
    console.warn("currentOrder or currentUser is undefined in processPayment:", { currentOrder, currentUser });
    return;
  }
  const paymentMethod = document.getElementById('paymentMethod').value;
  const transactionId = `TXN${Date.now()}`;

  db.collection('orders').where("userId", "==", currentUser.uid).get()
    .then(snapshot => {
      const orderCount = snapshot.size;
      return db.collection('users').doc(currentUser.uid).get().then(userDoc => {
        const userData = userDoc.data();
        const userCredit = userData.credit || 0;

        let finalAmount = currentOrder.totalAmount;
        if (orderCount > 0 && userCredit > 0) {
          const useCredit = confirm(`You have ${userCredit} credits. Would you like to use them for this purchase? (Will deduct up to ${Math.min(userCredit, finalAmount)} credits)`);
          if (useCredit) {
            const creditToUse = Math.min(userCredit, finalAmount);
            finalAmount -= creditToUse;
            db.collection('users').doc(currentUser.uid).update({
              credit: firebase.firestore.FieldValue.increment(-creditToUse)
            });
            alert(`Applied ${creditToUse} credits. New total: $${finalAmount}`);
          }
        }

        setTimeout(() => {
          db.collection('payments').add({
            userId: currentUser.uid,
            orderId: currentOrder.id,
            amount: finalAmount,
            paymentMethod: paymentMethod,
            transactionId: transactionId,
            status: 'completed',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          }).then(() => {
            db.collection('orders').doc(currentOrder.id).update({
              status: 'confirmed',
              paymentStatus: 'paid',
              finalAmount: finalAmount
            });

            let totalCreditEarned = 0;
            currentOrder.cartItems.forEach(item => {
              db.collection('products').doc(item.productId).get().then(prodDoc => {
                const prod = prodDoc.data();
                totalCreditEarned += (prod.creditReward || 0) * item.quantity;
              });
            });

            setTimeout(() => {
              db.collection('users').doc(currentUser.uid).update({
                orderHistory: firebase.firestore.FieldValue.arrayUnion(currentOrder.id),
                credit: firebase.firestore.FieldValue.increment(totalCreditEarned)
              });

              currentOrder.cartItems.forEach(item => {
                const productId = item.productId;
                const quantity = item.quantity;
                db.collection('products').doc(productId).update({
                  stock: firebase.firestore.FieldValue.increment(-quantity),
                  availability: firebase.firestore.FieldValue.increment(-quantity)
                });
              });

              // Generate and download bill with error handling
              try {
                console.log("Current order before bill generation:", currentOrder); // Debug log
                const bill = generateBill();
                generateAndDownloadPDF(bill);
                console.log("Bill generated and download initiated:", bill.id);
              } catch (error) {
                console.error("Bill generation or download failed:", error);
                alert("Bill generation failed. Check console for details.");
              }

              currentOrder.cartItems.forEach(item => {
                db.collection('users').doc(currentUser.uid).collection('cart').doc(item.id).delete();
              });
              alert(`Payment successful! Order confirmed. You earned ${totalCreditEarned} credits.`);
              closeModal('paymentModal');
              loadCart();
              loadHistory();
              loadOrderTracking(currentOrder.id);
              loadProducts();
              currentOrder = null;
            }, 500);
          }).catch(err => alert("Payment failed: " + err.message));
        }, 1000);
      });
    })
    .catch(err => alert("Error processing payment: " + err.message));
}

// Update the generateBill function with validation and fallback
function generateBill() {
  if (!currentOrder || !currentOrder.cartItems) {
    throw new Error("Invalid order data. Current order or cart items not available.");
  }
  if (!Array.isArray(currentOrder.cartItems)) {
    console.warn("currentOrder.cartItems is not an array:", currentOrder.cartItems);
    throw new Error("currentOrder.cartItems is not an array. Expected an array of cart items.");
  }
  const userName = currentUser ? (currentUser.displayName || currentUser.email.split('@')[0] || "Guest") : "Unknown User";
  const paymentDate = new Date().toLocaleString();
  const billId = `BILL-${Date.now()}`;
  const totalAmount = currentOrder.cartItems.reduce((sum, item) => {
    const price = item.price || 0;
    const quantity = item.quantity || 0;
    return sum + (price * quantity);
  }, 0);

  const billContent = {
    id: billId,
    date: paymentDate,
    customer: userName,
    items: currentOrder.cartItems.map(item => ({
      name: item.name || "Unknown Product",
      price: item.price || 0,
      quantity: item.quantity || 1,
      subtotal: (item.price || 0) * (item.quantity || 1)
    })),
    total: totalAmount
  };

  console.log("Generated bill content:", billContent); // Debug log
  return billContent;
}
//function to generate and download the PDF bill with error handling
function generateAndDownloadPDF(bill) {
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      throw new Error("jsPDF library not loaded. Check the script inclusion in index.html.");
    }
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('HandTime E-Commerce Receipt', 105, 20, null, null, 'center');
    doc.setFontSize(12);
    doc.text(`Bill ID: ${bill.id}`, 20, 40);
    doc.text(`Date: ${bill.date}`, 20, 50);
    doc.text(`Customer: ${bill.customer}`, 20, 60);

    doc.setFontSize(14);
    doc.text('Items:', 20, 80);
    doc.autoTable({
      startY: 90,
      head: [['Product', 'Price', 'Quantity', 'Subtotal']],
      body: bill.items.map(item => [
        item.name,
        `$${item.price.toFixed(2)}`,
        item.quantity,
        `$${item.subtotal.toFixed(2)}`
      ]),
      theme: 'striped',
      margin: { top: 80 }
    });

    const finalY = doc.autoTable.previous.finalY + 10;
    doc.text(`Total Amount: $${bill.total.toFixed(2)}`, 20, finalY);

    doc.setFontSize(10);
    doc.text('Thank you for shopping with HandTime! Keep this receipt for your records.', 20, finalY + 10);

    doc.save(`HandTime_Bill_${bill.id}.pdf`);
    console.log("PDF saved successfully:", `HandTime_Bill_${bill.id}.pdf`);
  } catch (error) {
    console.error("Error generating or downloading PDF:", error);
    throw error; // Re-throw to be caught by the calling function
  }
}


// Load Order History
function loadHistory() {
  if (!currentUser) {
    alert("Please login first!");
    return;
  }
  const historyList = document.getElementById('historyList').querySelector('tbody');
  historyList.innerHTML = "";
  db.collection('orders').where("userId", "==", currentUser.uid).get()
    .then(snapshot => {
      if (snapshot.empty) historyList.innerHTML = "<tr><td colspan='5'>No orders yet.</td></tr>";
      snapshot.forEach(doc => {
        const order = doc.data();
        const orderDate = order.orderDate.toDate().toLocaleString();
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${doc.id}</td>
          <td>${orderDate}</td>
          <td>$${order.totalAmount}</td>
          <td>${order.paymentStatus}</td>
          <td><button onclick="loadOrderTracking('${doc.id}')">Track</button></td>
        `;
        historyList.appendChild(row);
      });
    })
    .catch(err => console.error(err));
}

// Load Order Tracking (new feature)
function loadOrderTracking(orderId) {
  db.collection('orders').doc(orderId).get()
    .then(doc => {
      if (doc.exists) {
        const order = doc.data();
        document.getElementById('trackOrderId').innerText = orderId;
        document.getElementById('trackStatus').innerText = order.status;
        document.getElementById('trackDelivery').innerText = order.status === 'confirmed' ? '3-5 days' : 'N/A'; // Placeholder delivery estimate
        document.getElementById('trackingModal').style.display = 'flex';
      } else {
        alert("Order not found!");
      }
    })
    .catch(err => alert(`Error tracking order: ${err.message}`));
}

// Load Product Recommendations (new feature - placeholder, needs personalization logic)
function loadRecommendations() {
  const recommendationsDiv = document.getElementById('recommendedProducts');
  recommendationsDiv.innerHTML = "Loading recommendations...";
  // Placeholder: Fetch based on user history or popular items
  db.collection('products').where('isActive', '==', true).limit(4).get()
    .then(snapshot => {
      recommendationsDiv.innerHTML = "";
      snapshot.forEach(doc => {
        const prod = doc.data();
        const productId = doc.id;
        const imageUrl = prod.imageURLs?.[0] || 'assets/images/nothing.png';
        const prodDiv = document.createElement('div');
        prodDiv.classList.add('product-card');
        prodDiv.innerHTML = `
          <img src="${imageUrl}" alt="${prod.name}" width="150" onerror="this.src='assets/images/nothing.png'">
          <h3>${prod.name}</h3>
          <p>Price: $${prod.discountPrice || prod.price || 'N/A'}</p>
          <button onclick="addToCart('${productId}', '${prod.name}')">Add to Cart</button>
        `;
        recommendationsDiv.appendChild(prodDiv);
      });
    })
    .catch(err => {
      console.error("Error loading recommendations:", err);
      recommendationsDiv.innerHTML = "Error loading recommendations.";
    });
}

// Logout
function logout() {
  auth.signOut().then(() => {
    currentUser = null;
    document.getElementById('userGreeting').innerText = "Hello, Guest";
    alert("Logged out successfully.");
    showSection('home');
    window.location.href = 'index.html';
  });
}

// Auth State Change
// Auth State Change
auth.onAuthStateChanged(user => {
  currentUser = user;
  const userGreeting = document.getElementById('userGreeting');
  const signInLink = document.getElementById('signInLink');
  const ordersLink = document.getElementById('ordersLink');
  const logoutLink = document.getElementById('logoutLink');

  if (user) {
    // Fetch user data to get the registered name
    db.collection('users').doc(user.uid).get()
      .then(doc => {
        if (doc.exists) {
          const userData = doc.data();
          userGreeting.innerText = userData.name; // Use name from registration
          signInLink.style.display = 'none';
          ordersLink.style.display = 'block';
          logoutLink.style.display = 'block';
          loadCart(); // Load cart on login
          loadWishlist();
          loadHistory();
        }
      });
  } else {
    userGreeting.innerText = "Sign In";
    signInLink.style.display = 'block';
    ordersLink.style.display = 'none';
    logoutLink.style.display = 'none';
  }
  loadCategoryCarousels();
  loadProducts(); // Load products on page load
  loadRecommendations(); // Load recommendations on page load
});

// Registration
document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const userData = {
    name: document.getElementById('regName').value,
    age: parseInt(document.getElementById('regAge').value),
    gender: document.getElementById('regGender').value,
    phone: document.getElementById('regPhone').value,
    dateOfBirth: document.getElementById('regDob').value,
    email: email,
    credit: 0,
    cart: [],
    orderHistory: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      currentUser = cred.user;
      document.getElementById('regMessage').innerText = "Registration successful!";
      return db.collection('users').doc(currentUser.uid).set(userData);
    })
    .then(() => {
      showSection('home');
      closeSignInDialog(); // Close the sign-in dialog
    })
    .catch(err => document.getElementById('regMessage').innerText = err.message);
});

// Login
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(cred => {
      currentUser = cred.user;
      document.getElementById('loginMessage').innerText = "Login successful!";
      showSection('home');
      closeSignInDialog(); // Close the sign-in dialog
    })
    .catch(err => document.getElementById('loginMessage').innerText = err.message);
});



// Logout
function logout() {
  auth.signOut().then(() => {
    currentUser = null;
    document.getElementById('userGreeting').innerText = "Sign In";
    alert("Logged out successfully.");
    showSection('home');
    window.location.href = 'index.html';
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showSection('home');
  document.getElementById('searchInput').addEventListener('keyup', searchProducts); // Real-time search
});


// Existing Firebase config and initialization remain unchanged

// ... (Keep existing auth state change, logout, etc.)

// Load Carousel Products
// Load Category-Based Carousels with Debugging
function loadCategoryCarousels() {
  const categoryCarousels = document.getElementById('categoryCarousels');
  if (!categoryCarousels) {
    console.error("categoryCarousels element not found. Check index.html for <div id='categoryCarousels'>");
    return;
  }
  categoryCarousels.innerHTML = '<div id="loading">Loading products...</div>';

  const categories = ['electronics', 'fashion', 'furniture', 'cosmetics', 'foodAndHealth'];
  categoryCarousels.innerHTML = '';

  categories.forEach((category, index) => {
    const carouselSection = document.createElement('section');
    carouselSection.className = 'product-carousel';
    carouselSection.innerHTML = `
      <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
      <button class="carousel-btn prev" onclick="scrollCarousel('prev', ${index})">❮</button>
      <div class="carousel-container" id="carousel-${index}"></div>
      <button class="carousel-btn next" onclick="scrollCarousel('next', ${index})">❯</button>
    `;
    categoryCarousels.appendChild(carouselSection);

    const carouselContainer = document.getElementById(`carousel-${index}`);
    db.collection('products')
      .where('isActive', '==', true)
      .where('category', '==', category)
      .limit(10)
      .get()
      .then(snapshot => {
        console.log(`Fetched ${snapshot.size} products for ${category}`);
        if (snapshot.empty) {
          carouselContainer.innerHTML = `<p>No products available in ${category}.</p>`;
          return;
        }

        carouselContainer.innerHTML = ''; // Clear any loading or error messages
        snapshot.forEach(doc => {
          const product = doc.data();
          console.log(`Processing product: ${product.name}, Category: ${product.category}`);
          const item = document.createElement('div');
          item.className = 'carousel-item';
          item.innerHTML = `
            <img src="${product.imageURLs?.[0] || 'https://picsum.photos/150/150'}" alt="${product.name}">
            <h4>${product.name}</h4>
            <p>$${product.discountPrice || product.price || 'N/A'}</p>
            <button onclick="addToCart('${doc.id}', '${product.name}')">Add to Cart</button>
          `;
          carouselContainer.appendChild(item);
        });
      })
      .catch(err => {
        console.error(`Error loading ${category} products:`, err);
        carouselContainer.innerHTML = `<p>Error loading ${category} products: ${err.message}</p>`;
      });
  });

  // Fallback if no products load
  setTimeout(() => {
    if (categoryCarousels.children.length === 0 || categoryCarousels.innerHTML === '<div id="loading">Loading products...</div>') {
      categoryCarousels.innerHTML = '<p>No products available for display.</p>';
    }
  }, 5000);
}

// Scroll Carousel
// Scroll Carousel (Updated for multiple carousels)
function scrollCarousel(direction, carouselIndex) {
  const container = document.getElementById(`carousel-${carouselIndex}`);
  if (!container) {
    console.error(`Carousel container with ID carousel-${carouselIndex} not found.`);
    return;
  }
  const scrollAmount = 220; // Adjust based on item width + margin
  if (direction === 'prev') {
    container.scrollLeft -= scrollAmount;
  } else {
    container.scrollLeft += scrollAmount;
  }
}

// Sign In Dialog
function showSignInDialog() {
  document.getElementById('signInDialog').style.display = 'flex';
}

function closeSignInDialog() {
  document.getElementById('signInDialog').style.display = 'none';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showSection('home');
  loadCarouselProducts(); // Load carousel on page load
  document.getElementById('searchInput').addEventListener('keyup', searchProducts); // Real-time search
});


// Existing code above (e.g., Firebase initialization, auth.onAuthStateChanged, loadCategoryCarousels, etc.) remains unchanged.

// Enhanced Search Functionality
function searchProducts() {
  const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!searchInput) {
    alert("Please enter a search term.");
    return;
  }

  const productsList = document.getElementById('productsList');
  productsList.innerHTML = '<div>Loading search results...</div>';

  // Clear filters to avoid conflicts with search
  document.getElementById('categoryFilter').value = 'all';
  document.getElementById('priceMin').value = '';
  document.getElementById('priceMax').value = '';
  document.getElementById('sortBy').value = 'priceLow';

  // Query Firestore for products matching the search term in name or category
  db.collection('products')
    .where('isActive', '==', true)
    .get()
    .then(snapshot => {
      const filteredProducts = [];
      snapshot.forEach(doc => {
        const product = doc.data();
        const name = product.name ? product.name.toLowerCase() : '';
        const category = product.category ? product.category.toLowerCase() : '';
        if (name.includes(searchInput) || category.includes(searchInput)) {
          filteredProducts.push({ id: doc.id, ...product });
        }
      });

      // Display search results
      productsList.innerHTML = '';
      if (filteredProducts.length === 0) {
        productsList.innerHTML = '<p>No products found matching your search.</p>';
      } else {
        filteredProducts.forEach(product => {
          const item = document.createElement('div');
          item.className = 'product-item';
          item.innerHTML = `
            <img src="${product.imageURLs?.[0] || 'https://picsum.photos/150/150'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>$${product.discountPrice || product.price || 'N/A'}</p>
            <button onclick="addToCart('${product.id}', '${product.name}')">Add to Cart</button>
            <button onclick="addToWishlist('${product.id}', '${product.name}')">Add to Wishlist</button>
          `;
          productsList.appendChild(item);
        });
      }

      // Navigate to the Products section
      showSection('products');
    })
    .catch(err => {
      console.error('Error searching products:', err);
      productsList.innerHTML = `<p>Error loading search results: ${err.message}</p>`;
    });
}

// Update loadProducts to display all products by default
function loadProducts() {
  const productsList = document.getElementById('productsList');
  if (!productsList) {
    console.error("productsList element not found. Check index.html for <div id='productsList'>");
    return;
  }
  productsList.innerHTML = '<div>Loading products...</div>';

  db.collection('products')
    .where('isActive', '==', true)
    .get()
    .then(snapshot => {
      productsList.innerHTML = '';
      if (snapshot.empty) {
        productsList.innerHTML = '<p>No products available.</p>';
        return;
      }

      snapshot.forEach(doc => {
        const product = doc.data();
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
          <img src="${product.imageURLs?.[0] || 'https://picsum.photos/150/150'}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p>$${product.discountPrice || product.price || 'N/A'}</p>
          <button onclick="addToCart('${doc.id}', '${product.name}')">Add to Cart</button>
          <button onclick="addToWishlist('${doc.id}', '${product.name}')">Add to Wishlist</button>
        `;
        productsList.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error loading products:', err);
      productsList.innerHTML = `<p>Error loading products: ${err.message}</p>`;
    });
}

// Update applyFilters to work with search results (optional enhancement)
function applyFilters() {
  const categoryFilter = document.getElementById('categoryFilter').value;
  const priceMin = parseFloat(document.getElementById('priceMin').value) || 0;
  const priceMax = parseFloat(document.getElementById('priceMax').value) || Infinity;
  const sortBy = document.getElementById('sortBy').value;
  const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();

  const productsList = document.getElementById('productsList');
  productsList.innerHTML = '<div>Loading filtered products...</div>';

  let query = db.collection('products').where('isActive', '==', true);
  query.get()
    .then(snapshot => {
      let filteredProducts = [];
      snapshot.forEach(doc => {
        const product = doc.data();
        const name = product.name ? product.name.toLowerCase() : '';
        const category = product.category ? product.category.toLowerCase() : '';
        const price = parseFloat(product.discountPrice || product.price || 0);

        // Apply search filter
        const matchesSearch = !searchInput || name.includes(searchInput) || category.includes(searchInput);

        // Apply category filter
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

        // Apply price filter
   
        
        const matchesPrice = price >= priceMin && price <= priceMax;

        if (matchesSearch && matchesCategory && matchesPrice) {
          filteredProducts.push({ id: doc.id, ...product });
        }
      });

      // Apply sorting
      filteredProducts.sort((a, b) => {
        const priceA = parseFloat(a.discountPrice || a.price || 0);
        const priceB = parseFloat(b.discountPrice || b.price || 0);
        return sortBy === 'priceLow' ? priceA - priceB : priceB - priceA;
      });

      // Display filtered products
      productsList.innerHTML = '';
      if (filteredProducts.length === 0) {
        productsList.innerHTML = '<p>No products found matching your criteria.</p>';
      } else {
        filteredProducts.forEach(product => {
          const item = document.createElement('div');
          item.className = 'product-item';
          item.innerHTML = `
            <img src="${product.imageURLs?.[0] || 'https://picsum.photos/150/150'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>$${product.discountPrice || product.price || 'N/A'}</p>
            <button onclick="addToCart('${product.id}', '${product.name}')">Add to Cart</button>
            <button onclick="addToWishlist('${product.id}', '${product.name}')">Add to Wishlist</button>
          `;
          productsList.appendChild(item);
        });
      }
    })
    .catch(err => {
      console.error('Error applying filters:', err);
      productsList.innerHTML = `<p>Error loading products: ${err.message}</p>`;
    });
}

// Placeholder functions (ensure these exist or implement them)
function addToWishlist(productId, name) {
  console.log(`Added ${name} (ID: ${productId}) to wishlist`);
}


// Existing functions (loadCategoryCarousels, scrollCarousel, etc.) remain unchanged.