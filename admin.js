// admin.js
// Read global config
const config = window.firebaseConfig;

// Initialize Firebase
let app, auth, db;

try {
  if (config && config.apiKey && config.apiKey !== "YOUR_API_KEY") {
    app = firebase.initializeApp(config);
    auth = firebase.auth(app);
    db = firebase.firestore(app);
  }
} catch (err) {
  console.error("Firebase Initialization failed in admin panel:", err);
  alert("Firebase configuration failed to load. Please configure firebase-config.js correctly.");
}

// Dom elements
const lockScreen = document.getElementById('lockScreen');
const adminUserEmail = document.getElementById('adminUserEmail');
const logoutBtn = document.getElementById('logoutBtn');
const postForm = document.getElementById('postForm');
const postIdInput = document.getElementById('postId');
const postTitleInput = document.getElementById('postTitle');
const postCategorySelect = document.getElementById('postCategory');
const postSnippetInput = document.getElementById('postSnippet');
const postContentInput = document.getElementById('postContent');
const postImageUrlInput = document.getElementById('postImageUrl');
const imagePreview = document.getElementById('imagePreview');
const savePostBtn = document.getElementById('savePostBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const postsTableBody = document.getElementById('postsTableBody');
const formTitle = document.getElementById('formTitle');
const formSubTitle = document.getElementById('formSubTitle');

// 1. Session state watcher
if (auth) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is authenticated
      adminUserEmail.textContent = user.email;
      if (lockScreen) lockScreen.style.display = 'none';
      loadPosts();
      loadBookings();
    } else {
      // User is unauthenticated, redirect to login page
      window.location.href = 'login.html';
    }
  });
} else {
  // Bypassed if firebase fails
  if (lockScreen) lockScreen.innerHTML = '<div style="color: red; padding: 2rem;">Firebase Not Connected. Check config files.</div>';
}

// 2. Logout handler
if (logoutBtn && auth) {
  logoutBtn.addEventListener('click', () => {
    auth.signOut()
      .then(() => {
        window.location.href = 'login.html';
      })
      .catch((err) => {
        console.error("Logout failed:", err);
      });
  });
}

// 3. Category Label helper
function getCategoryLabel(cat) {
  const labels = {
    advice: "Educational Advice",
    placement: "School Placement",
    care: "Pastoral Care & Guardianship",
    assessments: "Academic Assessments"
  };
  return labels[cat] || "General";
}

