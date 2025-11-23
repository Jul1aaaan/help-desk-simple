const API_URL = '/api/tickets';

document.addEventListener('DOMContentLoaded', () => {
    fetchTickets();

    const form = document.getElementById('ticketForm');
    form.addEventListener('submit', handleCreateTicket);
});

async function fetchTickets() {
    const container = document.getElementById('ticketsContainer');
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch tickets');
        
        const tickets = await response.json();
        renderTickets(tickets);
    } catch (error) {
        container.innerHTML = `<div class="error">Error loading tickets: ${error.message}</div>`;
    }
}

function renderTickets(tickets) {
    const container = document.getElementById('ticketsContainer');
    
    if (tickets.length === 0) {
        container.innerHTML = '<div class="empty">No tickets found. Create one above!</div>';
        return;
    }

    container.innerHTML = tickets.map(ticket => `
        <div class="ticket-card">
            <div class="ticket-header">
                <div class="ticket-title">${escapeHtml(ticket.title)}</div>
                <span class="ticket-status status-${ticket.status.replace(' ', '-')}">${ticket.status}</span>
            </div>
            <div class="ticket-desc">${escapeHtml(ticket.description || 'No description')}</div>
            <div class="ticket-footer">
                <span>Created: ${new Date(ticket.created_at).toLocaleDateString()}</span>
                <div class="ticket-actions">
                    <select onchange="updateStatus(${ticket.id}, this.value)" class="btn-sm">
                        <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
                        <option value="in-progress" ${ticket.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Closed</option>
                    </select>
                    <button onclick="deleteTicket(${ticket.id})" class="btn-sm btn-delete">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function handleCreateTicket(e) {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const btn = e.target.querySelector('button');
    
    try {
        btn.disabled = true;
        btn.textContent = 'Creating...';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });

        if (!response.ok) throw new Error('Failed to create ticket');

        // Reset form and reload tickets
        e.target.reset();
        await fetchTickets();
    } catch (error) {
        alert('Error creating ticket: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Ticket';
    }
}

async function updateStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update status');
        
        // Refresh to show updated state (or we could just update DOM)
        await fetchTickets();
    } catch (error) {
        alert('Error updating status: ' + error.message);
    }
}

async function deleteTicket(id) {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete ticket');
        
        await fetchTickets();
    } catch (error) {
        alert('Error deleting ticket: ' + error.message);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Expose functions to window for onclick handlers
window.updateStatus = updateStatus;
window.deleteTicket = deleteTicket;
