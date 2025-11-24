const API_URL = '/api/tickets';

// DOM Elements
const ticketsGrid = document.getElementById('ticketsGrid');
const addTicketBtn = document.getElementById('addTicketBtn');
const ticketModal = document.getElementById('ticketModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const createTicketForm = document.getElementById('createTicketForm');
const filterTabs = document.querySelectorAll('.tab');
const modalTitle = document.querySelector('.modal-header h3');
const submitBtn = createTicketForm.querySelector('button[type="submit"]');

// State
let allTickets = [];
let currentFilter = 'all';
let isEditing = false;
let editingId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchTickets();
    setupEventListeners();
});

function setupEventListeners() {
    // Modal controls
    addTicketBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    ticketModal.addEventListener('click', (e) => {
        if (e.target === ticketModal) closeModal();
    });

    // Form submission
    createTicketForm.addEventListener('submit', handleFormSubmit);

    // Filters
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderTickets();
        });
    });
}

// API Calls
async function fetchTickets() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch tickets');
        allTickets = await response.json();
        renderTickets();
    } catch (error) {
        console.error('Error:', error);
        ticketsGrid.innerHTML = '<p class="error-msg">Failed to load tickets. Please try again.</p>';
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const type = document.getElementById('type').value;
    const area = document.getElementById('area').value;
    
    // Loading state
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    try {
        let response;
        if (isEditing) {
            response = await fetch(`${API_URL}/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, type, area })
            });
        } else {
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, type, area })
            });
        }

        if (!response.ok) throw new Error('Failed to save ticket');

        const savedTicket = await response.json();
        
        if (isEditing) {
            const index = allTickets.findIndex(t => t.id === editingId);
            if (index !== -1) allTickets[index] = savedTicket;
        } else {
            allTickets.unshift(savedTicket);
        }

        renderTickets();
        closeModal();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to save ticket');
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

async function deleteTicket(id) {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete ticket');

        allTickets = allTickets.filter(t => t.id !== id);
        renderTickets();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete ticket');
    }
}

// Rendering
function renderTickets() {
    ticketsGrid.innerHTML = '';

    const filteredTickets = allTickets.filter(ticket => {
        if (currentFilter === 'all') return true;
        return ticket.status === currentFilter;
    });

    if (filteredTickets.length === 0) {
        ticketsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem;">
                <i class="fa-regular fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No tickets found.</p>
            </div>
        `;
        return;
    }

    filteredTickets.forEach(ticket => {
        const card = createTicketCard(ticket);
        ticketsGrid.appendChild(card);
    });
}

function createTicketCard(ticket) {
    const div = document.createElement('div');
    div.className = 'ticket-card';
    
    const date = new Date(ticket.created_at).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    div.innerHTML = `
        <div class="ticket-header">
            <span class="ticket-id">#${ticket.id.toString().slice(-4)}</span>
            <span class="status-badge status-${ticket.status}">${ticket.status}</span>
        </div>
        <h3 class="ticket-title">${escapeHtml(ticket.title)}</h3>
        
        <div class="ticket-meta" style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
            <span class="badge" style="background: rgba(59, 130, 246, 0.1); color: #60a5fa; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">
                <i class="fa-solid fa-tag"></i> ${escapeHtml(ticket.type || 'General')}
            </span>
            <span class="badge" style="background: rgba(167, 139, 250, 0.1); color: #a78bfa; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">
                <i class="fa-solid fa-building"></i> ${escapeHtml(ticket.area || 'General')}
            </span>
        </div>

        <p class="ticket-desc">${escapeHtml(ticket.description || 'No description provided.')}</p>
        <div class="ticket-footer">
            <span class="ticket-date"><i class="fa-regular fa-clock"></i> ${date}</span>
            <div class="actions">
                <button class="edit-btn" onclick="openEditModal(${ticket.id})" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; margin-right: 10px;">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="delete-btn" onclick="deleteTicket(${ticket.id})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        </div>
    `;
    return div;
}

// Helpers
function openModal(ticketId = null) {
    ticketModal.classList.add('active');
    
    if (ticketId) {
        // Edit Mode
        isEditing = true;
        editingId = ticketId;
        modalTitle.textContent = 'Edit Ticket';
        submitBtn.textContent = 'Update Ticket';
        
        const ticket = allTickets.find(t => t.id === ticketId);
        if (ticket) {
            document.getElementById('title').value = ticket.title;
            document.getElementById('description').value = ticket.description || '';
            document.getElementById('type').value = ticket.type || 'General Inquiry';
            document.getElementById('area').value = ticket.area || 'IT Support';
        }
    } else {
        // Create Mode
        isEditing = false;
        editingId = null;
        modalTitle.textContent = 'Create New Ticket';
        submitBtn.textContent = 'Submit Ticket';
        createTicketForm.reset();
    }
}

function openEditModal(id) {
    openModal(id);
}

function closeModal() {
    ticketModal.classList.remove('active');
    createTicketForm.reset();
    isEditing = false;
    editingId = null;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Expose functions to global scope
window.deleteTicket = deleteTicket;
window.openEditModal = openEditModal;