// 4. Load posts from Firestore
async function loadPosts() {
  if (!db) return;
  postsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading published articles...</td></tr>';
  
  try {
    const querySnapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
    
    postsTableBody.innerHTML = '';
    
    if (querySnapshot.empty) {
      postsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--color-text-muted);">No articles published yet. Publish your first post using the editor panel!</td></tr>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      const title = data.title;
      const category = getCategoryLabel(data.category);
      
      let dateStr = data.date;
      if (data.createdAt && data.createdAt.seconds) {
        dateStr = new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600; color: var(--color-primary);">${title}</td>
        <td><span class="blog-tag" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; cursor: default;">${category}</span></td>
        <td style="color: var(--color-text-muted);">${dateStr || "Recent"}</td>
        <td style="text-align: right;">
          <div class="action-btn-group" style="justify-content: flex-end;">
            <button type="button" class="btn btn-secondary btn-icon edit-btn" data-id="${id}">Edit</button>
            <button type="button" class="btn btn-icon btn-danger delete-btn" data-id="${id}">Delete</button>
          </div>
        </td>
      `;
      
      // Wire up Actions
      tr.querySelector('.edit-btn').addEventListener('click', () => editPost(id, data));
      tr.querySelector('.delete-btn').addEventListener('click', () => deletePost(id, title));
      
      postsTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Firestore loading error:", err);
    postsTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Failed to retrieve collection: ${err.message}</td></tr>`;
  }
}

// 5. Delete post action
async function deletePost(id, title) {
  if (!confirm(`Are you sure you want to delete the article "${title}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    await db.collection("posts").doc(id).delete();
    loadPosts();
  } catch (err) {
    console.error("Failed to delete post:", err);
    alert(`Error deleting document: ${err.message}`);
  }
}

// 6. Edit post trigger
function editPost(id, data) {
  postIdInput.value = id;
  postTitleInput.value = data.title;
  postCategorySelect.value = data.category;
  postSnippetInput.value = data.snippet;
  postContentInput.value = data.content;
  postImageUrlInput.value = data.imageUrl || '';
  
  if (data.imageUrl) {
    imagePreview.src = data.imageUrl;
    imagePreview.style.display = 'block';
  } else {
    imagePreview.style.display = 'none';
    imagePreview.src = '';
  }
  
  formTitle.textContent = "Edit Post";
  formSubTitle.textContent = "Modify publication details and save changes.";
  cancelEditBtn.style.display = 'inline-flex';
  
  // Smooth scroll to form
  document.getElementById('editorPanel').scrollIntoView({ behavior: 'smooth' });
}

// 7. Cancel edit panel trigger
cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

function resetForm() {
  postForm.reset();
  postIdInput.value = '';
  postImageUrlInput.value = '';
  imagePreview.style.display = 'none';
  imagePreview.src = '';
  
  formTitle.textContent = "Create New Post";
  formSubTitle.textContent = "Write a new educational article for the site feed.";
  cancelEditBtn.style.display = 'none';
}

// 8. Handle Image URL Change & Presets
if (postImageUrlInput) {
  postImageUrlInput.addEventListener('input', () => {
    updatePreview(postImageUrlInput.value);
  });
}

function updatePreview(url) {
  if (url) {
    imagePreview.src = url;
    imagePreview.style.display = 'block';
  } else {
    imagePreview.style.display = 'none';
    imagePreview.src = '';
  }
}

// Bind preset button clicks
const presetContainer = document.getElementById('presetContainer');
if (presetContainer) {
  presetContainer.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (url) {
        postImageUrlInput.value = url;
        updatePreview(url);
      }
    });
  });
}

// 9. Save Post Submit handler
if (postForm && db) {
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!postForm.checkValidity()) {
      postForm.reportValidity();
      return;
    }

    const id = postIdInput.value;
    const title = postTitleInput.value;
    const category = postCategorySelect.value;
    const snippet = postSnippetInput.value;
    const content = postContentInput.value;
    const imageUrl = postImageUrlInput.value || 'hero_bg.png'; // default fallback

    const postData = {
      title,
      category,
      snippet,
      content,
      imageUrl,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    savePostBtn.disabled = true;
    savePostBtn.textContent = 'Saving publication...';

    try {
      if (id) {
        // Update Mode
        await db.collection("posts").doc(id).update(postData);
        alert("Publication modified successfully!");
      } else {
        // Create Mode
        postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection("posts").add(postData);
        alert("New article published successfully!");
      }
      
      resetForm();
      loadPosts();
    } catch (err) {
      console.error("Error writing document to firestore:", err);
      alert(`Save failed: ${err.message}`);
    } finally {
      savePostBtn.disabled = false;
      savePostBtn.textContent = 'Save Post';
    }
  });
}

// 10. Consultation Bookings management
const bookingsTableBody = document.getElementById('bookingsTableBody');

async function loadBookings() {
  if (!bookingsTableBody) return;
  bookingsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading booking requests...</td></tr>';
  
  let firebaseBookings = [];
  let firebaseLoadFailed = false;

  if (db) {
    try {
      const querySnapshot = await db.collection("bookings").orderBy("createdAt", "desc").get();
      querySnapshot.forEach((docSnap) => {
        firebaseBookings.push({
          id: docSnap.id,
          data: docSnap.data(),
          isLocal: false
        });
      });
    } catch (err) {
      console.error("Error loading bookings from Firestore:", err);
      firebaseLoadFailed = true;
    }
  }

  // Load from local storage
  const localBookingsList = [];
  try {
    const localBookings = JSON.parse(localStorage.getItem('rich_schools_bookings') || '[]');
    localBookings.forEach((data, index) => {
      localBookingsList.push({
        id: index,
        data: data,
        isLocal: true
      });
    });
  } catch (err) {
    console.error("Error loading bookings from LocalStorage:", err);
  }

  bookingsTableBody.innerHTML = '';

  if (firebaseBookings.length === 0 && localBookingsList.length === 0) {
    const defaultMsg = firebaseLoadFailed 
      ? 'Error reading cloud database. No local bookings found.'
      : 'No consultation bookings received yet.';
    bookingsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted);">${defaultMsg}</td></tr>`;
    return;
  }

  // Render cloud bookings
  firebaseBookings.forEach(item => {
    renderBookingRow(item.id, item.data, false);
  });

  // Render local bookings (sort descending by date)
  localBookingsList.sort((a, b) => new Date(b.data.createdAt) - new Date(a.data.createdAt));
  localBookingsList.forEach(item => {
    renderBookingRow(item.id, item.data, true);
  });
}

function renderBookingRow(id, data, isLocal = false) {
  const tr = document.createElement('tr');
  
  let dateStr = "Recent";
  if (data.createdAt) {
    // Check if Timestamp object
    const d = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
    if (!isNaN(d.getTime())) {
      dateStr = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
  
  tr.innerHTML = `
    <td style="font-weight: 600; color: var(--color-primary);">${data.name || 'Anonymous'}</td>
    <td>
      <div style="font-size: 0.9rem; font-weight: 500; color: var(--color-text);">${data.email || 'N/A'}</div>
      <div style="font-size: 0.85rem; color: var(--color-text-muted);">${data.phone || 'N/A'}</div>
    </td>
    <td>
      <span class="blog-tag" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; cursor: default;">${data.service || 'Advice'}</span>
      ${isLocal ? '<span style="display: block; font-size: 0.75rem; color: var(--color-accent); margin-top: 0.25rem; font-weight: 600;">Offline Cache</span>' : ''}
    </td>
    <td>
      <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-text);">${data.format || 'Virtual'}</div>
      <div style="font-size: 0.85rem; color: var(--color-text-muted);">${data.date || 'TBD'} at ${data.time || 'TBD'}</div>
    </td>
    <td style="font-size: 0.85rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${data.notes || ''}">${data.notes || '<span style="color: var(--color-text-muted);">None</span>'}</td>
    <td style="text-align: right;">
      <button type="button" class="btn btn-icon btn-danger delete-booking-btn">Delete</button>
    </td>
  `;
  
  tr.querySelector('.delete-booking-btn').addEventListener('click', () => deleteBooking(id, data.name, isLocal));
  bookingsTableBody.appendChild(tr);
}

async function deleteBooking(id, name, isLocal) {
  if (!confirm(`Are you sure you want to remove the booking request for "${name}"?`)) {
    return;
  }
  
  if (!isLocal && db) {
    try {
      await db.collection("bookings").doc(id).delete();
      loadBookings();
    } catch (err) {
      console.error("Failed to delete booking from Firestore:", err);
      alert(`Error deleting booking: ${err.message}`);
    }
  } else {
    const localBookings = JSON.parse(localStorage.getItem('rich_schools_bookings') || '[]');
    localBookings.splice(id, 1);
    localStorage.setItem('rich_schools_bookings', JSON.stringify(localBookings));
    loadBookingsFromLocalStorage();
  }
}
