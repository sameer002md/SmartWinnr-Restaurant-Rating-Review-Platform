import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api";

const emptyRestaurant = {
  name: "",
  location: "",
  cuisine: "",
  description: "",
  address: "",
  phone: "",
};

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [restaurants, setRestaurants] = useState([]);
  const [stats, setStats] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [adminUsers, setAdminUsers] = useState([]);
  const [ownerAccountForm, setOwnerAccountForm] = useState({ name: "", email: "", password: "" });
  const [owners, setOwners] = useState([]);
  const [ownerRestaurants, setOwnerRestaurants] = useState([]);
  const [ownerReviews, setOwnerReviews] = useState([]);
  const [selectedOwnerRestaurant, setSelectedOwnerRestaurant] = useState(null);
  const [ownerForm, setOwnerForm] = useState({ description: "", address: "", phone: "" });
  const [page, setPage] = useState("login");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const role = String(user?.role || "").toLowerCase();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token && user) {
      setPage("dashboard");
      loadRestaurants("", token);
      if (role === "admin") {
        loadDashboardStats(token);
        loadOwners(token);
      }
      if (role === "owner") loadOwnerRestaurants(token);
    }
    // Initial session restoration only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRestaurants = async (query = search, authToken = token) => {
    try {
      const response = await axios.get(`${API}/restaurants?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setRestaurants(response.data.restaurants || []);
    } catch (error) {
      console.error("Restaurant loading:", error.response?.data || error);
      setMessage(error.response?.data?.message || "Unable to load restaurants.");
    }
  };

  const loadDashboardStats = async (authToken = token) => {
    try {
      const response = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error("Dashboard statistics:", error.response?.data || error);
      setMessage(error.response?.data?.message || "Unable to load statistics.");
    }
  };

  const loadAdminReviews = async (authToken = token) => {
    try {
      const response = await axios.get(`${API}/reviews/admin`, { headers: { Authorization: `Bearer ${authToken}` } });
      setAdminReviews(response.data.reviews || []);
      setPage("adminReviews");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load reviews for moderation.");
    }
  };

  const loadAdminUsers = async (authToken = token) => {
    try {
      const response = await axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${authToken}` } });
      setAdminUsers(response.data.users || []);
      setPage("adminUsers");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load users.");
    }
  };

  const createOwnerAccount = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`${API}/admin/users/owners`, ownerAccountForm, { headers });
      setOwnerAccountForm({ name: "", email: "", password: "" });
      setMessage("Restaurant owner account created successfully.");
      await loadOwners();
      await loadAdminUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to create owner account.");
    } finally { setLoading(false); }
  };

  const toggleUserStatus = async (account) => {
    try {
      setLoading(true);
      await axios.patch(`${API}/admin/users/${account._id}/status`, { isActive: !account.isActive }, { headers });
      setMessage(`User ${account.isActive ? "deactivated" : "activated"} successfully.`);
      await loadAdminUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update user status.");
    } finally { setLoading(false); }
  };

  const removeAdminReview = async (review) => {
    if (!window.confirm("Remove this review? This action cannot be undone.")) return;
    try {
      setLoading(true);
      await axios.delete(`${API}/reviews/admin/${review._id}`, { headers });
      setAdminReviews((current) => current.filter((item) => item._id !== review._id));
      setMessage("Review removed successfully.");
      await loadDashboardStats();
      await loadRestaurants(search);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to remove review.");
    } finally { setLoading(false); }
  };

  const beginEditReview = (review) => {
    setEditingReviewId(review._id);
    setReviewForm({ rating: review.rating, comment: review.comment });
  };

  const saveReviewEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(`${API}/reviews/${editingReviewId}`, { rating: Number(reviewForm.rating), comment: reviewForm.comment }, { headers });
      setMessage("Review updated successfully.");
      setEditingReviewId(null);
      await loadMyReviews();
      await loadRestaurants(search);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update review.");
    } finally { setLoading(false); }
  };

  const removeMyReview = async (review) => {
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    try {
      setLoading(true);
      await axios.delete(`${API}/reviews/${review._id}`, { headers });
      setMyReviews((current) => current.filter((item) => item._id !== review._id));
      setMessage("Your review was deleted successfully.");
      await loadRestaurants(search);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete review.");
    } finally { setLoading(false); }
  };

  const loadOwners = async (authToken = token) => {
    try {
      const response = await axios.get(`${API}/admin/users?role=owner`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setOwners(response.data.users || []);
    } catch (error) {
      console.error("Owner loading:", error.response?.data || error);
      setMessage(error.response?.data?.message || "Unable to load owners.");
    }
  };

  const loadOwnerRestaurants = async (authToken = token) => {
    try {
      const response = await axios.get(`${API}/restaurants/owner/my-restaurants`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setOwnerRestaurants(response.data.restaurants || []);
    } catch (error) {
      console.error("Owner restaurants:", error.response?.data || error);
      setMessage(error.response?.data?.message || "Unable to load your restaurants.");
    }
  };

  const loadOwnerReviews = async (restaurantId, authToken = token) => {
    try {
      const response = await axios.get(`${API}/restaurants/owner/${restaurantId}/reviews`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setOwnerReviews(response.data.reviews || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load restaurant reviews.");
    }
  };

  const selectOwnerRestaurant = async (restaurant) => {
    setSelectedOwnerRestaurant(restaurant);
    setOwnerForm({
      description: restaurant.description || "",
      address: restaurant.address || "",
      phone: restaurant.phone || "",
    });
    await loadOwnerReviews(restaurant._id);
  };

  const updateOwnerRestaurant = async (e) => {
    e.preventDefault();
    if (!selectedOwnerRestaurant) return;
    try {
      setLoading(true);
      setMessage("");
      await axios.put(`${API}/restaurants/owner/${selectedOwnerRestaurant._id}`, ownerForm, { headers });
      setMessage("Restaurant details updated successfully!");
      await loadOwnerRestaurants();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update restaurant.");
    } finally {
      setLoading(false);
    }
  };

  const assignOwner = async (restaurant, ownerId) => {
    if (!ownerId) return;
    try {
      setLoading(true);
      setMessage("");
      await axios.put(`${API}/restaurants/${restaurant._id}/assign-owner`, { ownerId }, { headers });
      setMessage(ownerId ? `Owner assigned to ${restaurant.name} successfully!` : `Owner selection cleared for ${restaurant.name}.`);
      await loadRestaurants(search);
      await loadOwners();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to assign owner.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const data = response.data;
      const loggedUser = data.user || data.data?.user;
      const accessToken = data.token || data.data?.token;
      if (!loggedUser || !accessToken) {
        setMessage("Login response is missing user or token.");
        return;
      }
      localStorage.setItem("user", JSON.stringify(loggedUser));
      localStorage.setItem("token", accessToken);
      setUser(loggedUser);
      setToken(accessToken);
      setPage("dashboard");
      const loggedRole = String(loggedUser.role).toLowerCase();
      await loadRestaurants("", accessToken);
      if (loggedRole === "admin") {
        await loadDashboardStats(accessToken);
        await loadOwners(accessToken);
      }
      if (loggedRole === "owner") await loadOwnerRestaurants(accessToken);
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`${API}/auth/register`, { name, email, password });
      setMessage("Registration successful! Please login.");
      setPage("login");
      setName("");
      setPassword("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken("");
    setRestaurants([]);
    setStats(null);
    setOwners([]);
    setOwnerRestaurants([]);
    setOwnerReviews([]);
    setSelectedOwnerRestaurant(null);
    setMyReviews([]);
    setPage("login");
    setMessage("");
    setSelected(null);
    setShowForm(false);
    setSearch("");
    setEmail("");
    setPassword("");
  };

  const openAddForm = () => {
    setEditingId(null);
    setRestaurantForm(emptyRestaurant);
    setShowForm(true);
    setMessage("");
  };

  const openEditForm = (restaurant) => {
    setEditingId(restaurant._id);
    setRestaurantForm({
      name: restaurant.name || "",
      location: restaurant.location || "",
      cuisine: restaurant.cuisine || "",
      description: restaurant.description || "",
      address: restaurant.address || "",
      phone: restaurant.phone || "",
    });
    setShowForm(true);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRestaurantChange = (e) => {
    const { name: fieldName, value } = e.target;
    setRestaurantForm((previous) => ({ ...previous, [fieldName]: value }));
  };

  const saveRestaurant = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      if (editingId) {
        await axios.put(`${API}/restaurants/${editingId}`, restaurantForm, { headers });
        setMessage("Restaurant updated successfully!");
      } else {
        await axios.post(`${API}/restaurants`, restaurantForm, { headers });
        setMessage("Restaurant added successfully!");
      }
      setRestaurantForm(emptyRestaurant);
      setEditingId(null);
      setShowForm(false);
      await loadRestaurants(search);
      await loadDashboardStats();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save restaurant.");
    } finally {
      setLoading(false);
    }
  };

  const deleteRestaurant = async (restaurant) => {
    if (!window.confirm(`Are you sure you want to remove "${restaurant.name}"?`)) return;
    try {
      setLoading(true);
      setMessage("");
      await axios.delete(`${API}/restaurants/${restaurant._id}`, { headers });
      setMessage("Restaurant removed successfully!");
      if (editingId === restaurant._id) {
        setShowForm(false);
        setEditingId(null);
        setRestaurantForm(emptyRestaurant);
      }
      await loadRestaurants(search);
      await loadDashboardStats();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete restaurant.");
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`${API}/reviews`, {
        restaurantId: selected._id,
        rating: Number(rating),
        comment,
      }, { headers });
      setMessage("Review submitted successfully!");
      setSelected(null);
      setComment("");
      setRating(5);
      await loadRestaurants(search);
    } catch (error) {
      setMessage(error.response?.data?.message || "Review submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadMyReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews/my-reviews`, { headers });
      setMyReviews(response.data.reviews || response.data.data || []);
      setPage("myReviews");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load reviews.");
    }
  };

  if (!user || !token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>SmartWinnr</h1>
          <p className="subtitle">Restaurant Rating &amp; Review Platform</p>
          <h2>{page === "register" ? "Create Account" : "Welcome Back"}</h2>
          <form onSubmit={page === "register" ? handleRegister : handleLogin}>
            {page === "register" && (
              <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            )}
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : page === "register" ? "Register" : "Login"}
            </button>
          </form>
          <p className="switch-text">
            {page === "register" ? "Already have an account?" : "Don't have an account?"}
            <span onClick={() => { setMessage(""); setPage(page === "register" ? "login" : "register"); }}>
              {page === "register" ? " Login" : " Register"}
            </span>
          </p>
          {message && <p className="message">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="navbar">
        <h2>SmartWinnr</h2>
        <div>
          <span>{user.name} ({role.toUpperCase()})</span>
          <button className="logout" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="container">
        <h1>{role === "admin" ? "Admin Dashboard" : role === "owner" ? "Restaurant Owner Dashboard" : "Discover Restaurants"}</h1>
        <p className="welcome">Welcome back, {user.name}!</p>

        {role === "admin" && (
          <section className="admin-section">
            <div className="section-heading">
              <div><h2>Platform Overview</h2><p>Live statistics from your SmartWinnr database</p></div>
              <button onClick={() => loadDashboardStats()}>Refresh Stats</button>
            </div>
            {stats && (
              <div className="stats-grid">
                {[
                  ["👥", "Total Users", stats.totalUsers],
                  ["🍽️", "Restaurants", stats.totalRestaurants],
                  ["📝", "Total Reviews", stats.totalReviews],
                  ["⭐", "Average Rating", `${Number(stats.averageRating).toFixed(2)} / 5`],
                  ["🧑", "Customers", stats.totalCustomers],
                  ["🏪", "Restaurant Owners", stats.totalOwners],
                ].map(([icon, label, value]) => (
                  <div className="stat-card" key={label}>
                    <span className="stat-icon purple">{icon}</span><p>{label}</p><h2>{value}</h2><small>Live database data</small>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {role === "admin" && (
          <section className="admin-management">
            <div className="section-heading">
              <div><h2>Restaurant Management</h2><p>Add, update and manage restaurant information</p></div>
              <button onClick={openAddForm}>+ Add Restaurant</button>
            </div>
            {showForm && (
              <section className="restaurant-form-card">
                <h2>{editingId ? "Edit Restaurant" : "Add New Restaurant"}</h2>
                <form onSubmit={saveRestaurant} className="restaurant-form">
                  <input name="name" placeholder="Restaurant Name *" value={restaurantForm.name} onChange={handleRestaurantChange} required />
                  <input name="location" placeholder="Location *" value={restaurantForm.location} onChange={handleRestaurantChange} required />
                  <input name="cuisine" placeholder="Cuisine *" value={restaurantForm.cuisine} onChange={handleRestaurantChange} required />
                  <input name="address" placeholder="Full Address" value={restaurantForm.address} onChange={handleRestaurantChange} />
                  <input name="phone" placeholder="Phone Number" value={restaurantForm.phone} onChange={handleRestaurantChange} />
                  <textarea name="description" placeholder="Restaurant Description" value={restaurantForm.description} onChange={handleRestaurantChange} />
                  <div className="form-actions">
                    <button type="submit" disabled={loading}>{loading ? "Saving..." : editingId ? "Update Restaurant" : "Create Restaurant"}</button>
                    <button type="button" className="cancel" onClick={() => { setShowForm(false); setEditingId(null); setRestaurantForm(emptyRestaurant); }}>Cancel</button>
                  </div>
                </form>
              </section>
            )}
          </section>
        )}

        {(role === "customer" || role === "admin") && (
          <div className="toolbar">
            <input placeholder="Search restaurants by name, location or cuisine..." value={search} onChange={(e) => { setSearch(e.target.value); loadRestaurants(e.target.value); }} />
            {role === "customer" && <button onClick={loadMyReviews}>My Reviews</button>}
            <button onClick={() => loadRestaurants(search)}>Refresh</button>
          </div>
        )}

        {selected && role === "customer" && (
          <section className="review-panel">
            <h2>Review {selected.name}</h2>
            <form onSubmit={submitReview}>
              <label>Rating</label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>)}
              </select>
              <textarea placeholder="Share your dining experience..." value={comment} onChange={(e) => setComment(e.target.value)} minLength={3} required />
              <button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Review"}</button>
              <button type="button" className="cancel" onClick={() => setSelected(null)}>Cancel</button>
            </form>
          </section>
        )}

        {(role === "customer" || role === "admin") && page === "dashboard" && (
          <>
            <h2 className="directory-heading">{role === "admin" ? "Restaurant Directory" : "Explore Restaurants"}</h2>
            <div className="restaurant-grid">
              {restaurants.map((restaurant) => (
                <article className="restaurant-card" key={restaurant._id}>
                  <div className="restaurant-icon">🍽️</div>
                  <h2>{restaurant.name}</h2>
                  <p>{restaurant.cuisine || "Cuisine not specified"}</p>
                  <p>📍 {restaurant.location}</p>
                  <p>{restaurant.description}</p>
                  <p>⭐ {Number(restaurant.averageRating || 0).toFixed(1)} / 5 ({restaurant.totalReviews || 0} reviews)</p>
                  {role === "customer" && <button onClick={() => setSelected(restaurant)}>Write a Review</button>}
                  {role === "admin" && (
                    <>
                      <div className="owner-assignment">
                        <label>Assign Restaurant Owner</label>
                        <select value={restaurant.owner?._id || ""} onChange={(e) => assignOwner(restaurant, e.target.value)} disabled={loading}>
                          <option value="">Unassigned</option>
                          {owners.map((owner) => <option key={owner._id} value={owner._id}>{owner.name} ({owner.email})</option>)}
                        </select>
                      </div>
                      <div className="restaurant-actions">
                        <button onClick={() => openEditForm(restaurant)}>Edit</button>
                        <button className="delete-button" onClick={() => deleteRestaurant(restaurant)} disabled={loading}>Delete</button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
            {restaurants.length === 0 && <p>No restaurants found.</p>}
          </>
        )}

        {page === "myReviews" && (
          <section className="dashboard-card">
            <h2>My Reviews</h2>
            <button onClick={() => setPage("dashboard")}>Back to Dashboard</button>
            {myReviews.map((review) => (
              <div className="review-item" key={review._id}>
                <h3>{review.restaurant?.name || "Restaurant"}</h3>
                {editingReviewId === review._id ? (
                  <form className="inline-review-form" onSubmit={saveReviewEdit}>
                    <label>Rating</label>
                    <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                      {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>)}
                    </select>
                    <textarea value={reviewForm.comment} minLength={3} maxLength={1000} required onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
                    <button type="submit" disabled={loading}>Save Review</button>
                    <button type="button" className="cancel" onClick={() => setEditingReviewId(null)}>Cancel</button>
                  </form>
                ) : (
                  <><p>Rating: {review.rating}/5</p><p>{review.comment}</p>
                    <div className="review-actions"><button onClick={() => beginEditReview(review)}>Edit</button><button className="delete-button" disabled={loading} onClick={() => removeMyReview(review)}>Delete</button></div>
                  </>
                )}
              </div>
            ))}
            {myReviews.length === 0 && <p>No reviews submitted yet.</p>}
          </section>
        )}

        {role === "admin" && (
          <section className="admin-shortcuts">
            <button onClick={() => loadAdminReviews()}>Review Moderation</button>
            <button className="cancel" onClick={() => loadAdminUsers()}>User Management</button>
          </section>
        )}

        {page === "adminReviews" && role === "admin" && (
          <section className="dashboard-card">
            <div className="section-heading"><div><h2>Review Moderation</h2><p>Review customer feedback and remove inappropriate content.</p></div><button onClick={() => setPage("dashboard")}>Back to Dashboard</button></div>
            {adminReviews.length === 0 ? <p>No reviews found.</p> : adminReviews.map((review) => (
              <article className="review-item" key={review._id}>
                <h3>{review.restaurant?.name || "Restaurant"}</h3>
                <p><strong>Customer:</strong> {review.customer?.name || "Unknown"} ({review.customer?.email || "No email"})</p>
                <p><strong>Rating:</strong> {review.rating}/5</p><p>{review.comment}</p>
                <small>{review.createdAt ? new Date(review.createdAt).toLocaleString() : ""}</small>
                <div className="review-actions"><button className="delete-button" disabled={loading} onClick={() => removeAdminReview(review)}>Remove Review</button></div>
              </article>
            ))}
          </section>
        )}

        {page === "adminUsers" && role === "admin" && (
          <section className="dashboard-card">
            <div className="section-heading"><div><h2>User Management</h2><p>Create owner accounts and manage account access.</p></div><button onClick={() => setPage("dashboard")}>Back to Dashboard</button></div>
            <form className="owner-create-form" onSubmit={createOwnerAccount}>
              <h3>Create Restaurant Owner</h3>
              <input placeholder="Owner name" value={ownerAccountForm.name} required onChange={(e) => setOwnerAccountForm({ ...ownerAccountForm, name: e.target.value })} />
              <input type="email" placeholder="Owner email" value={ownerAccountForm.email} required onChange={(e) => setOwnerAccountForm({ ...ownerAccountForm, email: e.target.value })} />
              <input type="password" placeholder="Password (8–16 characters)" value={ownerAccountForm.password} minLength={8} maxLength={16} required onChange={(e) => setOwnerAccountForm({ ...ownerAccountForm, password: e.target.value })} />
              <button type="submit" disabled={loading}>Create Owner Account</button>
            </form>
            <h3 className="directory-heading">Platform Users ({adminUsers.length})</h3>
            {adminUsers.map((account) => (
              <div className="user-row" key={account._id}>
                <div><strong>{account.name}</strong><p>{account.email} · {account.role}</p></div>
                <div><span className={account.isActive ? "status-active" : "status-inactive"}>{account.isActive ? "Active" : "Inactive"}</span><button className={account.isActive ? "delete-button" : ""} disabled={loading || account._id === user.id} onClick={() => toggleUserStatus(account)}>{account.isActive ? "Deactivate" : "Activate"}</button></div>
              </div>
            ))}
          </section>
        )}

        {role === "owner" && (
          <section className="owner-dashboard">
            <div className="section-heading">
              <div><h2>My Restaurant Dashboard</h2><p>Manage your restaurant and monitor customer feedback.</p></div>
              <button onClick={() => loadOwnerRestaurants()}>Refresh Dashboard</button>
            </div>
            {ownerRestaurants.length === 0 ? (
              <div className="dashboard-card"><h2>No Restaurant Assigned</h2><p>Please contact the administrator to assign a restaurant to your account.</p></div>
            ) : (
              <>
                <div className="owner-restaurant-grid">
                  {ownerRestaurants.map((restaurant) => (
                    <article className="restaurant-card" key={restaurant._id}>
                      <div className="restaurant-icon">🍽️</div>
                      <h2>{restaurant.name}</h2>
                      <p>📍 {restaurant.location}</p><p>🍴 {restaurant.cuisine}</p>
                      <div className="owner-stats">
                        <div><strong>{Number(restaurant.averageRating || 0).toFixed(1)} / 5</strong><small>Average Rating</small></div>
                        <div><strong>{restaurant.totalReviews || 0}</strong><small>Total Reviews</small></div>
                      </div>
                      <button onClick={() => selectOwnerRestaurant(restaurant)}>Manage Restaurant</button>
                    </article>
                  ))}
                </div>
                {selectedOwnerRestaurant && (
                  <div className="owner-details">
                    <div className="section-heading"><div><h2>{selectedOwnerRestaurant.name}</h2><p>Update your restaurant information.</p></div></div>
                    <div className="restaurant-form-card">
                      <form className="restaurant-form" onSubmit={updateOwnerRestaurant}>
                        <div className="owner-field"><label>Description</label><textarea value={ownerForm.description} onChange={(e) => setOwnerForm({ ...ownerForm, description: e.target.value })} /></div>
                        <div className="owner-field"><label>Address</label><input value={ownerForm.address} onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })} /></div>
                        <div className="owner-field"><label>Phone Number</label><input value={ownerForm.phone} onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })} /></div>
                        <div className="form-actions">
                          <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
                          <button type="button" className="cancel" onClick={() => { setSelectedOwnerRestaurant(null); setOwnerReviews([]); }}>Close</button>
                        </div>
                      </form>
                    </div>
                    <div className="dashboard-card">
                      <h2>Customer Reviews</h2>
                      {ownerReviews.length === 0 ? <p>No customer reviews available yet.</p> : ownerReviews.map((review) => (
                        <div className="review-item" key={review._id}>
                          <h3>{review.customer?.name || "Customer"}</h3>
                          <p>⭐ {review.rating} / 5</p><p>{review.comment}</p>
                          <small>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {message && <p className="message">{message}</p>}
      </main>
    </div>
  );
}

export default App;
