const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Set the correct path to the data file
const dataPath = path.join(__dirname, 'data', 'data.txt');

//  Home page (already served from public/index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//  Contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

//  Handle form submission
app.post('/submit-form', (req, res) => {
  const { name = '', email = '', tasks = '' } = req.body;

  if (!name || !email || !tasks) {
    return res.status(400).send('All fields are required');
  }

  const entry = `<br>Name: ${name}<br>Email: ${email}<br>Tasks: ${tasks}<br>`;

  fs.appendFile(dataPath, entry, (err) => {
    if (err) {
      return res.status(500).send('Error saving data');
    }
    res.redirect('/services');
  });
});

//  Services page
app.get('/services', (req, res) => {
  fs.readFile(dataPath, 'utf-8', (err, rawData) => {
    if (err) return res.send('Error reading data');

    const entries = rawData
      .split('<br>')
      .filter(e => e.trim() !== '')
      .reduce((acc, curr, idx) => {
        const blockIdx = Math.floor(idx / 3);
        if (!acc[blockIdx]) acc[blockIdx] = [];
        acc[blockIdx].push(curr);
        return acc;
      }, []);

    const entryCards = entries.map((entry, index) => `
      <div class="card">
        ${entry.map(line => `<p>${line}</p>`).join('')}
        <form action="/delete/${index}" method="POST" onsubmit="return confirm('Delete this task?');">
          <button style="background-color: #c00; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 14px; margin-top: 10px; cursor: pointer;">
            Delete
          </button>
        </form>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Services</title>
        <style>
          body { font-family: sans-serif; background: #f0f0f0; padding: 40px; text-align: center; }
          .nav a { margin: 0 10px; text-decoration: none; color: #007BFF; font-weight: bold; }
          .card { background: white; max-width: 500px; margin: 20px auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: left; }
        </style>
      </head>
      <body>
        <h1>All Submissions</h1>
        <div class="nav">
          <a href="/">Home</a>
          <a href="/contact">Contact</a>
        </div>
        ${entryCards || "<p>No submissions yet.</p>"}
      </body>
      </html>
    `;

    res.send(html);
  });
});

//  Delete one task
app.post('/delete/:index', (req, res) => {
  const indexToDelete = parseInt(req.params.index);

  fs.readFile(dataPath, 'utf-8', (err, rawData) => {
    if (err) return res.status(500).send('Error reading data');

    const entries = rawData
      .split('<br>')
      .filter(e => e.trim() !== '')
      .reduce((acc, curr, idx) => {
        const blockIdx = Math.floor(idx / 3);
        if (!acc[blockIdx]) acc[blockIdx] = [];
        acc[blockIdx].push(curr);
        return acc;
      }, []);

    if (indexToDelete < 0 || indexToDelete >= entries.length) {
      return res.status(400).send('Invalid task index');
    }

    entries.splice(indexToDelete, 1);
    const updatedData = entries.map(entry => `<br>${entry.join('<br>')}<br>`).join('');

    fs.writeFile(dataPath, updatedData, (err) => {
      if (err) return res.status(500).send('Error deleting task');
      res.redirect('/services');
    });
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
