const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const db = require('./db');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Help Desk API',
      version: '1.0.0',
      description: 'A simple Help Desk API for managing tickets',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./server.js'], // Files containing annotations
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- Routes ---

/**
 * @swagger
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the ticket
 *         title:
 *           type: string
 *           description: The title of the ticket
 *         description:
 *           type: string
 *           description: The description of the ticket
 *         status:
 *           type: string
 *           description: The status of the ticket
 *           enum: [open, in-progress, closed]
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The creation date
 */

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Returns the list of all tickets
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: The list of the tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 */
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await db.getTickets();
    // Sort by created_at desc
    tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Create a new ticket
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ticket'
 *     responses:
 *       201:
 *         description: The ticket was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 */
app.post('/api/tickets', async (req, res) => {
  try {
    const { title, description, type, area } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const newTicket = {
      id: Date.now(), // Simple ID generation
      title,
      description: description || '',
      type: type || 'General Inquiry',
      area: area || 'IT Support',
      status: 'open',
      created_at: new Date().toISOString()
    };

    const tickets = await db.getTickets();
    tickets.push(newTicket);
    await db.saveTickets(tickets);

    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/tickets/{id}:
 *   put:
 *     summary: Update a ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ticket id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               area:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [open, in-progress, closed]
 *     responses:
 *       200:
 *         description: The ticket was updated
 *       404:
 *         description: The ticket was not found
 */
app.put('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, area, status } = req.body;
    
    const tickets = await db.getTickets();
    const ticketIndex = tickets.findIndex(t => t.id === parseInt(id));

    if (ticketIndex === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Update fields if provided
    if (title !== undefined) tickets[ticketIndex].title = title;
    if (description !== undefined) tickets[ticketIndex].description = description;
    if (type !== undefined) tickets[ticketIndex].type = type;
    if (area !== undefined) tickets[ticketIndex].area = area;
    if (status !== undefined) {
        const validStatuses = ['open', 'in-progress', 'closed'];
        if (validStatuses.includes(status)) {
            tickets[ticketIndex].status = status;
        }
    }

    await db.saveTickets(tickets);

    res.json(tickets[ticketIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/tickets/{id}:
 *   delete:
 *     summary: Remove the ticket by id
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ticket id
 *     responses:
 *       200:
 *         description: The ticket was deleted
 *       404:
 *         description: The ticket was not found
 */
app.delete('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let tickets = await db.getTickets();
    const ticketIndex = tickets.findIndex(t => t.id === parseInt(id));
    
    if (ticketIndex === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    tickets = tickets.filter(t => t.id !== parseInt(id));
    await db.saveTickets(tickets);

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
